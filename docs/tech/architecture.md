# Architektúra — core/apps, adat-elérés, read-only vs Prisma

> A megvalósult rendszer technikai leírása. A magas szintű döntéseket a gyökér `../architektura.md` (kurzus-melléklet) is összefoglalja; ez a fájl a tényleges kódra hivatkozik.

## Nx monorepo

Package-based Nx workspace, pnpm workspace-ekkel. Három projekt:

| Projekt | Típus | Felelősség |
|---------|-------|------------|
| `@plantbase/core` | lib | agent-logika: LLM-hívás, `runSql` tool, séma-prompt, naplózás |
| `@plantbase/db` | lib | Prisma: séma, migráció, kliens (rw), a seed betöltése |
| `@plantbase/cli` | app | belépési pont: `commander` + `node:readline` |

Taskok (`nx.json` targetDefaults): `build` (tsc `--noEmit` typecheck), `test` (Vitest), `lint` (ESLint flat config). Futtatás:

```bash
pnpm nx run-many -t build test lint
```

## Framework-agnosztikus core

A `packages/core` **nem ismeri a belépési pontokat** (CLI/API/web). Új felület = új app, nem a core újraírása. A CLI a `@plantbase/core` publikus API-ját hívja (`askAgent`, `echo`).

## Adat-elérés: két út, két jog

```text
                    ┌──────────────────────────────┐
   Prisma (rw)  ───▶│  DATABASE_URL  (plantbase)   │  séma, migráció, seed
                    └──────────────┬───────────────┘
                                   │  ugyanaz a Postgres
                    ┌──────────────┴───────────────┐
   runSql (ro)  ───▶│ DATABASE_URL_READONLY (…_ro) │  csak SELECT
                    └──────────────────────────────┘
```

- **Prisma** (`packages/db`) a read-write kapcsolaton viszi a sémát, migrációt, seedet. A `Product` modell mezői **snake_case**-ek (`@@map("products")`), hogy a kész seed (`prisma/plants.ts`, `prisma/seed.ts`) változtatás nélkül fusson, és a nyers SQL is a séma szerinti oszlopneveket lássa.
- **Az agent NEM Prismán kérdez.** A `runSql` egy **nyers `pg` (node-postgres) kapcsolat** a read-only szerepen (`packages/core/src/db/read-only.ts`). Kapcsolatonként egy `Client` (connect/end), hogy a CLI tisztán kilépjen.

## Saját agent-loop (nincs framework)

`packages/core/src/agent/ask-agent.ts` — kézzel írt tool-use loop az Anthropic SDK-ra (`claude-sonnet-5`), hogy a mechanika látható maradjon:

```text
for step in 0..MAX_STEPS(6):
    response = messages.create(system, messages, tools=[runSql])
    if stop_reason == "tool_use":
        minden runSql blokkra: assertSelectOnly → read-only query → tool_result
        messages += [assistant(content), user(tool_results)]
        continue
    else:
        answer = a szöveges blokkok  →  break
```

Fontos fájlok:

| Fájl | Szerep |
|------|--------|
| `agent/ask-agent.ts` | a tool-use loop, token-összegzés, naplózás |
| `agent/system-prompt.ts` | `<role>`, `<schema>`, `<rules>` (XML-szerű struktúra) |
| `agent/tools.ts` | a `runSql` tool Anthropic-definíciója |
| `agent/run-sql.ts` | SELECT-only guard + a lekérdezés futtatása |
| `db/read-only.ts` | nyers read-only `pg` kapcsolat |
| `logging/logger.ts` | JSONL naplózás (`logs/<timestamp>.jsonl`) |

## Védelmi rétegek (defense-in-depth)

1. **Elsődleges:** a read-only DB-szerep (`default_transaction_read_only = on`) — írás egyáltalán nem megy.
2. **Guard:** `assertSelectOnly` — egyetlen utasítás, kötelező `SELECT`/`WITH` kezdet, tiltott írás/DDL kulcsszavak, automatikus `LIMIT`.
3. **Prompt:** a `<rules>` explicit: csak SELECT, ILIKE, mindig LIMIT, `COALESCE(sale_price, price)`, ne találj ki oszlopot.

## Átláthatóság

- **Naplózás (FR4):** minden interakció `logs/<timestamp>.jsonl`-be, soronként egy esemény (`meta` a token-usage-dzsel, `system`, `message`-ek, `sql`, `rows`, `answer`). Windows-barát fájlnév (nincs `:`).
- **`--show-prompt` (FR5):** a CLI kiírja a teljes system promptot és üzenet-tömböt.
- **Nincs `console.log` a termékkódban:** a naplózás a loggeren megy; a CLI user-facing kimenete külön (`process.stdout`).

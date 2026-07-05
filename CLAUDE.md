# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mi ez

`plantbase` — parancssori AI agent, amely magyar természetes nyelvű kérdést SQL-re fordít a `products`
növény-katalógus felett, **read-only** lefuttatja, és NL választ ad. A termék-facing szöveg, az agent-promptok
és a commit-üzenetek **magyarul** vannak — tartsd ezt.

## Gyakori parancsok

```bash
pnpm install                                   # függőségek (Windows: ha EPERM a lockfile-on, futtasd újra)

docker compose up -d                           # lokális Postgres (hoszt-port 5433, NEM 5432)
pnpm --filter @plantbase/db run db:generate    # Prisma kliens (fresh clone után KELL, mielőtt a build zöld lenne)
pnpm --filter @plantbase/db run db:migrate     # migráció
pnpm --filter @plantbase/db run db:seed        # ~30 növény betöltése (idempotens)
pnpm --filter @plantbase/db run db:reset       # DB drop + migráció + seed újra

pnpm nx run-many -t build test lint            # a teljes ellenőrzés (build = tsc --noEmit typecheck)

# a CLI futtatása (tsx-szel, nincs build-lépés):
pnpm tsx apps/cli/src/main.ts ask "Melyik a 3 legolcsóbb pozsgás?"
pnpm tsx apps/cli/src/main.ts --show-prompt ask "..."   # a teljes prompt + tool-üzenetek kiírása
pnpm tsx apps/cli/src/main.ts                            # interaktív mód (exit-tel kilépsz)
```

Egyetlen projekt / egyetlen tesztfájl:

```bash
pnpm --filter @plantbase/core exec vitest run                          # csak a core tesztjei
pnpm --filter @plantbase/core exec vitest run src/agent/run-sql.test.ts  # egy fájl
pnpm --filter @plantbase/core exec vitest run -t "rejects the write"    # névre szűrve
```

## Architektúra — a nagy kép

Nx **package-based** monorepo (pnpm workspace), három projekttel:

- `packages/core` — az agent-logika (framework-agnosztikus, nem ismeri a belépési pontokat)
- `packages/db` — Prisma lib (séma, migráció, kliens, seed) — **NEM a repo gyökerében**
- `apps/cli` — a CLI (`commander` + `node:readline`), a `@plantbase/core`-t hívja

### Két DB-kapcsolat, két jog (ez a legfontosabb megérteni)

- **`DATABASE_URL`** (rw, `plantbase` owner) → **csak Prisma** használja (séma, migráció, seed).
- **`DATABASE_URL_READONLY`** (ro, `plantbase_ro` szerep) → **csak az agent `runSql`-je** használja, nyers
  `pg` (node-postgres) kapcsolaton (`packages/core/src/db/read-only.ts`). **Az agent SOHA nem Prismán kérdez.**

A read-only szerepet a `docker/initdb/01-readonly-role.sql` hozza létre (`default_transaction_read_only = on`).
Ez az init-script **csak üres volume-nál fut** → ha módosítod, `docker compose down -v` kell az újrainicializáláshoz.

### Az agent tool-use loopja

`packages/core/src/agent/ask-agent.ts` — kézzel írt tool-use loop az Anthropic SDK-ra (`claude-sonnet-5`,
`thinking: disabled`), agent-framework nélkül. A toolokat egy **registry** szolgáltatja
(`agent/tool-registry.ts`): `név → { definition, run }`, és a `toolDefinitions` tömb megy az API-nak.
Új tool hozzáadása = definíció a `agent/tools.ts`-ben + bejegyzés a registrybe (a loopot NEM kell módosítani).

Kétféle tool:
- `runSql` — az LLM ír SELECT-et; **három védelmi réteg**: (1) a read-only DB-szerep [elsődleges],
  (2) `assertSelectOnly` guard (`agent/run-sql.ts`: egyetlen utasítás, tiltott írás/DDL kulcsszavak, auto-`LIMIT`),
  (3) a system prompt szabályai.
- **dedikált toolok** (`listCategories`, `listOnSale`, `survivalChampion`) — FIX, kézzel kódolt read-only SELECT,
  nincs LLM-generált SQL. Az agent a system prompt `<tools>` routingja alapján választ közülük.

### System prompt és naplózás

- A system prompt a **kódban** él (`agent/system-prompt.ts`, `buildSystemPrompt()`), XML-szerű tagekkel
  (`<role>`, `<schema>`, `<tools>`, `<rules>`, `<examples>`). Nincs külön `.md` prompt-fájl; a `--show-prompt`
  élőben kiírja. A javítások indoklása: `docs/system-prompt.md`.
- Minden interakció JSONL-be: `logs/<timestamp>.jsonl` (`agent/logging/logger.ts`), soronként egy esemény
  (`meta` a token-usage-dzsel, `system`, `message`-ek, `sql`, `rows`, `answer`). A `logs/` gitignore-olt.

## Konvenciók, amiket a kód követ (és amiket könnyű elrontani)

- **ESM + `moduleResolution: Bundler`**; a kód `tsx`-szel fut, nincs emit — a „build" target `tsc --noEmit`
  typecheck. Ne várj `dist/`-et.
- A Prisma `Product` modell mezői **szándékosan snake_case**-ek (`@@map("products")`), hogy a kész seed
  (`packages/db/prisma/plants.ts`, `seed.ts`) változtatás nélkül fusson, és a nyers SQL is a séma szerinti
  oszlopneveket lássa. Ne alakítsd camelCase-re.
- **Környezet-betöltés:** a CLI a gyökér `.env`-et `dotenv/config`-gal tölti; a Prisma-parancsok `dotenv-cli`-vel
  (`dotenv -e ../../.env -- prisma ...`), mert a Prisma nem találja meg a gyökér `.env`-et a `packages/db`-ből.
- **pnpm build-scriptek:** a `pnpm-workspace.yaml` `allowBuilds`/`onlyBuiltDependencies` szakaszában az
  `esbuild`, `nx`, `prisma`, `@prisma/client`, `@prisma/engines` **`true`-n kell legyen**, különben a natív
  postinstall kimarad (`ERR_PNPM_IGNORED_BUILDS`), és pl. az `nx` nem fut. Egy supply-chain réteg időnként
  placeholder értékeket injektál ide — állítsd vissza `true`-ra.
- **Windows-barát naplófájlnév:** a logger a `:`-t lecseréli a timestampben; ne írj `:`-t fájlnévbe.

## Üzleti szabályok (a promptban is, tartsd konzisztensen)

Effektív ár mindig `COALESCE(sale_price, price)`; akciós ⇔ `sale_price IS NOT NULL`; raktáron ⇔ `stock > 0`.
A kategorikus mezők zárt értékkészletűek (l. `docs/tech/`, `docs/ddd/`).

## Dokumentáció

`README.md` (áttekintés), `docs/tech/` (infra, architektúra, api), `docs/ddd/` (szójegyzék, modell),
`docs/roi.md`, `docs/system-prompt.md`, `docs/plugins.md`, és a kurzus-mellékletek (`docs/brs-plantbase.md`, stb.).

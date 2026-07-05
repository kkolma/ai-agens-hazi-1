# 🌿 Plantbase

> Egy parancssori AI agent, amely **magyarul** válaszol a növény-katalógusodról — miközben te SQL helyett kávét iszol.

A `plantbase` fogja a természetes nyelvű kérdésedet („mi van akción 10 000 alatt, ami nem mérgezi meg a macskát?"), lefordítja SQL-re, **read-only** lefuttatja a katalógus felett, és emberi nyelven válaszol. Nem kell adatbázis-guru legyél. Nem kell `JOIN`-okról álmodnod. Csak kérdezz.

```text
$ plantbase ask "Melyik a 3 legolcsóbb pozsgás?"

A 3 legolcsóbb pozsgás növény:
  1. Echeveria – 1 500 Ft
  2. Pénzfa    – 2 200 Ft
  3. Aloe vera – 2 500 Ft
```

---

## ✨ Mit tud?

- **NL → SQL → NL.** Kérdezel magyarul, kapsz választ magyarul. A közte lévő SQL-t az agent írja, nem te.
- **Csak olvasni tud.** Az agent egy **read-only** adatbázis-szerepen fut, és egy SELECT-only guardon is átmegy minden lekérdezés. A katalógusodnak nem eshet baja, még ha nagyon szépen kéred, akkor sem.
- **Átlátható.** Minden interakció naplózódik (`logs/*.jsonl`): system prompt, üzenetek, a generált SQL, az eredmény és a token-felhasználás. A `--show-prompt` kapcsolóval pedig élőben megnézheted, mit lát az LLM.
- **Interaktív és egylövetű mód.** `plantbase ask "..."` egy gyors kérdésre, vagy indíts interaktív beszélgetést és kérdezz, amíg jólesik (`exit`-ig).
- **Őszinte.** Ha nincs találat, megmondja. Nem talál ki árakat. (Igen, ez manapság feature.)

---

## 🧠 Hogyan működik? (rétegről rétegre)

A projekt szándékosan három, egyre okosabb rétegben épült fel — így a mechanika végig látható marad, nem egy fekete doboz:

| Fázis | Mit csinál | LLM? | DB? |
|------:|------------|:----:|:---:|
| **B1** | Visszhang: amit beírsz, visszaírja | ❌ | ❌ |
| **B2** | Igazi LLM válaszol, de adat-kérdésnél őszintén szól, hogy nincs adatbázisa | ✅ | ❌ |
| **B3** | Bekötve a `runSql` tool: az agent SQL-t ír, lefuttatja, és valós választ ad | ✅ | ✅ |

A B3-ban az `askAgent` egy **kézzel írt tool-use loop** (nincs agent-framework, hogy a működés ne bújjon el egy library mögé):

```text
kérdés ──▶ LLM ──▶ „runSql: SELECT …" ──▶ [SELECT-only guard] ──▶ read-only Postgres
                        ▲                                                    │
                        └──────────────── sorok (JSON) ◀─────────────────────┘
                                            │
                                            ▼
                              természetes nyelvű válasz 🌱
```

### 🔧 Az agent tooljai

A `runSql` (szabad SELECT, guarddal) mellett **dedikált, kézzel kódolt toolok** is vannak — ezekre az agent a
system prompt tool-routingja alapján magától rátalál:

| Tool | Mit csinál |
|------|------------|
| `listCategories` | Felsorolja az összes kategóriát (`SELECT DISTINCT category`). |
| `listOnSale` | Az akciós növények, a legnagyobb megtakarítással előre. 💸 |
| `survivalChampion` | A legnehezebben elpusztítható növény — amit akárhogy elhanyagolsz, túléli. 🪴💀 |
| `runSql` | Minden egyéb adat-kérdés: az agent írja a SELECT-et. |

---

## 🏗️ Architektúra

Nx monorepo, három munkacsomaggal — mindegyik egy felelősség:

```text
plantbase/
├── packages/core   🧩 agent-logika: LLM-hívás, runSql tool, séma-prompt, naplózás
├── packages/db     🗄️ Prisma lib: séma, migráció, seed (NEM a gyökérben!)
├── apps/cli        💻 a CLI (commander + node:readline)
├── docker/         🐳 Postgres init (a read-only szerep itt születik)
└── docs/           📚 BRS, architektúra, konvenciók, dev-workflow
```

Két kulcsdöntés, amiért valaki egyszer hálás lesz:

1. **Két DB-kapcsolat, két jog.** A Prisma a `DATABASE_URL`-en (read-write) viszi a sémát és a seedet. Az agent `runSql`-je viszont a `DATABASE_URL_READONLY`-n, egy **külön, csak-SELECT** szerepen fut. Az agent nem Prismán kérdez — nyers `pg` kapcsolaton, hogy az adat-elérés is átlátható maradjon.
2. **A védelem a szerepben van, nem a promptban.** Az LLM-et rá lehet beszélni sok mindenre. Egy `default_transaction_read_only = on` Postgres-szerepet nem. A prompt és a guard csak a hab a tortán (defense-in-depth).

---

## 🧰 Stack

TypeScript (strict) · Nx · pnpm · Node LTS · PostgreSQL (Docker) · Prisma · [Anthropic SDK](https://www.anthropic.com/) (`claude-sonnet-5`) · Zod · commander · node-postgres · Vitest · ESLint + Prettier · tsx

---

## 🚀 Első indítás

### Amire szükséged lesz

- **Node** (LTS) és **pnpm**
- **Docker** (Docker Desktop / OrbStack) — a lokális Postgreshez
- Egy **`ANTHROPIC_API_KEY`** — a B2/B3 fázishoz (a B1 echo még nem kér kulcsot)

### Lépések

```bash
# 1) Függőségek
pnpm install

# 2) Titkok — másold a sablont és töltsd ki
cp .env.example .env
#   -> ANTHROPIC_API_KEY=sk-ant-...     (kötelező a B2/B3-hoz)
#   A DATABASE_URL / DATABASE_URL_READONLY alapból a lokális Dockerre mutat.

# 3) Indítsd a Postgres-t
docker compose up -d

# 4) Prisma kliens + séma + a kész seed (30 növény)
pnpm --filter @plantbase/db run db:generate
pnpm --filter @plantbase/db run db:migrate
pnpm --filter @plantbase/db run db:seed
```

> 💡 **Port-tipp:** a Postgres a **hoszt 5433** portján fut (az 5432 gyakran foglalt egy helyi Postgrestől). Ha nálad az 5433 is foglalt, írd át a `docker-compose.yml`-ben és a `.env`-ben.

---

## 🎮 Használat

```bash
# Egy gyors kérdés
pnpm tsx apps/cli/src/main.ts ask "Mi a legjobb értékelésű légtisztító növény?"

# Interaktív mód (exit-tel kilépsz)
pnpm tsx apps/cli/src/main.ts

# Lásd, mit lát az LLM (system prompt + üzenetek + a tool-hívások)
pnpm tsx apps/cli/src/main.ts --show-prompt ask "Van akciós olajfa?"
```

Pár kérdés, amivel villoghatsz:

- „Melyik a 3 legolcsóbb pozsgás?"
- „Mi van akción 10 000 Ft alatt, ami háziállat-barát?"
- „Melyik kezdőbarát növény bírja az árnyékot és ritkán kell öntözni?"
- „Van olyan kaktusz, ami 100 Ft-nál olcsóbb?" → (nincs, és ezt meg is mondja 😉)

Minden beszélgetés lecsapódik a `logs/<timestamp>.jsonl`-ben — ott a generált SQL is, ha kíváncsi vagy, mit főzött ki az agent.

---

## 🧪 Tesztek & minőség

```bash
pnpm nx run-many -t build test lint   # typecheck + Vitest + ESLint, mind a 3 csomagon
```

A SELECT-only guardnak külön tesztjei vannak: elfogad `SELECT`/`WITH`-et, és kereken elutasít minden `INSERT`/`UPDATE`/`DELETE`/`DROP`/`TRUNCATE`-et, a több-utasításos trükközést, meg a `SELECT ... INTO`-t is.

Akarod bizonyítva látni, hogy az agent tényleg nem tud írni? Tessék:

```bash
docker exec -e PGPASSWORD=plantbase_ro plantbase-db \
  psql -U plantbase_ro -d plantbase -c "INSERT INTO products(name) VALUES ('hehe');"
# ERROR: cannot execute INSERT in a read-only transaction  ✅
```

---

## 🗺️ A `products` séma dióhéjban

Kb. 30 realisztikus növény, valós fajnevekkel. A mezők (röviden):

`name`, `latin_name`, `category`, `location`, `price`, `sale_price`, `stock`, `light`, `watering`, `difficulty`, `current_height_cm`, `max_height_cm`, `current_pot_cm`, `pet_safe`, `kid_safe`, `air_purifying`, `rating`, `reviews_count`, `description`

Ár mindig `COALESCE(sale_price, price)` — az agent tudja a szabályt, neked nem kell.

---

## 🔭 Mi jön még (a kurzus során)

A v1 a katalógus felett dolgozik. A minta (LLM + tool + adat) viszont skálázódik: otthoni segéd → ecommerce → ügyfélszolgálat → logisztika. Később jöhet `apps/api`, `apps/web`, és az ajánlás-történet tárolása. Egyelőre viszont: kérdezz, és hagyd, hogy az agent SQL-ezzen helyetted.

---

## 📚 Dokumentáció

- [`CLAUDE.md`](CLAUDE.md) — belépő jövőbeli Claude Code példányoknak (parancsok + nagy képi architektúra).
- [`docs/roi.md`](docs/roi.md) — pénzbeli ROI egy 5 fős irodára (hard + soft + token-költség).
- [`docs/system-prompt.md`](docs/system-prompt.md) — a system prompt javítása, indoklással (baseline → javított).
- [`docs/plugins.md`](docs/plugins.md) — a használt pluginok / MCP-szerverek / skillek, indoklással.
- [`docs/tech/`](docs/tech) — infra, architektúra, API (CLI + runSql tool).
- [`docs/ddd/`](docs/ddd) — szójegyzék és domain-modell.
- [`docs/brs-plantbase.md`](docs/brs-plantbase.md), [`stack.md`](docs/stack.md), [`konvenciok.md`](docs/konvenciok.md), [`dev-workflow.md`](docs/dev-workflow.md) — a kurzus-mellékletek.

---

<div align="center">

*Made with 🌱 és egy egészséges adag „ne bízz az LLM-ben, adj neki read-only role-t".*

</div>

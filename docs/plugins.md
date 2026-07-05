# Pluginok, MCP-szerverek és skillek — mit használtunk és miért

> HF1 / 3. követelmény: min. 3 releváns plugin/skill, rövid indoklással. Alább a **telepített pluginok**
> (a kurzus-ajánlottak), majd a build közben ténylegesen használt **MCP-szerverek és skillek**.

## Telepített pluginok (a kurzus-ajánlottak)

### 1. superpowers

- **Mi:** fejlesztői workflow-plugin (TDD-ciklus, segédparancsok, „az alapoktól" mechanika).
- **Miért illik a projekthez:** a `konvenciok.md` TDD-t ír elő, ahol értelmes (piros → zöld → refaktor). A
  `runSql` **SELECT-only guardját** és a toolokat így teszteltük: előbb a bukó/elváró tesztek
  (`run-sql.test.ts`, `tools.test.ts`), majd a minimál implementáció. Kevesebb regresszió, magasabb lefedettség.

### 2. commit-commands

- **Mi:** Conventional Commits segédparancsok, kis, koherens lépések commitolásához.
- **Miért illik a projekthez:** a `dev-workflow.md` szerint minden befejezett lépés = egy kicsi, fókuszált commit,
  és a HF a követhető commit-historyt külön értékeli. A history végig `feat:`/`docs:`/`chore:` prefixű,
  egy-lépés-egy-commit ritmusban.

### 3. skill-creator

- **Mi:** saját skillek készítése a marketplace-en kívül.
- **Miért illik a projekthez:** a `dev-workflow.md` a `/docs` frissítését egy saját **`ddd-audit`** skillre bízza
  (git-history → docs). A skill-creator ennek az eszköze; a `docs/ddd/` és `docs/tech/` struktúra ebbe a
  dokumentációs folyamatba illeszkedik.

## Használt MCP-szerverek (a `.mcp.json`-ban konfigurálva)

### Context7 (MCP)

- **Mi:** naprakész library-dokumentáció (`resolve-library-id`, `query-docs`).
- **Miért illik a projekthez:** az `architektura.md` 7. pontja előírja, hogy új/ritka API-nál ELŐBB olvassuk be a
  doksit. A build **minden fázisánál** ezt tettük: Nx, Prisma, Anthropic TypeScript SDK, node-postgres,
  commander, node:readline → kevesebb hibás nekifutás a tesztek alatt.

### GitHub (MCP)

- **Mi:** repo-műveletek (`.mcp.json` → `github`, `Bearer ${GITHUB_PAT}`).
- **Miért illik a projekthez:** a HF kifejezetten kéri a github MCP-t; egységes felület a repo-kontextushoz.
  A `GITHUB_PAT` a gitignore-olt `.env`-ből jön, sosem a kódból.

## Használt skill

### claude-api

- **Mi:** az aktuális Anthropic API/SDK-tudás (modell-id-k, tool-use minták, buktatók).
- **Miért illik a projekthez:** a B2/B3 az `@anthropic-ai/sdk`-ra épül. Ennek alapján lett a modell a helyes
  `claude-sonnet-5`, a hívás a megfelelő `messages.create` + tool-use loop mintával — így kerültük el a
  betöltött, de elavult tudásból eredő hibákat (sampling-paraméterek, thinking-konfig).

---

> A titkok (`GITHUB_PAT`, `CONTEXT7_API_KEY`, `ANTHROPIC_API_KEY`) a gitignore-olt `.env`-ben vannak; a
> `.mcp.json` csak `${...}` placeholdereket tartalmaz, így a repo nem szivárogtat kulcsot.

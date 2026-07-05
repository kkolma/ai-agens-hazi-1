# Pluginok, MCP-szerverek és skillek — mit használtunk és miért

> HF1 / 3. követelmény: min. 3 releváns plugin/skill, rövid indoklással. Az alábbi három eszközt a projekt
> **ténylegesen használta** a build során. (A telepítés/konfiguráció a saját Claude Code-odban történik; az
> MCP-szerverek konfigja a repo `.mcp.json`-jában van, a titkok a gitignore-olt `.env`-ben.)

## 1. Context7 (MCP) — library-dokumentáció kódolás előtt

- **Mi:** MCP-szerver (`.mcp.json` → `context7`), amely naprakész library-doksit ad (`resolve-library-id`,
  `query-docs`).
- **Miért illik a projekthez:** az `architektura.md` 7. pontja előírja, hogy új/ritka API-nál ELŐBB olvassuk be
  a doksit, csak utána kódoljunk. A build során **minden fázisnál** ezt tettük: Nx (package-based workspace),
  Prisma (séma/migráció, `.env`-betöltés), Anthropic TypeScript SDK (tool-use, modell-id), node-postgres
  (read-only kapcsolat), commander és node:readline. Eredmény: kevesebb hibás nekifutás a tesztek alatt.

## 2. GitHub (MCP) — repo-műveletek

- **Mi:** MCP-szerver (`.mcp.json` → `github`, `Bearer ${GITHUB_PAT}`).
- **Miért illik a projekthez:** a HF kifejezetten kéri a github MCP-t. A repo-kontextus (issue-k, PR-ek, fájlok)
  eléréséhez ad egységes felületet; a `GITHUB_PAT` a `.env`-ből jön, sosem a kódból.

## 3. `claude-api` (skill) — az Anthropic SDK helyes használata

- **Mi:** skill, amely az aktuális Anthropic API/SDK-tudást adja (modell-id-k, tool-use minták, thinking/effort,
  gyakori buktatók).
- **Miért illik a projekthez:** a B2/B3 az `@anthropic-ai/sdk`-ra épül. A skill alapján lett a modell a helyes
  `claude-sonnet-5` string, a hívás a megfelelő `messages.create` + tool-use loop mintával, és így kerültük el a
  betöltött, de elavult tudásból eredő hibákat (pl. sampling-paraméterek, thinking-konfig).

---

## Kurzus-ajánlott pluginok (opcionális kiegészítés)

A 2. óra ezeket említi; ha telepíted a marketplace-ről, ezt adnák a workflow-hoz:

| Plugin | Mit adna |
|--------|----------|
| **superpowers** | TDD-workflow és segéd-parancsok (a `runSql` guardot például piros→zöld ciklusban lehetett volna írni). |
| **commit-commands** | Konzisztens Conventional Commits segédparancsok (a HF díjazza a fókuszált commit-historyt). |
| **skill-creator** | Saját skillek készítése (pl. a `dev-workflow.md`-ben említett `ddd-audit` a git-history → docs frissítéshez). |

> A fenti hármat a te Claude Code-odban telepítheted; a projekt maga nem függ tőlük futásidőben. A kötelező
> „min. 3" követelményt a ténylegesen használt Context7 + GitHub + claude-api már teljesíti.

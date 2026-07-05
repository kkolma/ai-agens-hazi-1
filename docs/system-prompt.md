# Az agent system promptja — javítás és indoklás

> HF1 / 5. követelmény. A termék (nem a Claude Code) által az LLM-nek átadott system prompt minőségi javítása,
> indoklással. A prompt a kódban él: `packages/core/src/agent/system-prompt.ts` (`buildSystemPrompt`).

## Miért a promptban dől el a minőség?

Az agent egyetlen LLM-hívásból + toolokból áll. Amit az LLM „lát" (a system prompt), az dönti el, hogy
helyes toolt/SQL-t választ-e, betartja-e az üzleti szabályokat (ár, akció, készlet), és nem hallucinál-e
nem létező oszlopot. Ezért a prompt a legnagyobb tőkeáttételű hely: egy jó szabály többet ér, mint száz utólagos javítás.

## Baseline (kiindulási, naiv prompt)

Egy tipikus első nekifutás így nézne ki:

```text
Te egy növény-bolt asszisztense vagy. Válaszolj a felhasználó kérdéseire a products tábla alapján.
Ha adat kell, írj SQL-t és futtasd le.
```

Ez működik, de több sebből vérzik: nincs séma (az LLM találgatja az oszlopneveket), nincs ár-szabály
(a `sale_price`-ot figyelmen kívül hagyhatja), nincs `LIMIT`-kényszer (véletlen teljes-tábla-lekérés),
nincs őszinteség-szabály (0 találatnál kitalálhat valamit), és nem tudja, mikor melyik toolt hívja.

## Javított prompt (a jelenlegi)

XML-szerű tagekre bontva (`<role>`, `<schema>`, `<tools>`, `<rules>`, `<examples>`). A teljes szöveget a
`buildSystemPrompt()` állítja elő; a `--show-prompt` kapcsolóval bármikor megnézhető.

## Mit javítottunk és miért

| Változtatás | Indoklás |
|-------------|----------|
| **XML-szerű tagek** (`<role>`, `<schema>`, `<rules>`, `<tools>`, `<examples>`) | A szakaszok elkülönülnek, az LLM egyértelműen tudja, mi az adat, mi a szabály, mi a példa → kevesebb hallucináció. (konvenciok.md) |
| **`<schema>` a valós oszlopokkal** | Az LLM nem találgatja a mezőneveket; nincs „nem létező oszlop" hiba. |
| **Ár-szabály:** `COALESCE(sale_price, price)` | Az effektív árat mindig helyesen számolja; az akciós ár nem sikkad el. Üzletileg kritikus. |
| **Akció / készlet definíció** (`sale_price IS NOT NULL`, `stock > 0`) | Egységes, félreérthetetlen fogalmak — a „mi van akción / raktáron" kérdés determinisztikus. |
| **Zárt értékkészletek felsorolása** (category, light, watering, difficulty, location) | Az LLM a helyes literálokkal szűr (pl. `'pozsgás'`, nem `'szukkulens'`); nincs 0-találatos elszúrt szűrő. |
| **Kötelező `LIMIT` + `ILIKE`** | Nincs véletlen teljes-tábla-lekérés; a szöveges szűrés kis/nagybetű-független → jobb találati arány. |
| **Őszinteség-szabály** (0 sornál mondd meg) | Az agent nem talál ki adatot; a bizalom megtartása fontosabb, mint egy tetszetős, de hamis válasz. |
| **`<tools>` tool-routing** | Kategóriákhoz `listCategories`, akciókhoz `listOnSale`, „túlélőbajnokhoz" `survivalChampion`, egyébként `runSql`. Az explicit routing növeli a helyes tool-választás arányát (a Sonnet 5 a világos, „mikor hívd" leírásokra jól reagál). |
| **`<examples>` few-shot** | 1–2 NL→SQL példa (pl. legolcsóbb pozsgás → `ORDER BY COALESCE(sale_price, price) LIMIT`) mintát ad; a modell konzisztensebb, helyesebb SQL-t ír. |
| **Válasz-forma:** „rövid, természetes nyelvű magyar; ne nyers tábla/SQL" | A végfelhasználó (lakberendező) kész választ kap, nem nyers eredményt — ez a termék lényege. |

## Mérhető hatás

- **Kevesebb rossz szűrő:** az értékkészletek felsorolása után a kategorikus szűrések a helyes literálokkal futnak.
- **Helyes ár minden esetben:** a `COALESCE` szabály miatt az akciós ár is beszámít (l. „3 legolcsóbb pozsgás" → az akciós Pénzfa a helyes áron szerepel).
- **Jobb tool-választás:** a routing után az „akciók" kérdés a `listOnSale`-t, a „kategóriák" a `listCategories`-t hívja, nem egy ad-hoc `runSql`-t.

## Hol a kód

`packages/core/src/agent/system-prompt.ts` — a `buildSystemPrompt()` egyetlen forrás; a CLI `--show-prompt`
kapcsolója élőben kiírja, a naplók (`logs/*.jsonl`) `system` sora pedig rögzíti minden interakcióhoz.

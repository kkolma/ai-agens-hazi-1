# API-felület — CLI és a runSql tool

> A rendszer két „felülete": a felhasználó felé a **CLI**, az LLM felé a **runSql tool**.

## CLI (`apps/cli`)

`commander`-alapú program, `plantbase` névvel. Futtatás fejlesztés közben:

```bash
pnpm tsx apps/cli/src/main.ts <parancs> [opciók]
```

### Parancsok

| Parancs | Leírás |
|---------|--------|
| `ask <kerdes>` | Egyszeri kérdés. Az agent válaszol (B3: SQL-lel a katalóguson). |
| `chat` *(alapértelmezett)* | Interaktív `readline` mód. Kérdésenként válasz; `exit`-ig fut. |

Parancs nélkül a `chat` indul (interaktív mód).

### Globális opciók

| Opció | Hatás |
|-------|-------|
| `--show-prompt` | A teljes prompt kiírása: `<system>` + az üzenet-tömb (a tool-hívásokkal együtt). (FR5) |
| `-V, --version` | Verzió. |
| `-h, --help` | Súgó. |

### Példák

```bash
plantbase ask "Melyik a 3 legolcsóbb pozsgás?"
plantbase --show-prompt ask "Mi van akción 10000 Ft alatt, ami pet-safe?"
plantbase            # interaktív mód
```

### Viselkedés / hibakezelés

- Hiányzó `ANTHROPIC_API_KEY` → beszédes, fail-fast hiba (nem homályos SDK-hiba).
- Hiányzó `DATABASE_URL_READONLY` vagy nem futó DB → a `runSql` beszédes hibát ad, amit az agent tool-eredményként kap.
- Üres interaktív input → újra prompt (nincs hívás).

## runSql tool (az LLM felé)

Az agent egyetlen toolja. Anthropic tool-definíció (`agent/tools.ts`):

```json
{
  "name": "runSql",
  "description": "Read-only SQL lekérdezés a products katalóguson. CSAK egyetlen SELECT (vagy WITH ... SELECT). Az eredmény sorai JSON-ként térnek vissza.",
  "input_schema": {
    "type": "object",
    "properties": { "sql": { "type": "string" } },
    "required": ["sql"],
    "additionalProperties": false
  }
}
```

### SELECT-only guard (`agent/run-sql.ts`)

A tool minden hívásnál átfut az `assertSelectOnly`-n, mielőtt a DB-hez érne:

1. **Zod-validáció:** `sql` nem üres string.
2. **Egyetlen utasítás:** a záró `;` levágva; ha marad `;` a belsejében → elutasítás.
3. **Kötelező kezdet:** a lekérdezésnek `SELECT`-tel vagy `WITH`-tel kell kezdődnie.
4. **Tiltott kulcsszavak:** `insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|merge|call|vacuum|analyze|reindex|into` (szóhatáron) → elutasítás.
5. **Auto-LIMIT:** ha nincs `LIMIT`, a guard hozzátesz egy `LIMIT 100`-at.

A validált SQL a read-only kapcsolaton fut; a sorok JSON-ként kerülnek vissza az LLM-hez `tool_result`-ként.

### System prompt szerződése

Az LLM a `<schema>`-ból tudja a `products` oszlopait, a `<rules>`-ból pedig az üzleti szabályokat: csak SELECT, ILIKE szöveges szűrésre, mindig LIMIT, ár = `COALESCE(sale_price, price)`, akciós = `sale_price IS NOT NULL`, raktáron = `stock > 0`, ne találj ki oszlopot, és a sorokból adj rövid, természetes nyelvű választ.

## Napló-formátum (JSONL)

Egy interakció egy fájl: `logs/<timestamp>.jsonl`, soronként egy esemény.

```jsonl
{"type":"meta","timestamp":"…","model":"claude-sonnet-5","usage":{"inputTokens":…,"outputTokens":…}}
{"type":"system","content":"<role>…</role>…"}
{"type":"message","role":"user","content":"<question>…</question>"}
{"type":"message","role":"assistant","content":[{"type":"tool_use","name":"runSql",…}]}
{"type":"message","role":"user","content":[{"type":"tool_result",…}]}
{"type":"sql","content":"SELECT … LIMIT 100"}
{"type":"rows","content":[ … ]}
{"type":"answer","content":"A 3 legolcsóbb pozsgás…"}
```

# Szójegyzék — ubiquitous language

> A domain közös nyelve. Ugyanezeket a fogalmakat használjuk a kódban, a promptban és a beszélgetésben. (A struktúrát a `dev-workflow.md` írja elő; a technikai részletek: `../tech/`.)

## Domain-fogalmak

| Fogalom | Angol / kód | Jelentés |
|--------|-------------|----------|
| **Növény / termék** | `Product`, `products` tábla | A katalógus központi entitása. Egy sor = egy megvásárolható növény. |
| **Katalógus** | catalog | A `products` tábla összessége. A v1 kizárólag e felett dolgozik (nincs rendelés, bevétel). |
| **Köznapi név** | `name` | A növény magyar, hétköznapi neve (pl. „Vitorlavirág"). |
| **Latin név** | `latin_name` | A faj tudományos neve (pl. `Spathiphyllum wallisii`). |
| **Kategória** | `category` | Értékkészlet: szobanövény, kerti, pozsgás, kaktusz, fűszer, fa-cserje, lógó, virágzó. |
| **Elhelyezés** | `location` | Értékkészlet: beltéri, kültéri, mindkettő. |
| **Fényigény** | `light` | Értékkészlet: árnyék, alacsony, közepes, erős, direkt nap. |
| **Öntözés** | `watering` | Értékkészlet: ritka, közepes, gyakori, állandóan nedves. |
| **Nehézség** | `difficulty` | Gondozási igény: kezdő, haladó, profi. |
| **Ár** | `price` | Alapár HUF-ban. |
| **Akciós ár** | `sale_price` | Akciós ár, ha van akció; különben `null`. **Akciós**, ha `sale_price IS NOT NULL`. |
| **Effektív ár** | — | Mindig `COALESCE(sale_price, price)`. Az agent ezt a szabályt ismeri. |
| **Készlet** | `stock` | Raktáron lévő darabszám. **Raktáron**, ha `stock > 0`. |
| **Méret** | `current_height_cm`, `max_height_cm`, `current_pot_cm` | Aktuális és kifejlett magasság, aktuális cserépméret (cm). |
| **Háziállat-barát** | `pet_safe` | Boolean: nem mérgező háziállatra. |
| **Gyerekbiztos** | `kid_safe` | Boolean: nem mérgező. |
| **Légtisztító** | `air_purifying` | Boolean: javítja a levegő minőségét. |
| **Értékelés** | `rating`, `reviews_count` | 0–5 közötti pontszám és a vélemények száma. |

## Agent-fogalmak

| Fogalom | Jelentés |
|--------|----------|
| **Agent** | A `plantbase` maga: LLM + tool + adat. A természetes nyelvű kérdést válasszá alakítja. |
| **askAgent** | A core belépési pontja: kézzel írt tool-use loop (agent-framework nélkül). |
| **runSql (tool)** | Az agent egyetlen toolja: egy `SELECT`-et futtat a katalóguson, és a sorokat adja vissza. |
| **read-only** | Az agent kizárólag olvasni tud (külön DB-szerep + SELECT-only guard). Írás/DDL tilos. |
| **system prompt** | Az LLM-nek átadott, XML-szerű tagekkel strukturált instrukció (`<role>`, `<schema>`, `<rules>`). |
| **seed** | A ~30 realisztikus növény induló adata (`packages/db/prisma/plants.ts`). |
| **napló (log)** | Minden interakció JSONL-je (`logs/<timestamp>.jsonl`): prompt, üzenetek, SQL, eredmény, tokenek. |

## Persona

- **Lakberendező** — a felhasználó. Szobák adottságai + ügyfél igényei + katalógus alapján állít össze növénycsomagot. Célja, hogy SQL-tudás nélkül, gyorsan (KPI: < 5 perc/szoba) kapjon pontos ajánlást.

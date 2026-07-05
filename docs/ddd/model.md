# Domain-modell — entitások, value objectek, aggregátumok

> A `products` katalógus domainjének modellje. A v1 egy **read-only, egyaggregátumos** domain: nincs írás, nincs tranzakciós összetettség.

## Aggregátum: Product (katalógus-tétel)

A `Product` az egyetlen **aggregate root**. Önálló, konzisztens egység; a katalógus `Product`-ok halmaza. Nincs a v1-ben olyan entitás, amely egy `Product`-hoz tartozna gyerekként (rendelés, ajánlás-történet: későbbi órák).

**Identitás:** `id` (serial, felszíni kulcs). Két növény akkor is különböző, ha minden más mezőjük egyezik.

**Perzisztencia:** Prisma `Product` modell → `@@map("products")`. A mezőnevek szándékosan **snake_case**-ek, hogy a kész seed és a nyers SQL is ugyanazokat az oszlopneveket lássa (lásd `../tech/architecture.md`).

## Value objectek (fogalmi szinten)

A v1-ben ezek a `Product` primitív mezőiként élnek, de fogalmilag value objectek — érték szerint azonosak, immutábilisak:

| Value object | Kód | Megkötés |
|--------------|-----|----------|
| **Ár** | `price`, `sale_price` | HUF; az effektív ár `COALESCE(sale_price, price)`. `sale_price` opcionális. |
| **Kategória** | `category` | Zárt értékkészlet (string literal union, nem `enum` — lásd `konvenciok.md`). |
| **Elhelyezés** | `location` | Zárt értékkészlet: beltéri / kültéri / mindkettő. |
| **Gondozási profil** | `light`, `watering`, `difficulty` | Zárt értékkészletek együtt írják le a gondozási igényt. |
| **Méret** | `current_height_cm`, `max_height_cm`, `current_pot_cm` | Egész cm. Aktuális ≤ kifejlett magasság (üzleti invariáns). |
| **Biztonsági jelzők** | `pet_safe`, `kid_safe`, `air_purifying` | Boolean-ök; a szűrés gyakori dimenziói. |
| **Értékelés** | `rating` (0–5), `reviews_count` | A `rating` a `reviews_count` véleményből aggregált pontszám. |

## Invariánsok

- **Effektív ár:** ahol árat mutatunk vagy szűrünk, `COALESCE(sale_price, price)` a mérvadó.
- **Akciós ⇔ `sale_price IS NOT NULL`.**
- **Raktáron ⇔ `stock > 0`.**
- **Zárt értékkészletek:** a kategorikus mezők csak a `glossary.md`-ben felsorolt értékeket vehetik fel.
- **Read-only a v1-ben:** a domain nem módosul futásidőben. Az egyetlen írási út a Prisma seed/migráció (fejlesztői, nem az agent).

## Domain-folyamat: kérdés → válasz

Nem CRUD, hanem egy lekérdező folyamat (a `runSql` tool köré szervezve):

```text
NL kérdés
   → az agent SELECT-et fogalmaz a <schema> és <rules> alapján
   → SELECT-only guard (egyetlen olvasó utasítás, auto-LIMIT)
   → read-only lekérdezés a katalóguson
   → sorok (JSON)
   → NL válasz az effektív-ár / akció / készlet szabályok szerint
```

Ez a folyamat a `packages/core` felelőssége; részletek: `../tech/architecture.md` és `../tech/api.md`.

# ROI — a plantbase agent megtérülése (5 fős lakberendező iroda)

> HF1 / 4. követelmény. Pénzbeli, számokkal alátámasztott megtakarítás. Minden szám mellett ott a forrás
> vagy a becslés. A modell szándékosan **konzervatív**: inkább alábecsül, mint túlígér.

## Kiindulási feltételezések

| Paraméter | Érték | Forrás / becslés |
|-----------|-------|------------------|
| Fő az irodában | 5 | a feladat kerete |
| Szoba / fő / hó | 15 (≈5 ügyfél × 3 szoba) | BRS (ROI/mérőszámok) |
| **Szoba / iroda / hó** | **75** | 15 × 5 |
| Kézi idő / szoba | 12,5 perc | BRS: 10–15 perc, a közepe |
| Agenttel / szoba | 4 perc | BRS KPI: < 5 perc |
| **Megtakarított idő / szoba** | **8,5 perc** | 12,5 − 4 |
| Terhelt órabér | 8 000 Ft/óra | konzervatív hazai becslés (lakberendező) |
| Beszerzési kosár / szoba | 30 000 Ft | becslés (növénycsomag/szoba) |
| „Olcsóbb kosár" megtakarítás | 3% | az agent olcsóbb alternatívát talál + figyeli az akciókat (BRS) |
| LLM token-költség | ~2 000 Ft/hó | a `logs/*.jsonl` `usage` alapján, bőven felülbecsülve (lásd lent) |

## Hard ROI (forintosítható)

### 1) Időmegtakarítás

```
75 szoba/hó × 8,5 perc = 637,5 perc/hó ≈ 10,6 óra/hó
10,6 óra × 8 000 Ft/óra ≈ 85 000 Ft/hó
```

### 2) Olcsóbb kosár (jobb ár-érték + akciók)

```
75 szoba/hó × 30 000 Ft = 2 250 000 Ft beszerzés/hó
2 250 000 Ft × 3%       ≈ 67 500 Ft/hó
```

### Összesített hard megtakarítás

| Tétel | Havi | Éves |
|-------|-----:|-----:|
| Időmegtakarítás | 85 000 Ft | 1 020 000 Ft |
| Olcsóbb kosár | 67 500 Ft | 810 000 Ft |
| **Bruttó megtakarítás** | **152 500 Ft** | **1 830 000 Ft** |
| − LLM token-költség | −2 000 Ft | −24 000 Ft |
| **Nettó megtakarítás** | **≈ 150 500 Ft** | **≈ 1 806 000 Ft** |

## Költségoldal — miért elhanyagolható a token-költség?

Egy tipikus interakció a naplók (`logs/*.jsonl` → `meta.usage`) szerint nagyságrendileg 1 500–2 500 input és
300–600 output token, tool-körökkel együtt. Sonnet 5 áron (konzervatívan $3 / $15 per millió token) ez
kérdésenként **~5 Ft** körül van. Még bőkezűen 3 kérdés/szoba × 75 szoba = 225 kérdés/hó mellett is
**~1 000–2 000 Ft/hó** — a megtakarítás töredéke. (A fejlesztés egyszeri költsége itt már kész, elsüllyedt.)

## Soft ROI (valós, de nehezen forintosítható)

- **Gyorsabb, pontosabb ajánlat** → az ügyfél hamarabb dönt, magasabb megkötési arány.
- **Jobb illeszkedés** a tér és az igények közé (méret, fény, pet/kid-safe) → kevesebb visszáru, elégedettebb ügyfél.
- **SQL-tudás nélkül** önkiszolgáló analitika → nem kell adat-szakértőt bevonni.
- **Skálázhatóság** → ugyanaz a minta (LLM + tool + adat) viszi tovább ecommerce / ügyfélszolgálat / logisztika felé.

## Érzékenység (ha a feltételezések óvatosabbak)

| Változtatás | Hatás a havi nettóra |
|-------------|----------------------|
| Órabér 6 000 Ft | időmegtakarítás ~63 700 Ft → nettó ~129 000 Ft/hó |
| Kosár-megtakarítás 2% | olcsóbb kosár 45 000 Ft → nettó ~128 000 Ft/hó |
| Csak időmegtakarítás (0% kosár) | nettó ~83 000 Ft/hó → ~996 000 Ft/év |

Még a legszigorúbb esetben is (csak idő, alacsony órabér) **~750 000–1 000 000 Ft/év** nettó megtakarítás,
elhanyagolható futásidejű költséggel. A KPI (szoba < 5 perc) teljesül.

# PDX Tree Layer Schemas (recon 2026-07-15)

All layers under `https://www.portlandmaps.com/od/rest/services/COP_OpenData_Environment/MapServer`.
Query pattern: `{layer}/query?where=…&outFields=*&outSR=4326&f=geojson&resultOffset=N&resultRecordCount=1000`,
paginate until `exceededTransferLimit` is absent/false (fallback: stop when a page returns < 1000 features).

## Layer 26 — Heritage Trees

| Field | Notes |
|---|---|
| `TREEID` | Heritage tree number (int). **Null for STATUS='Merit' rows** — fall back to OBJECTID for ids. Maps to portlandwild.com/tree/{TREEID}. |
| `STATUS` | `Heritage` \| `Merit` \| `Removed`. Exclude `Removed`. |
| `SCIENTIFIC` / `COMMON` | e.g. `Sequoiadendron giganteum` / `Giant sequoia` |
| `HEIGHT` | feet (int) |
| `DIAMETER` | **inches** (DBH). Verified: tree #307 DIAMETER 88 in → 88π ≈ 276 in ≈ 23 ft = CIRCUMF 23.1 |
| `CIRCUMF` | **feet** (float) |
| `SITE_ADDRESS`, `Neighborhood`, `YEAR_Designated` | strings/int |
| `Tree_fact_short`, `Species_fact_short` (+ `_long` variants) | curated blurbs |
| `Owner_name`, `Owner_address` | present but **not used** (privacy) |
| Geometry | point, native wkid 102100; request `outSR=4326` |

## Layer 1415 — Street Tree Inventory (Active Records)

200k+ rows; always filter server-side.

| Field | Notes |
|---|---|
| `SPECIES` | combined string: `"Sequoiadendron giganteum - giant sequoia"` |
| `DIAMETER` | inches (DBH) |
| `Condition` | e.g. Good/Fair/Poor |
| `Address`, `Neighborhood`, `Date_Inventoried` | |
| (no height field) | |

Distinct values matching `%SEQUOIA%`/`%REDWOOD%` (verified — no false positives):
`Sequoia sempervirens - coast redwood`, `Metasequoia glyptostroboides - dawn redwood`,
`Sequoiadendron giganteum - giant sequoia`.

## Layer 220 — Parks Tree Inventory

| Field | Notes |
|---|---|
| `Genus_species` / `Common_name` | separate fields, e.g. `Sequoia sempervirens` / `coast redwood` |
| `DBH` | inches |
| `TreeHeight` | feet |
| `Condition` | |
| `Notes`, `Species_factoid` | |
| (no street address; park context only via geometry) | |

Distinct values matching the wide LIKE net: only the three target taxa (verified).

## Target taxa → internal keys

| Scientific | Common | Key |
|---|---|---|
| Sequoiadendron giganteum | giant sequoia | `sequoiadendron` |
| Sequoia sempervirens | coast redwood | `sequoia` |
| Metasequoia glyptostroboides | dawn redwood | `metasequoia` |

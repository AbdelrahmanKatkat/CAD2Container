# CAD Analysis Report (Phase 1)

Method: DWG (AC1032) -> DXF via LibreDWG 0.14 `dwg2dxf` -> `ezdxf` 1.4.5 (`tools/extract.py`).
Per-file raw data (every dim/text/circle/insert with entity handle): `reports/d1..d4.json`. Renders: `reports/d*_model.png`.
Tags: **V** verified (read from entity), **D** derived, **I** inferred (needs confirmation), **U** unknown.
Units: user confirmed **mm** (INSUNITS in file says inches for d1-d3, mm-code for d4: header is unreliable).

## Files
| id | file | model ents | dims | 3D ents | role |
|---|---|---|---|---|---|
| d1 | C32 ISO202026 | 28,060 | 25 | 0 | ISO 20' container, "Generating set container 6085x2438x2500mm" (V, text). Mostly imported library geometry. |
| d2 | Enclosure 3512 (3x7x3.5 m) | 1,064 | 132 | 0 | Front/Left/Right/Rear/Top + Section A-A. Overall dim blocks read 7000, 3000, 3500 (V). |
| d3 | Enclosure 3516 (3x7x3.5 m) | 734 | 128 | 0 | Same view set. **Contains a 19-row BOM table** (V). |
| d4 | Drop Over C27 | 611 | 79 | 0 | Overall dim blocks read 7350, 2550, 2450 (V). |

All four are pure 2D (V). Layers/blocks do not identify parts: most geometry is on layer `0`, block names are meaningless (`yfy`, `MMMMMMMMMMM` x216) (V). Do not map blocks to parts.

## 3516 BOM (V, text entities) - the only drawing with named items
1 Customized enclosure x1 · 2 Genset 3516 x1 · 3 Exhaust muffler x1 · 4 Remote radiator x1 · **5 Service Single Door x2** · 6 Emergency Stop x2 · **7 Inlet Louvers x2** · 8 Outlet Ventilation Fan x2 · **9 Outlet Louvers x2** · **10 Drain Box x1** · **11 Cable Entry x1** · 12 MCC panel · 13 Fire panel · 14 Fire box · 15 Batteries · 16 Battery charger · 17 Fuel separator · **18 Inlet motorized Louvers x2 · 19 Outlet motorized Louvers x2**
(Quantities read column-wise from the render; confirm against `d3.json` before use: I.)

d2 and d4 have 20 / 18 numbered balloons but **no BOM text was decoded** (U): the table may be in an entity LibreDWG skipped.

## Mapping of your 10 parts to the drawings
| your part | found in drawings | status |
|---|---|---|
| Single Door | d3 item 5 ("Service Single Door") | V name; size I (must be measured from the door view) |
| Double Door | not found | U (SW_sample has `Full Single Door`, container doors) |
| Ladder | not found | U (SW_sample `Laddar design_V2`) |
| Fixed Louvers | d3 items 7, 9 (Inlet/Outlet Louvers) | V name |
| Cable Entry | d1 + d3 item 11 | V name |
| Drain Access | d3 item 10 "Drain Box" | I that this is the same thing |
| Floor Water Drains | not found | U (position is your variable input) |
| Door Alarm | not found | U |
| Sand Trap | not found | U |
| Motorized Louver | d3 items 18, 19 | V name |

So the drawings drive **5 of 10** parts by name; the other 5 will need defaults from your SolidWorks samples plus your inputs.

## Ambiguities / limits
- LibreDWG warned on DIMASSOC / ACDBASSOCDEPENDENCY objects and skipped some: counts may be incomplete (confirm one file with ODA File Converter).
- Dimension measurements are real geometry (V); `*D###` blocks hold only the displayed text.
- Which dimension belongs to which part needs the per-view region mapping (next step: you point at regions on the renders, or we pick by coordinates).

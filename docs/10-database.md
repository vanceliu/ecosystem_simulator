# 10 資料庫

## 1. 技術

| 項目 | 規格 |
|---|---|
| 引擎 | SQLite WASM（`@sqlite.org/sqlite-wasm`） |
| 持久化 | OPFS，VFS `opfs-sahpool`；不需 COOP/COEP 標頭 |
| 執行位置 | 模擬 Web Worker 內；唯一連線 |
| 檔名 | `ecosim.sqlite3` |
| 結構版本 | `PRAGMA user_version` |
| 參考資料版本 | `meta.reference_version` |
| Vite | `optimizeDeps.exclude: ['@sqlite.org/sqlite-wasm']` |

- 引擎層（`src/engine`、`src/generation`）不存取資料庫；worker 啟動時將參考資料載入記憶體，以型別化物件傳入引擎。
- OPFS 不可用時（私密模式、舊瀏覽器）改用記憶體資料庫，UI 顯示「無法永久保存」警示。
- 第二個分頁開啟時無法取得連線，UI 顯示「已在其他分頁開啟」並停用模擬。

## 2. 資料表

### 2.1 參考資料（`ref_`）

來源：`src/content` 型別化資料。`tools/build-reference-sql.ts` 產生 `db/reference.sql`；worker 啟動時若 `meta.reference_version` 與程式內版本不符，於單一交易內清空並重新匯入全部 `ref_` 表。

| 表 | 主鍵 | 欄位 |
|---|---|---|
| `ref_archetype` | `id` | `name_zh`、`layer`、`category`、`kind`（biomass／cohort）、`zone`（water／land／both）、`salinity_min`、`salinity_max`、`senescence`、`recruitment` |
| `ref_life_history` | `archetype_id` | `lifespan_min_d`、`lifespan_typ_lo_d`、`lifespan_typ_hi_d`、`lifespan_max_d`、`game_cap_d`、`maturity_min_d`、`maturity_max_d`、`size_min_mm`、`size_max_mm`、`mass_min_mg`、`mass_max_mg`、`density_typ_lo`、`density_typ_hi`、`density_max`、`density_unit`、`min_enclosure_json`、`confidence` |
| `ref_vector` | `(archetype_id, vector)` | `lambda` |
| `ref_locus` | `(archetype_id, locus)` | `position`、`allele_count`、`ordered` |
| `ref_allele` | `(archetype_id, locus, allele_index)` | `label_zh`、`base_weight`、`params_json` |
| `ref_climate` | `(latitude_zone, moisture, continentality)` | `koppen`、`station`、`station_elevation_m`、`t_ann`、`t_warm`、`t_cold`、`warm_month`、`dtr`、`rh_wet`、`rh_dry`、`precip_annual`、`wet_months_json`、`frost_days`、`selectable`、`basis` |
| `ref_habitat` | `id` | `name_zh`、`recommend_json`（[11](11-geography-climate.md) §5.1）、`allowed_json`（§5.2）、`features_json`（潮汐、季節乾涸） |
| `ref_realm` | `code` | `name_zh`、`ocean_regions_json` |
| `ref_archetype_realm` | `(archetype_id, realm_or_ocean)` | `basis`、`source_id` |
| `ref_naming` | `(archetype_id, part, idx)` | `text`（字根、字尾、通稱） |
| `ref_source` | `id` | `title`、`url`、`accessed_at` |
| `ref_param_source` | `(archetype_id, param)` | `basis`（measured／derived／estimated）、`source_id`（estimated 時可空）、`derivation`（推算方式，`derived` 時必填） |

### 2.2 圖鑑（`codex_`）

| 表 | 主鍵 | 欄位 |
|---|---|---|
| `codex_species` | `species_id` | `archetype_id`、`parent_id`、`origin`、`mutation`、`rarity_score`、`rarity_tier`、`scientific_name`、`common_name`、`first_seen_at`（ISO 時間）、`first_tank_id`、`first_tick`、`max_population`、`seen_count` |
| `codex_allele` | `(species_id, locus)` | `allele_index` |

索引：`codex_species(archetype_id)`、`codex_species(rarity_tier)`、`codex_species(parent_id)`、`codex_allele(locus, allele_index)`。

### 2.3 缸（`tank_`）

| 表 | 主鍵 | 欄位 |
|---|---|---|
| `tank` | `id` | `name`、`world_seed`、`config_json`、`created_at`、`current_tick`、`last_saved_at`、`active`、`state_schema` |
| `tank_state` | `tank_id` | `tick`、`state_json`（完整 `SimulationState`） |
| `tank_population` | `(tank_id, population_id)` | `species_id`、`kind`、`established_tick`、`extinct_tick` |
| `tank_population_daily` | `(tank_id, day, species_id)` | `count`、`biomass`、`juveniles`、`adults`、`senescent`、`trophic_level` |
| `tank_chemistry_daily` | `(tank_id, day)` | `temperature`、`ph`、`o2`、`tan`、`no2`、`no3`、`po4`、`sio2`、`ca`、`detritus`、`air_temperature`、`humidity`、`soil_moisture`、`litter`、`soil_tan`、`soil_po4`、`ambient_temperature`、`day_length_h`、`precipitation_mm`、`evaporation_mm`、`water_volume_l`、`ice_cover` |

### 2.4 紀錄（`log_`）

| 表 | 主鍵 | 欄位 |
|---|---|---|
| `log_event` | `id`（自動遞增） | `tank_id`、`tick`、`level`、`type`、`species_id`、`payload_json` |
| `log_feeding_daily` | `(tank_id, day, prey_node, predator_id)` | `flux` |
| `log_chem_flux_daily` | `(tank_id, day, species_id, kind)` | `amount` |

索引：`log_event(tank_id, tick)`、`log_event(species_id)`。

### 2.5 設定

| 表 | 主鍵 | 欄位 |
|---|---|---|
| `meta` | `key` | `value` |
| `setting` | `key` | `value_json` |

## 3. 寫入時機

| 時機 | 寫入 |
|---|---|
| 每遊戲日結束 | `tank_population_daily`、`tank_chemistry_daily`、`log_feeding_daily`、`log_chem_flux_daily`、`codex_species.max_population` |
| 事件產生 | `log_event` 暫存，與下一次寫入合併 |
| 新物種通過建立判定 | `codex_species`、`codex_allele`（已存在則 `seen_count + 1`） |
| 每 30 秒、頁面隱藏、重大事件 | `tank_state`、`tank.current_tick`、`tank.last_saved_at` |

- 每次寫入為單一交易。
- 離線追算期間每 24 tick 寫入一次每日資料，追算結束後寫入 `tank_state`。

## 4. 查詢

UI 經 worker `query` 訊息呼叫具名查詢，不傳送任意 SQL。

| 查詢 | 用途 |
|---|---|
| `codexSearch` | 依名稱、功能群、類別、稀有度、來源、突變、基因座篩選；分頁 |
| `codexProgress` | 已發現數，全體與各功能群 |
| `speciesHistory` | 某物種在某缸的每日族群量 |
| `lineage` | 遞迴 CTE 沿 `parent_id` 取得祖先與後代 |
| `eventSearch` | 依缸、等級、類型、物種、時間範圍查詢事件 |
| `foodWebHistory` | 指定期間的攝食通量 |
| `chemistryHistory` | 指定期間的水質 |

開發模式另提供 SQL 主控台（僅 `import.meta.env.DEV`）。

## 5. 遷移

- 遷移檔：`src/persistence/migrations/NNNN_描述.sql`，依編號遞增。
- 啟動時依序套用編號大於 `user_version` 的遷移檔，每檔一個交易，成功後更新 `user_version`。
- `SimulationState` 結構變更時，`tank.state_schema` 遞增，並於 `src/persistence/stateMigrations.ts` 新增轉換函式。

## 6. 匯出與匯入

- 匯出：下載完整 `ecosim.sqlite3`。
- 匯入：上傳 `.sqlite3`，驗證 `user_version` 與必要資料表後取代現有資料庫；匯入前自動匯出備份。

## 7. 保留政策

- 預設全部保留。
- 設定可選擇刪除 N 遊戲日前的 `tank_population_daily`、`log_feeding_daily`、`log_chem_flux_daily`；`codex_` 與 `log_event` 不刪除。

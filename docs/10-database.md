# 10 資料庫

## 1. 技術

| 項目 | 規格 |
|---|---|
| 引擎 | SQLite WASM（`@sqlite.org/sqlite-wasm`） |
| 持久化 | OPFS，VFS `opfs-sahpool`；不需 COOP/COEP 標頭 |
| 執行位置 | 模擬 Web Worker 內；唯一連線 |
| 檔名 | `ecosim.sqlite3` |
| 結構版本 | `PRAGMA user_version` |
| 參考資料版本 | `meta.reference_version`：種子檔路徑與內容的 FNV-1a 32 位元雜湊（8 位十六進位） |
| Vite | `optimizeDeps.exclude: ['@sqlite.org/sqlite-wasm']` |

- 引擎層（`src/engine`、`src/generation`、`src/game`）不存取資料庫；worker 啟動時讀出參數集（`ParameterSet`），以型別化物件傳入。
- 開啟流程（`src/worker/database.ts`）：安裝 `opfs-sahpool` → 開啟 `ecosim.sqlite3`（失敗則記憶體資料庫）→ 套用遷移 → 比對並匯入參考資料 → 讀取參數集。
- Node 端（測試、CLI、工具）以 `tools/reference-node.ts` 在 SQLite WASM 記憶體資料庫執行相同遷移與種子。
- OPFS 不可用時（私密模式、舊瀏覽器）改用記憶體資料庫，UI 顯示「無法永久保存」警示。
- 第二個分頁開啟時無法取得連線，UI 顯示「已在其他分頁開啟」並停用模擬。

## 2. 資料表

### 2.1 參考資料（`ref_`）

來源：`db/reference/*.sql` 種子檔，直接編輯；功能群依組分檔於 `db/reference/archetypes/`。worker 啟動時若 `meta.reference_version` 與打包種子的雜湊不同，於單一交易內（外鍵延後檢查）清空並重新匯入全部 `ref_` 表。

| 表 | 主鍵 | 欄位 |
|---|---|---|
| `ref_source` | `id` | `title`、`url` |
| `ref_param` | `id`（點路徑，例 `mechanics.mortality.stress.ammonia`） | `kind`（number／text／boolean／null／empty_array／empty_object）、`num`、`txt`、`basis`、`source_id`、`derivation`、`note` |
| `ref_substance` | `id` | `name_zh`、`medium`（water／sediment／land／boundary）、`form`（dissolved／particulate；boundary 為空）、`unit`、`element`（N／P）、`position` |
| `ref_archetype` | `id` | `name_zh`、`layer`、`zone`、`kind`、`category`、`metabolic_class`、`latin_stem`、`noun_zh`、`position` |
| `ref_archetype_param` | `(archetype_id, param_id)` | 同 `ref_param` 葉欄位；`param_id` 為功能群資料點路徑（例 `kinetics.muMax`、`lifeHistory.lifespanDays.max`） |
| `ref_archetype_tag` | `(archetype_id, tag, position, item)` | `value`、`weight`；`tag` 為 salinityClasses、vectors、extraVectors、flags、morphologies、prey、diets（`position` = 食性選項，`weight` = 比重）、defenses、habitats、preyKinds、nativeRealms、nativeOceans |

`ref_param` 群組：

| 前綴 | 內容 |
|---|---|
| `stoichiometry.` | 化學計量、飼料與落葉組成、容量換算 |
| `microbes.` | 微生物共通過程、容量、背景接種 |
| `physiology.` | 身體組成、代謝尺度、攝食、同化、半飽和、共生、底床 |
| `tankOptions.` | 底材、造景、過濾、陸域底材、野外材料 |
| `waterSources.` | 水源水質、海鹽、雨水 |
| `climate.` | 氣候型、大陸性分割、蒸發、日照、降雨日 |
| `habitats.` | 光照等級、棲地推薦與可選條件（[11](11-geography-climate.md) §5） |
| `location.` | 緯度帶、海拔帶、區系海域、區系名稱 |
| `physics.` | 物理化學常數 |
| `mechanics.` | 遊戲機制參數（[04](04-simulation-model.md)） |
| `setup.` | 建缸推薦預設（[11](11-geography-climate.md) §5.1） |
| `generation.` | 基因座標籤與權重、表現型表、突變、稀有度、Gompertz 校準點、耐受形狀（[05](05-species-generation.md)） |
| `naming.` | 學名與俗名詞彙（[05](05-species-generation.md) §4） |

- 數值葉節點 `basis` 非空時為附依據的參數（value、basis、source、derivation、note）；空時為純數值。
- measured、derived 必附 `source_id`；derived 必附 `derivation`；estimated 必附 `note`；`basis` 只用於 number。
- 陣列以 `.0`、`.1`… 路徑表示；空陣列、空物件以 `empty_array`、`empty_object` 標記。
- 載入時建構 `ParameterSet` 並驗證：全部功能群、物質、棲地、背景接種微生物 id 存在，各群組齊全。
- 變更基因座標籤數、表現型表或命名詞彙會改變既有物種的表現型或學名，須新增遷移處理圖鑑。

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
| `tank_chemistry_daily` | `(tank_id, day, variable)` | `value`；`variable` 為物質 id（`ref_substance`，日均質量 mg）或環境變數（`temperature`、`ph`、`air_temperature`、`humidity`、`soil_moisture`、`ambient_temperature`、`day_length_h`、`precipitation_mm`、`evaporation_mm`、`water_volume_l`、`ice_cover`） |

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

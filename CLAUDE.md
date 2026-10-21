# CLAUDE.md

文字型放置水族箱生態模擬器。TypeScript（strict）+ Vite + Vitest + Preact + Signals，Web 單頁應用，資料存於 SQLite WASM（OPFS，worker 內）。

## 文件地圖

| 文件 | 何時讀 |
|---|---|
| [docs/00-plan.md](docs/00-plan.md) | 每次開始工作前；決定下一個任務 |
| [docs/01-overview.md](docs/01-overview.md) | 範圍與名詞 |
| [docs/02-ecosystem-catalog.md](docs/02-ecosystem-catalog.md) | 新增或修改功能群、`src/content` |
| [docs/03-architecture.md](docs/03-architecture.md) | 新增模組、跨層呼叫、存檔、worker、測試 |
| [docs/04-simulation-model.md](docs/04-simulation-model.md) | 修改 `src/engine` |
| [docs/05-species-generation.md](docs/05-species-generation.md) | 修改 `src/generation` |
| [docs/06-gameplay.md](docs/06-gameplay.md) | 修改 `src/game`、`src/ui`、平衡參數 |
| [docs/07-user-guide.md](docs/07-user-guide.md) | 玩家可見行為改變時 |
| [docs/08-ui-design.md](docs/08-ui-design.md) | 修改 `src/ui`、worker 快照格式 |
| [docs/09-life-history.md](docs/09-life-history.md) | 壽命、繁殖、衰老、族群密度、容量 `K` |
| [docs/10-database.md](docs/10-database.md) | 修改 `src/persistence`、資料表、查詢、遷移 |
| [docs/11-geography-climate.md](docs/11-geography-climate.md) | 地點、氣候、季節、室內／戶外、生物地理區 |

## 工作流程

1. 從 `docs/00-plan.md` 取下一個 ⬜ 項目，改為 🔄。
2. 讀對應規格文件，依規格實作。
3. 測試、lint 通過後，**從 00 刪除該項目**；里程碑全空則刪除整個區塊；更新「最後更新」日期。
4. 規格變更時，同一次變更內同步更新 01–06、08–11。
5. 玩家可見行為變更時，同步更新 `docs/07-user-guide.md`。
6. 發現新工作或待決事項時加入 00。

## 架構硬性規則

- 相依方向：`ui → game → engine → generation → content`；反向 import 禁止。
- `ui` 只透過 worker 訊息與模擬溝通。
- `src/engine`、`src/generation`：純函式；禁止 `Math.random`、`Date`、DOM、I/O、計時器。
- 亂數一律來自傳入的 `Rng`；每 tick 亂數 = `sfc32(hash(worldSeed, tick))`。
- `SimulationState` 必須可直接 JSON 序列化：無類別實例、函式、Map、Set。
- 數值常數以具名常數集中於模組頂部，數值與 04 文件一致；調校後同步更新文件。
- 所有池與生物量下限為 0。
- 族群只能由模擬過程或玩家指令改變；禁止以人為規則移除、削減族群（[04](docs/04-simulation-model.md) §9.1）。
- 資料庫只在 worker 內存取；引擎層不 import `persistence`。
- 資料表變更 → 新增 `src/persistence/migrations/NNNN_描述.sql`，不修改已發布的遷移檔。
- `SimulationState` 結構變更 → 遞增 `state_schema` 並新增 `stateMigrations.ts` 轉換函式。
- `db/reference.sql` 為產生檔，修改 `src/content` 後重新產生並遞增參考資料版本。
- 物種 = 功能群 + 基因型；表現型與學名由物種 ID 決定性推導。變更基因座或推導規則會改變既有物種，必須遞增參考資料版本並新增遷移。
- 所有生物皆有年齡上限；新增功能群必須在 09 定義衰老型態與遊戲上限。
- 生物參數：`src/content` 每個生物數值附 `basis`（measured／derived／estimated）；measured、derived 必附 `source`；derived 必附推算方式；estimated 對應 09 的「（估）」，持續補齊來源。
- 每個功能群必有年齡上限；查無資料時填暫定值並標（估）。
- 遊戲機制參數（上限、門檻、係數）不屬生物參數，集中於具名常數並於 04 文件定義。

## 程式規範

- 禁止 `any`；一律 `===`；非同步必須 `await` 或串接。
- 識別字用英文；功能群 ID 與 02 文件一致（`snake_case`）。
- 註解只寫規格與硬性約束，一行為限；不寫推理過程或修改歷史。

## 測試規範

- 引擎測試使用固定種子。
- 不使用 `sleep` 或時間假設；以 tick 數驅動。
- 必備：決定性測試、氮／磷守恆測試、池非負測試。
- 修改公式後執行黃金紀錄測試；預期內的變化才更新快照。
- UI 測試（Playwright）定位器：role > label > `data-testid`；使用 `locator.filter()`。

## 指令

| 指令 | 用途 |
|---|---|
| `npm run dev` | 開發伺服器 |
| `npm run build` | 型別檢查 + 建置 |
| `npm run typecheck` | 型別檢查（`tsc -b`，四個專案） |
| `npm test` | 測試 |
| `npm run lint` | 靜態檢查 |
| `npm run format` / `format:check` | Prettier 格式化／檢查 |
| `npm run sim -- --seed <n> --days <n> --preset <freshwater\|brackish\|marine>` | CLI 模擬，輸出文字紀錄（M3 起） |

完成任務前必須通過：`npm run format:check`、`npm run lint`、`npm test`、`npm run build`。

## 工具鏈規則

- TypeScript 6.0（`typescript-eslint` 支援範圍內）；所有套件鎖定精確版本。
- 型別專案：`tsconfig.core.json`（content／generation／engine／game，僅 ES2023，無 DOM）、`tsconfig.app.json`（ui，DOM + JSX）、`tsconfig.worker.json`（worker／persistence，WebWorker）、`tsconfig.node.json`（tools／tests／設定檔）。
- JSX 設定只放在 `tsconfig.app.json`；Preact 型別會引入 DOM。
- 分層相依與模擬純度由 `eslint.config.js` 強制，規則測試位於 `tests/lint/`；修改分層時同步更新兩者。
- CI 只在 `main` 分支 push 時執行。

## 文件語言

- 文件以繁體中文撰寫；程式識別字、指令、檔名用英文。
- 文件只寫規格：是什麼、規則是什麼。

# 03 系統架構

## 1. 分層與相依規則

```
ui ──► game ──► engine ──► generation ──► content
        │          │
        ▼          ▼
   persistence   (rng)
worker：承載 game + engine，與 ui 以訊息溝通
```

| 層 | 職責 | 規則 |
|---|---|---|
| `content` | 功能群資料、建缸選項資料 | 純資料，型別化 TS 模組；不 import 其他層 |
| `generation` | 基因型、表現型推導、命名、突變 | 純函式；亂數只來自傳入的 `Rng` |
| `engine` | 環境、化學、族群動態、湧現、事件 | 純函式；禁止 `Math.random`、`Date`、DOM、I/O |
| `game` | 指令處理、圖鑑、分數、離線追算 | 不 import `ui` |
| `persistence` | SQLite WASM 存取、遷移、參考資料載入、具名查詢；規格見 [10](10-database.md) | 只依賴型別與 `game`；僅在 worker 內執行 |
| `worker` | 執行模擬迴圈，接收指令、推送快照、持有資料庫連線 | 唯一持有計時器與資料庫連線的層 |
| `ui` | Preact + Signals 元件；規格見 [08](08-ui-design.md) | 只透過訊息與 worker 溝通 |

## 2. 目錄結構

```
src/
  content/
    archetypes/        各營養層功能群資料
    tankOptions.ts     建缸選項
  generation/
    traits.ts
    naming.ts
    genotype.ts
    phenotype.ts
    mutation.ts
  engine/
    rng.ts
    types.ts
    environment.ts
    chemistry.ts
    microbes.ts
    producers.ts
    consumers.ts
    symbiosis.ts
    emergence.ts
    mortality.ts
    step.ts
    events.ts
  game/
    commands.ts
    codex.ts
    scoring.ts
    offline.ts
  persistence/
    db.ts              連線、OPFS／記憶體降級、交易
    migrations/        NNNN_描述.sql
    stateMigrations.ts
    referenceLoader.ts
    writers.ts         每日彙總、事件、圖鑑、狀態寫入
    queries.ts         具名查詢
  worker/
    sim.worker.ts
    protocol.ts
  ui/
    state/             signals：snapshot、選取、導覽、偏好
    layout/            頂欄、響應式版面、控制列
    tank/              缸況面板
    species/           物種列表、物種詳情、關係圖、食物鏈路徑
    log/               事件日誌
    setup/             建缸精靈
    codex/             圖鑑
    dialogs/           控制對話框、離線摘要
    format/            數量、豐度、走勢字元、趨勢格式化
  main.ts
tools/
  sim-cli.ts           CLI 模擬器（npm run sim）
  batch-balance.ts     批次平衡工具
  build-reference-sql.ts  由 src/content 產生 db/reference.sql
db/
  reference.sql        產生檔，不手改
tests/                 對應 src 結構
docs/
```

## 3. 模擬核心契約

```ts
step(state: SimulationState, commands: Command[]): { state: SimulationState; events: SimEvent[] }
```

- `SimulationState` 為可直接序列化的純資料（無類別實例、無函式、無 Map/Set）。
- 每個 tick 的亂數：`rng = sfc32(hash(worldSeed, tick))`。相同 `worldSeed`、初始狀態、指令序列 → 相同結果。
- 指令在 tick 開始時套用，依佇列順序執行。
- 任一池或族群單 tick 變化量 > 50% 時，該 tick 拆分子步長（最多 8 個）。
- 所有池與生物量下限為 0。

## 4. Worker 協定

| 方向 | 訊息 | 內容 |
|---|---|---|
| ui → worker | `init` | 存檔或新缸設定 |
| ui → worker | `command` | 玩家指令 |
| ui → worker | `setSpeed` | 0（暫停）、1、4、16 |
| ui → worker | `select` | 選取物種 ID；worker 於快照附帶該物種 `history30d` |
| worker → ui | `snapshot` | 格式見 [08](08-ui-design.md) §9；頻率 ≤ 4 Hz |
| worker → ui | `events` | 新事件批次 |
| worker → ui | `offlineReport` | 離線追算摘要 |
| worker → ui | `saved` | 存檔完成 |
| ui → worker | `query` | 具名查詢與參數（[10](10-database.md) §4） |
| worker → ui | `queryResult` | 查詢結果 |
| ui → worker | `exportDb`／`importDb` | 匯出／匯入資料庫檔 |
| worker → ui | `dbStatus` | `persistent`／`memory`／`locked` |

## 5. 存檔

- 所有持久資料（參考資料、圖鑑、缸存檔、族群歷史、事件、通量紀錄、設定）存於 SQLite WASM；規格見 [10](10-database.md)。
- `SimulationState.speciesRegistry` 只存物種 ID 與 `parentId`；表現型與名稱於讀取時推導。
- UI 偏好另以 localStorage `ecosim.ui` 快取，供 worker 啟動前渲染使用。
- 讀寫失敗時不中斷遊戲，UI 顯示存檔警示。

## 5.1 工具鏈

| 項目 | 規格 |
|---|---|
| Node | ≥ 22.12；`.nvmrc` = 24 |
| 型別專案 | `tsconfig.core.json`：`src/content`、`src/generation`、`src/engine`、`src/game`，lib 僅 ES2023 |
| | `tsconfig.app.json`：`src/ui`、`src/main.tsx`，lib DOM，JSX（Preact） |
| | `tsconfig.worker.json`：`src/worker`、`src/persistence`，lib WebWorker |
| | `tsconfig.node.json`：`tools`、`tests`、設定檔，Node 型別 |
| 分層強制 | `eslint.config.js`：`@typescript-eslint/no-restricted-imports` 依 §1 相依方向禁止反向 import（`import type` 例外）；Preact 僅限 `ui`；SQLite 僅限 `worker`、`persistence` |
| 純度強制 | `src/content`、`src/generation`、`src/engine` 禁用 `Math.random`、`Date`、`performance`、`crypto`、計時器、`window`、`document`、`self`、`globalThis` 等 |
| 規則測試 | `tests/lint/layer-rules.test.ts` |
| CI | `.github/workflows/ci.yml`；僅 `main` 分支 push；`format:check` → `lint` → `test` → `build` |

## 6. 程式規範

- TypeScript `strict`，禁止 `any`。
- 一律使用 `===`。
- 非同步呼叫必須 `await` 或串接處理。
- 常數集中於各模組頂部，以具名常數表示，不寫魔術數字。

## 7. 測試策略

| 類型 | 內容 |
|---|---|
| 單元測試 | 各過程函式（環境、硝化、攝食、代謝、衰老、抽樣、命名） |
| 基因型測試 | 編碼 ↔ 基因型 ↔ 學名互逆；物種空間計數與 [05](05-species-generation.md) §2.4 一致；Gompertz 參數滿足 `S(typ) = 0.5`、`S(max) = 0.01` |
| 規則測試 | ESLint 分層與純度規則：違規必報錯、合法 import 不報錯 |
| 資料庫測試 | 記憶體資料庫：遷移由 0 套用至最新、參考資料匯入筆數、寫入後具名查詢結果、`lineage` 遞迴正確 |
| 不變量測試 | 氮、磷守恆（扣除換水、脫氮、餵食輸入）；所有池 ≥ 0 |
| 決定性測試 | 同種子同指令序列，狀態雜湊一致 |
| 黃金紀錄測試 | 固定種子跑 30 遊戲日，摘要比對快照 |
| 情境測試 | 開缸循環時程；餵食過量 → 碎屑蟲／刷毛蟲爆發；強光高 PO₄ → 藻華 |
| UI 測試 | Playwright；定位器優先順序：role > label > `data-testid` |

測試不使用 `sleep` 或時間假設；需等待的情境以 tick 數驅動。

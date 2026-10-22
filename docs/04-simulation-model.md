# 04 模擬模型

所有係數為初始值，於 M6 調校；實作以 `src/engine` 內具名常數為準。

## 1. 時間

- 1 tick = 1 遊戲小時；24 tick = 1 遊戲日。
- 速度 1× = 每現實秒 0.4 tick（1 遊戲日 ≈ 60 現實秒）；可選 4×、16×、暫停。

## 2. 每 tick 處理順序

1. 套用玩家指令
2. 環境：季節時鐘與每日氣候（[11](11-geography-climate.md) §4）；溫度、光照、氣體交換、pH；戶外降雨、蒸發、結冰；陸域濕度、土壤濕度、逕流
3. 微生物化學過程
4. 初級生產
5. 共生
6. 消費者攝食
7. 代謝與排泄
8. 繁殖與成長
9. 死亡
10. 湧現、突變、滅絕
11. 產生事件

## 3. 狀態

### 3.1 環境

| 欄位 | 單位 | 說明 |
|---|---|---|
| `waterVolumeL` | L | 水量 |
| `salinity` | ppt | 0–35 |
| `temperature` | °C | 目前水溫 |
| `lightIntensity` | µmol·m⁻²·s⁻¹（PAR） | 開燈時強度 |
| `photoperiod` | h | 0–14 |
| `flow` | 0–1 | 水流 |
| `aeration` | 0–1 | 曝氣 |
| `kh` | dKH | 碳酸鹽硬度 |
| `pH` | — | 由 KH 與 CO₂ 推得 |
| `floorArea` | m² | 底面積 |
| `surfaceArea` | m² | 附著面積；附著族群容量依據 |
| `substrateDepth` | cm | 底材深度 |
| `anoxicFraction` | 0–1 | 底材缺氧比例 |

**幾何**（輸入：`lengthCm`、`widthCm`、`heightCm`、`waterDepthCm`、`landFraction`）

- `floorArea = lengthCm × widthCm / 10⁴`（m²）
- `landArea = floorArea × landFraction`；`waterFloorArea = floorArea − landArea`
- `waterVolumeL = waterFloorArea × waterDepthCm × 10`
- `glassArea = waterFloorArea + 2 × (lengthCm + widthCm) × waterDepthCm × (1 − landFraction) / 10⁴`
- `surfaceArea = glassArea + 造景面積 + 濾材面積 + 水草面積`；造景與濾材面積定義於 `src/content/tankOptions.ts`
- 總容積 `lengthCm × widthCm × heightCm / 1000 ≤ 100,000 L`
- `landFraction = 1`：無水域，水域過程與 W 功能群停用；`landFraction = 0`：無陸域，陸域過程與 T 功能群停用。

### 3.1.1 陸域狀態

| 欄位 | 單位 | 說明 |
|---|---|---|
| `airTemperature` | °C | 空氣溫度 |
| `humidity` | % | 相對濕度 |
| `soilMoisture` | 0–1 | 土壤濕度 |
| `soilDepthCm` | cm | 陸域底材深度 |
| `litter` | g/m² | 落葉 |
| `soilOrganic` | g/m² | 土壤有機質 |
| `soilTan`、`soilPo4` | g/m² | 土壤可溶養分 |
| `baskingTemperature` | °C | 加熱燈曬點溫度；關閉時 = `airTemperature` |
| `uvb` | bool | UVB 燈 |
| `lid` | bool | 加蓋 |
| `mistingPerDay` | 次 | 噴霧頻率 |

### 3.1.2 地點與季節狀態

| 欄位 | 單位 | 說明 |
|---|---|---|
| `location` | — | 地點分類與棲地（[11](11-geography-climate.md) §1），建缸後固定 |
| `placement` | indoor／outdoor | 室內／戶外 |
| `dayOfYear` | 1–365 | 遊戲日期（[11](11-geography-climate.md) §4） |
| `ambientTemperature` | °C | 環境溫度 |
| `pressureAtm` | atm | 代表海拔氣壓 |
| `iceCover` | bool | 戶外冰封 |
| `shading` | 0–0.9 | 戶外遮蔭 |

### 3.2 化學池

所有池以缸內總質量（mg）儲存；濃度 = 質量 ÷ `waterVolumeL`。有機物以 COD 計，並分別追蹤其氮、磷質量（`{cod, n, p}`）。

| 池 | 說明 |
|---|---|
| `tan` | 總氨氮（NH₃ + NH₄⁺，以 N 計） |
| `no2` | 亞硝酸鹽（以 N 計） |
| `no3` | 硝酸鹽（以 N 計） |
| `po4` | 磷酸鹽（以 P 計） |
| `sio2` | 矽酸鹽 |
| `o2` | 溶氧 |
| `co2` | 二氧化碳 |
| `ca` | 鈣 |
| `saltMg` | 鹽；鹽度 = `saltMg / 1000 / waterVolumeL` |
| `alkalinityMg` | 鹼度（以 CaCO₃ 計）；KH = `alkalinityMg / 17.86 / waterVolumeL` |
| `substrateCod` | 易分解溶解有機物（COD） |
| `food` | 未食用飼料 `{cod, n, p}` |
| `detritus` | 可水解碎屑 `{cod, n, p}` |
| `inert` | 惰性碎屑 `{cod, n, p}` |
| 陸域 `litter` | 落葉 `{cod, n, p}` |
| 陸域 `soilSubstrateCod`、`soilTan`、`soilPo4` | 土壤溶解有機物、銨、磷 |

生物量以 COD 計；各類群含 N、P 量見 §5.4 身體組成（細菌 0.08、0.0155 g/g COD）。

### 3.3 注水與材料

**注水組成**（每公升；`src/engine/sourceWater.ts`）
- 水源水質、溶解有機碳（DOC）與初始菌量見 `src/content/waterSources.ts`。
- 天然鹹水依目標鹽度以 RO 水稀釋：`sourceFraction = min(1, 目標鹽度 / 水源鹽度)`；水質與菌量 × `sourceFraction`。
- 不足的鹽度以人工海鹽補足：每 35 ppt 帶入 KH 8、Ca 420 mg/L。
- DOC × 2.67 換算 COD；10% 進入 `substrateCod`（易分解），90% 進入 `inert`（腐植質，不含氮磷）。
- 初次注水、潮汐進水、季節補水皆使用同一組成；計入外部輸入。

**野外材料**（初始一次性帶入）
- 野外石頭、礁石、沉木：浸水表面 × 10⁷ cells/cm²；其中 AOB、NOB 各 5%，其餘為異營菌。另帶入 7,100 mg COD/m² 有機碎屑（含氮 0.08、磷 0.0155 g/g COD）。
- 野外砂泥：底材表面同上，脫氮菌另佔 2%；有機碎屑只計表層 1 cm。
- 野外土壤、落葉：土壤細菌 3 × 10⁸ cells/g × 容重 0.8 g/cm³ × 深度；真菌生物量 = 細菌 × 0.5；落葉量依緯度帶林地實測（`WILD_LITTER_STOCK`）。
- 乾淨材料：無生物膜、無有機碎屑；乾淨陸域底材帶入土壤容量 1% 的微生物。
- 初始菌量不超過各棲位容量的 50%。

**鹼度（質子平衡）**：每個過程依水中 N 形態變化調整鹼度：`Δalkalinity = 3.57 × (Δtan − Δno2 − Δno3)` mg CaCO₃（N 以 mg 計）；涵蓋礦化、硝化、脫氮與藻類吸收。鈣化另計。

**大氣氮沉降**：戶外雨水含 NH₄⁺-N 0.25、NO₃⁻-N 0.25 mg/L；落入水域加入 `tan`、`no3`，落在陸域加入 `soilTan`。

## 4. 環境過程

**溫度**：有加熱器時 `T += (T_set − T) × 0.2`；無加熱器時 `T += (T_ambient − T) × 0.05`。`T_ambient`：室內 = 室溫設定（預設 22 °C）；戶外依 [11](11-geography-climate.md) §7。

**光照**：室內 `I(t) = lightIntensity`，於光週期內，其餘為 0；啟用季節光照時光週期 = [11](11-geography-climate.md) §3.2 日照長度。戶外為自然光（[11](11-geography-climate.md) §3、§4）× (1 − 遮蔭)。

**O₂ 飽和度**：Benson & Krause 公式，含鹽度與氣壓修正（[11](11-geography-climate.md) §3.1）；氣壓由代表海拔計算。

**氣體交換**
`kLa = (0.02 + 0.20 × aeration + 0.10 × flow) × (iceCover ? 0.05 : 1)`（每 tick）
`ΔO2 = kLa × (O2sat − O2)`；`ΔCO2 = kLa × (0.5 − CO2)`

**pH**：碳酸平衡 `pH = 6.35 + log10([HCO₃⁻] / [CO₂])`，`[HCO₃⁻] = 0.357 × KH` mmol/L，`[CO₂] = CO2 mg/L ÷ 44.01`；限制於 3.5–9.5。空氣平衡 CO₂ = 0.5 mg/L。

**游離氨比例**
`pKa = 0.09018 + 2729.92 / (T + 273.15)`
`f_NH3 = 1 / (1 + 10^(pKa − pH))`
毒性判定使用 `NH3_free = tan × f_NH3`。

**底材缺氧比例**：`anoxicFraction = clamp((substrateDepth − 3) / 7, 0, 1)`；底材為泥或活砂時 +0.2，最大 1。

### 4.1 陸域過程

| 過程 | 規則（每 tick） |
|---|---|
| 空氣溫度 | 與水溫規則相同，作用於 `airTemperature`；加熱燈只影響曬點 |
| 濕度 | `H* = clamp(40 + 45 × (1 − landFraction) + 5 × mistingPerDay + (lid ? 15 : 0), 30, 100)`；`humidity += (H* − humidity) × 0.1`；噴霧當下 +10 |
| 土壤濕度 | `S* = 0.3 + 0.4 × humidity / 100 + (landFraction < 1 ? 0.1 : 0)`；`soilMoisture += (S* − soilMoisture) × 0.02`；噴霧當下 +0.05 |
| 落葉分解 | `litter → soilSubstrateCod + soilTan + soilPo4`；速率 = `k_litter / 365 × θ^(T−20) × min(1, soilMoisture / 0.6) × activity × litter`，`k_litter = 0.85 yr⁻¹`，`activity = min(1, 分解者生物量 / (0.01 × 土壤容量))` |
| 土壤微生物 | `soil_bacteria`、`saprotrophic_fungus` 以 `soilSubstrateCod` 為基質成長（Monod 半飽和 1,000 mg COD/m²），消耗 `soilTan`、`soilPo4`；死亡後直接回到 `soilSubstrateCod`、`soilTan`、`soilPo4` |
| 陸生植物吸收 | 吸收 `soilTan`、`soilPo4`，形式同 §5.3 |
| 逕流 | `0 < landFraction < 1` 時，每遊戲日 `soilTan`、`soilPo4` 的 5% 與 `litter` 的 1% 移入水域 `tan`、`po4`、`detritus`（以 `waterVolumeL` 換算濃度） |

## 5. 生物過程

生物參數見 `src/content`（功能群 `kinetics`、`physiology.ts`）；本節定義公式與遊戲機制常數。

### 5.1 通用耐受函數

- 溫度 `tol_T(x)`：x 在 [min, max] 外為 0；範圍內為 `exp(−((x − opt) / w)²)`，`w = (max − min) / 4`。
- 鹽度 `tol_S(x)`：物種鹽度窗內為 1，兩端各以窗寬 20% 線性降至 0；窗下限為 0 ppt 時下端不降。
- pH `tol_pH(x)`：`opt ± 0.8` 內為 1，往 min、max 線性降至 0。
- `f_env = tol_T × tol_S × tol_pH`；陸域生物以濕度因子 `min(1, humidity / humidityMin)` 取代鹽度與 pH；兩棲生物水域部分取 `max(水域因子, 1 − w)`。

### 5.2 微生物

ASM1 為基礎，硝化拆為兩步。動力學參數（`muMax`、半飽和常數、產率、pH 最適區）為功能群資料；ASM1／BSM1 速率常數約為 15 °C 值，以 `θ^5` 換算至 20 °C。成長速率（每日）= `muMax × 表現型成長倍率 × θ^(T−20) × f_pH × 基質 Monod × O₂ Monod × 擁擠 × B`，`θ = 1.072`；水溫在物種溫度範圍外時為 0。

| 過程 | 基質限制 | 轉換（每單位生物量成長） |
|---|---|---|
| 飼料溶出（非生物） | — | `food` 每日 1.87 → `substrateCod` + `tan` + `po4` |
| 水解 | `k_h × (X_S/X_H) / (K_X + X_S/X_H) × X_H`，`X_H` = 異營菌 + 生物膜群落 | 僅 `detritus` → `substrateCod` + `tan` + `po4` |
| 異營菌、生物膜群落 | `substrateCod`、O₂ | 耗 `1/Y` 基質、`(1−Y)/Y` O₂；同化 N、P；產 CO₂ |
| 水黴 | `detritus` + `food`、O₂ | 耗顆粒有機物 `1/Y`；多餘 N、P 釋為 `tan`、`po4` |
| 氨氧化菌（`aob`） | `tan`、O₂ | 氧化 `1/Y` N：`tan → no2`；耗 O₂ `3.43/Y − 1` |
| 亞硝酸氧化菌（`nob`） | `no2`、O₂ | 氧化 `1/Y` N：`no2 → no3`；耗 O₂ `1.14/Y − 1` |
| 脫氮菌（`denitrifier`） | `substrateCod`、`no3` × `anoxicFraction × (1 − O2/O2sat)` | 還原 `(1−Y)/(2.86Y)` N：`no3 → N₂`（移出） |

- **pH 因子**：梯形；功能群 `phOptimum` 區間內為 1，往物種 pH 範圍兩端線性降至 0；未定義 `phOptimum` 者用 §5.1 `tol_pH`。
- **擁擠**：`1 − 群體生物量 / 容量`。`aob`、`nob` 共用附著容量 `surfaceArea × 426 mg COD/m²`；脫氮菌用底材表面 × `anoxicFraction`；異營菌用 `waterVolumeL × 5.96 mg COD/L`；土壤細菌與腐生真菌共用 `1.82 mg COD/g × 容重 × 陸域底材體積`；其他 biomass 功能群依 [09](09-life-history.md) 最大密度換算，同功能群物種共用。
- **背景接種**：每種微生物每日依 `BACKGROUND_SEEDING` 加入該功能群生物量最大的族群，計入外部輸入。
- **初始接種**：水源 `inoculum`（cells/mL）× 0.3 pg × 1.42 COD/乾重，平均分給 3 個菌株；菌株由環境加權抽樣，重抽至 `f_env > 0`。
- **細胞汰換**：見 §5.7；水域死亡 92% → `detritus`、8% → `inert`；土壤微生物回到 `soilSubstrateCod`、`soilTan`、`soilPo4`。

### 5.3 初級生產者

`G = muMax × 成長倍率 × f_env × f_I × f_nut × B × (1 − ΣB / K)`

- `f_I`：`I ≤ I_opt` 時 `I / (I + K_I)`；`I > I_opt` 時再乘 `(I/I_opt) × e^(1 − I/I_opt)`（Steele 光抑制）。
- `f_nut = min(N/(N + K_N), P/(P + K_P), CO₂/(CO₂ + K_C), [SiO₂/(SiO₂ + K_Si) 僅矽藻])`；`N = tan + no3`；陸域以土壤溶液濃度計（土壤池 ÷ 底材深度 × 孔隙度 0.5 × 土壤濕度）。
- 固氮者：N 項下限 0.3，不足部分以大氣固氮補足，計入外部輸入。
- 銨優先：同化氮中取自 `tan` 的比例 = `10·tan / (10·tan + no3)`。
- 光合成長 1 mg COD：產 O₂ 1 mg、耗 CO₂ 44/32 mg；同化 N、P 依身體組成；矽藻沉積 SiO₂ 0.14 mg。
- 暗呼吸：關燈時 `darkRespiration × muMax × f_env × B`（未定義時 0.05），耗 O₂、產 CO₂，釋出 N、P。
- `K` = [09](09-life-history.md) 最大密度 × 棲位對應量；葉綠素換算乾重 × 100，覆蓋率 100% = 300 g 乾重/m²。

### 5.4 消費者

**身體組成**：每 mg COD 含 N、P 依代謝類別（`BODY_COMPOSITION`）；水草、大型藻以功能群覆寫。生物量以 COD 計，1 mg 乾重 = 1.42 mg COD。

**代謝**：`r = r0 × M^b × Q10^((T_body − 20)/10)`，`M` 為 mg 乾重，`r0`、`b` 依代謝類別，`Q10 = 2`；再乘表現型成長與代謝倍率。

**體溫 `T_body`**：水域生物 = 水溫；陸域生物 = 空氣溫度；需曬點的爬蟲類於開燈時 = `baskingTemperature`。

**區域使用**：`w` = 水域時間比例（W = 1、T = 0、A = 0.5，`habitat` 等位基因 ±0.2）；呼吸耗 O₂、排泄 tan、po4 的 `w` 部分進入水域，`1 − w` 部分進入土壤池；`air_breather` 不耗水中 O₂。卵與幼體（`aquatic`）`w = 1`。

**功能反應**（多獵物、Hill 指數 `h = 1.2`）
- `x_ij = (pref'_j × size_ij × overlap_ij × refuge_j × activity_i × R_j / K_half) ^ h`
- `F_ij = Imax_i × x_ij / (1 + Σ_k x_ik)`，`Imax_i = Σ_世代群 y × r(M_c) × B_c`，`y` 依代謝類別（無脊椎 8、脊椎變溫動物 4）
- `pref'`：食性權重除以「目前存在之食物類別」的權重總和
- `R_j`：水域 mg COD/L、陸域 mg COD/m²；`K_half` 依食物類別與介質（`FOOD_HALF_SATURATION`）
- `size_ij = exp(−(log10(M_j/M_i) − log10 ρopt)² / (2σ²))`，`σ = (log10 ρmax − log10 ρmin) / 4`；比值超出 `[ρmin, ρmax]` 為 0；無資料時 `ρ = 10⁻⁶／10⁻³／0.5`
- `overlap_ij = 區域重疊 (w_i w_j + (1 − w_i)(1 − w_j)) × 棲位重疊（共享棲位 1，否則 0.3）`
- `refuge_j` = 防禦乘積（殼 0.5、棘 0.6、毒 0.3、毒刺 0.7、躲藏 0.6、群游 0.8、甲 0.6、穴居 0.5、擬態 0.7、自割 0.8、黏液 0.8，下限 0.05）× 被捕食倍率；附著（`surface`）與底材（`sediment`）的 biomass 再 × 0.1
- `activity_i`：日行性夜間、夜行性白天 0.3；發光突變夜間攻擊 × 1.15
- 卵：產卵型功能群 2 日齡內的世代群視為 `egg`
- 非 `cannibal` 不吃同族群

**同化與化學計量**：同化效率 `e` 依食物類別（碎屑 0.15、飼料 0.8、藻與植物 0.45、微生物 0.6、動物 0.85）× 表現型倍率（上限 0.95）。每攝食 1 mg COD：
- 成長 `g = e × min(1, n_prey/n_pred, p_prey/p_pred)` 轉入捕食者
- 未同化 `1 − e` 連同其 N、P 轉入捕食者所在介質的 `detritus` 或 `litter`
- 已同化未成長 `e − g` 呼吸（耗 O₂ 1 mg/mg COD、產 CO₂）
- 多餘 N、P 排泄為 tan、po4（依 `w` 分配）

**維持呼吸**：每世代群每日 `r × B` 自身體 COD 呼吸，耗 O₂、產 CO₂，釋出身體 N、P。

**biomass 型消費者**（纖毛蟲）：`Imax = muMax × 成長倍率 × θ^(T−20) × 擁擠 / Y`，`K_half` 為功能群 `halfSat.prey`，同化效率 = `Y`；飢餓損失 `starvationLoss × (1 − 飽食度)`，飽食度 = `Σx / (1 + Σx)`。

### 5.5 共生（珊瑚 + 蟲黃藻）

- 蟲黃藻密度 `Z`（0–1）為珊瑚族群屬性，初值 1。
- 光合供能：`Pz = Z × f_I × min(N, P 限制) × 鈣限制 × 0.115 × B_coral`（每日），進入珊瑚同化量；耗 CO₂、產 O₂、取用 N、P；`f_I`、N、P 半飽和取自 `zooxanthellae` 功能群。
- 白化：`I > 600 µmol·m⁻²·s⁻¹` 或 `T > T_opt + 2` 時，`Z` 每 tick × 0.98；否則每 tick + 0.005（上限 1）；`Z` 跌破 0.5 時產生白化事件。
- `Z < 0.2` 持續 14 遊戲日 → 珊瑚死亡率 ×5。
- 鈣化：每 mg COD 光合產物沉積 Ca 2.8 mg，鹼度依 CaCO₃ 扣除；`ca < 350 mg/L` 時光合供能 × 0.2。

### 5.6 族群型態

**biomass 型**：`B`（mg COD）；`clonal_aging` 另記 `clonalGenerations`。

**cohort 型**：
- 族群由年齡世代群組成：`AgeCohort { birthTick, count, meanMassMg, peakMassMg, aquatic, spentTick }`。
- 同一遊戲日出生者合併；每族群最多 24 個世代群，超過時合併相鄰且個體數總和最小的兩群。
- 同化量依世代群攝食能力（`count × M^0.75`）分配：先補足至成體質量，其餘進入族群 `reserveCod`。
- 成體：年齡 ≥ `maturityDays` 且非水生幼體。
- 繁殖條件：距上次繁殖 ≥ 繁殖間隔（功能群 `intervalDays` 幾何平均；未定義為 30 日）；繁殖成體（質量 ≥ 0.5 成體質量）有性生殖 ≥ 2、無性 ≥ 1；`f_env ≥ 0.5`；需水域繁殖者缸內須有水。
- 每窩 `clutch × eggMass`；可繁殖窩數 = `min(雌性數, reserve / 每窩 COD)`，有性生殖雌性 = 成體 × 0.5；不足一窩不繁殖。
- 新世代群 `count = 卵數 × min(1, 0.5 × 幼體存活倍率) × recruitment × (1 − N/K)`，`N` 為族群個體數；未成為新世代群的卵量轉入碎屑。
- `recruitment`：normal 1、rare 0.05、none 0（[09](09-life-history.md) §2）。
- `semelparous`：繁殖後親世代群標記 `spentTick`。
- 變態：需水域繁殖者幼體於幼生期（`aquaticStageDays` 幾何平均；未定義為成熟日數 × 0.25）後離水；`metamorphosis_exit` 於幼生期後且達成體質量時移出系統，N、P 計入輸出。
- `modular` 群體（珊瑚、海綿、群體海鞘）：個體 = 群體。

### 5.7 年齡與衰老

所有個體、細胞、模組、群體皆有年齡上限（[09](09-life-history.md)「遊戲上限」）。

| 衰老型態 | 規則 |
|---|---|
| `gompertz` | `h(a) = A·e^(G·a)`（每日）；物種推導時解 A、G，使僅計衰老時 `S(lifespanTyp) = 0.5`、`S(lifespanMax) = 0.01`；`a ≥ lifespanMax` 全數死亡 |
| `negligible` | `h = 1.65 × 10⁻⁵／日`；`a ≥ 遊戲上限` 全數死亡 |
| `semelparous` | cohort 型：`gompertz` 外，親世代群於繁殖後 3 遊戲日內全數死亡；biomass 型：每日 `1 / lifespanTyp` 汰換 |
| `metamorphosis_exit` | `gompertz`；離缸見 §5.6 |
| `modular` | cohort 型：群體依 `gompertz`，另每日 `B / moduleLifespan` 轉入碎屑；biomass 型：每日 `B / moduleLifespan` 汰換 |
| `cell_turnover` | 每日汰換率 `1 / lifespanTyp`（物種表現型） |
| `clonal_aging` | 每日損失 `lossRate`；`clonalGenerations += log2(1 + 成長量 / B)`；達 `clonalMax` 時再 +0.2／日並產生克隆崩潰事件；達 `sexualMin` 後每日有性生殖機率 `0.1 × min(1, B / K)`，發生時歸零 |

每 tick 死亡比例 = `1 − exp(−(h / 24 + m_stress) × dt)`。

### 5.8 死亡

`m = h_age + m_stress`

| 壓力 | 條件 | 附加死亡率（每 tick） |
|---|---|---|
| 氨 | `NH3_free > nh3Max` | `0.02 × (NH3_free / nh3Max − 1) × w` |
| 亞硝酸 | `no2 > no2Max` | `0.01 × (no2 / no2Max − 1) × w` |
| 缺氧 | `o2 < o2Min`，非 `air_breather` | `0.05 × (1 − o2 / o2Min) × w` |
| 溫度、鹽度、pH、濕度 | `f_env = 0` | 0.05 |
| 飢餓 | `meanMass < 0.5 × peakMass` | 0.03 |
| 乾燥 | `humidity < humidityMin` | `0.02 × (1 − humidity / humidityMin) × (1 − w)` |
| 缺陸域 | T 功能群或 `needs_land` 成體，無陸域 | 0.2 |
| 缺水域 | W 功能群或水生幼體，無水域 | 1 |
| 缺 UVB | `needs_uvb`，`uvb = false` 連續 ≥ 30 遊戲日 | 0.002 |
| 逃逸 | `escapes_open_lid` 成體，`lid = false` | 0.05，個體移出系統，N、P 計入輸出 |

死亡生物量依 `w` 轉入 `detritus` 或 `litter`。

## 6. 營養層等級

- 生產者與分解者 TL = 1。
- 消費者 `TL_i = 1 + Σ_j w_ij × TL_j`；`w_ij` 為近 7 遊戲日攝食量占比；同物種自食不計。
- 每遊戲日重新計算。

## 7. 湧現

**機率**：每次擲骰 `p = λ × suitability`；自然來源途徑只帶入原生於來源區系的功能群（[11](11-geography-climate.md) §6），海水缸（≥ 30 ppt）以區系對應的海域判定。

`suitability = f_env × foodAvailability × toxicityOk × capacityOk`

- `f_env`：§5.1，以抽到的物種表現型在目前缸況計算
- `foodAvailability = Σx / (0.01 + Σx)`，`Σx` 為 §5.4 功能反應項總和（以一隻成體估算）；生產者與分解者為 1
- `toxicityOk`：未超出 `nh3Max`、`no2Max`、`o2Min` 時為 1，否則為 0
- `capacityOk`：缸符合最小飼養空間時為 1（[09](09-life-history.md) §7）

**來源事件**

| 時機 | 途徑 | λ |
|---|---|---|
| 建缸 | 水源（自來水、熟成缸水、野外淡水、天然海水）、野外底材（`live_sand`）、野外造景（`wild_rock`、`live_rock`、`driftwood`）、野外陸域底材（`soil`、`leaf_litter`） | 每功能群每途徑 0.5（一次） |
| 每 tick | `background` | 0.05／日 |
| 每 tick | `background`，具背景接種的微生物（新菌株） | 0.05／日 |
| 每 tick | `open_inflow`（開放系統） | 0.2／日 |
| 每 tick | `outside`（未加蓋） | 0.02／日；戶外 × 5 |
| 玩家加入水草、活石、沉木 | 對應途徑 | M5 |
| 換水 | 依水源以 0.1 × λ | M5 |

- 基因型：依 [05](05-species-generation.md) §3 環境加權抽樣；30% 機率改為重用同缸同功能群曾出現的基因型。
- 初始量：biomass 型為 `K` 的 0.01%；具背景接種的微生物新菌株為 20 日份背景接種量；cohort 型為 2–10 個半成長個體（年齡 = 0.5 × 成熟日數，質量 = 0.25 × 成體質量）。
- 具背景接種的微生物在缸內無族群時，每遊戲日以一日份接種量建立 3 個可存活的菌株（均分）。
- 建缸時的水源與野外材料微生物量依 §3.3 計算，物種由環境加權抽樣；建缸接種不計入外部輸入。
- 玩家投放：5 隻成體，不超過每缸容量；biomass 型為 `K` 的 1%；缸不符最小飼養空間時拒絕並產生事件。
- 同物種已有族群時併入該族群。
- 建立判定：族群首次連續 7 遊戲日淨成長 > 0 時列入圖鑑。建立判定不移除族群；未通過者依模擬自然存續或滅絕。

## 8. 滅絕

- cohort 型：所有世代群個體數總和 < 1
- biomass 型：`B / cellMass < 1`（不足一個細胞或單元）
- 滅絕產生事件；物種保留於登錄表與圖鑑。

## 9. 數值穩定

- 所有池與生物量下限為 0。
- 通量限制器：同一 tick 內某池的總消耗需求超過存量時，所有消耗該池的過程依相同比例縮減；保證非負與質量守恆。
- 單 tick 內 O₂、tan、no2、no3、po4、`substrateCod`、`food`、`detritus` 濃度或水量任一變化 > 50%（忽略 < 0.1 mg/L 的池）時拆分子步長（最多 8 個）；每 tick 由前一 tick 子步長數的一半起算，不足時加倍重算。

### 9.1 族群守恆原則

- 族群個體數與生物量只能由模擬過程（攝食、代謝、繁殖、衰老、壓力、逃逸、羽化）或玩家指令（撈除、用藥、換水）改變。
- 禁止以人為規則移除、削減或合併不同物種的族群。
- 容量 `K` 只透過擁擠效應（§5.3 成長項、§5.6 幼體加入項）作用，不截斷數值。

### 9.2 效能

- 互動表：每個族群預先計算可能的攝食對象（`diet` 權重 > 0、體型比在 `[ρmin, ρmax]`、區域重疊 > 0）；族群出現、滅絕或成長階段改變時更新。攝食計算只走訪互動表。
- 效能保險：單缸族群數達 2,000 時，暫停湧現與突變族群建立並產生「生態系飽和」事件；既有族群不受影響；族群數回落至 1,900 以下時恢復。

## 10. 通量與歷史紀錄

供營養層計算（§6）與 UI 關係呈現（[08](08-ui-design.md) §6）使用。

| 紀錄 | 鍵 | 儲存 |
|---|---|---|
| 攝食通量 | `(被吃者 NodeId, 攝食者 SpeciesId)` | 7 個每日累計桶，環狀覆寫 |
| 化學通量 | `(SpeciesId, ChemFluxKind)` | 7 個每日累計桶，環狀覆寫 |
| 族群歷史 | `SpeciesId` | 30 個每日平均值（cohort：個體數；biomass：生物量），環狀覆寫 |

- `NodeId` = 物種 ID，或非物種資源 `detritus`、`food`、`doc`。
- `ChemFluxKind`：`o2_produced`、`o2_consumed`、`tan_excreted`、`tan_uptake`、`no2_produced`、`no3_produced`、`no3_uptake`、`po4_uptake`、`co2_produced`、`co2_uptake`、`n2_released`。
- 每 tick 將 §5 計算出的量累加至當日桶；每遊戲日開始時推進桶索引並清零新桶。
- 七日內通量全為 0 的攝食邊與化學通量刪除；已不在缸內且 30 日歷史全為 0 的物種刪除歷史列。
- 所有紀錄以陣列與字串鍵物件儲存，可直接序列化。
- 環狀紀錄僅供即時運算與 UI；完整每日歷史由 worker 寫入資料庫（[10](10-database.md) §3）。

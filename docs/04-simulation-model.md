# 04 模擬模型

所有係數為初始值，於 M6 調校；實作以 `src/engine` 內具名常數為準。

## 1. 時間

- 1 tick = 1 遊戲小時；24 tick = 1 遊戲日。
- 速度 1× = 每現實秒 0.4 tick（1 遊戲日 ≈ 60 現實秒）；可選 4×、16×、暫停。

## 2. 每 tick 處理順序

1. 套用玩家指令
2. 環境：溫度、光照、氣體交換、pH；陸域濕度、土壤濕度、逕流
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

### 3.2 化學池（mg/L）

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
| `doc` | 溶解有機碳 |
| `detritus` | 碎屑（乾重） |
| `food` | 未食用飼料（乾重） |

## 4. 環境過程

**溫度**：有加熱器時 `T += (T_set − T) × 0.2`；無加熱器時 `T += (T_room − T) × 0.05`，`T_room = 22`。

**光照**：`I(t) = lightIntensity`，於光週期內；其餘時間為 0。

**O₂ 飽和度**
`O2sat(T, S) = (14.6 − 0.41T + 0.008T² − 0.000078T³) × (1 − 0.0057S)`

**氣體交換**
`kLa = 0.02 + 0.20 × aeration + 0.10 × flow`（每 tick）
`ΔO2 = kLa × (O2sat − O2)`；`ΔCO2 = kLa × (0.5 − CO2)`

**pH**：`pH = 7 + log10(3 × KH / CO2)`，限制於 5.5–9.0。

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
| 落葉分解 | `soil_bacteria`、`saprotrophic_fungus`：`litter → soilOrganic → soilTan + soilPo4 + CO₂`，速率形式同 §5.2 異營分解，× `soilMoisture` |
| 陸生植物吸收 | 吸收 `soilTan`、`soilPo4`，形式同 §5.3 |
| 逕流 | `0 < landFraction < 1` 時，每遊戲日 `soilTan`、`soilPo4` 的 5% 與 `litter` 的 1% 移入水域 `tan`、`po4`、`detritus`（以 `waterVolumeL` 換算濃度） |

## 5. 生物過程

### 5.1 通用耐受函數

`tol(x, min, opt, max)`：x 在 [min, max] 外為 0；在範圍內為 `exp(−((x − opt) / w)²)`，`w = (max − min) / 4`。

`f_env = tol(T) × tol(S) × tol(pH)`

### 5.2 微生物

| 過程 | 速率（每 tick） | 轉換 |
|---|---|---|
| 氨氧化（`aob`） | `V_aob × B × tan/(0.5 + tan) × o2/(1 + o2) × f_env` | tan → no2；耗 O₂ 3.43 mg/mg-N |
| 亞硝酸氧化（`nob`） | `V_nob × B × no2/(0.5 + no2) × o2/(1 + o2) × f_env` | no2 → no3；耗 O₂ 1.14 mg/mg-N |
| 水解 | `k_h × detritus`，`k_h = 0.01` | detritus → doc |
| 異營分解（`heterotroph`） | `V_het × B × doc/(2 + doc) × f_env` | doc → co2 + tan（0.07）+ po4（0.01）；耗 O₂ |
| 脫氮（`denitrifier`） | `V_den × B × no3/(2 + no3) × anoxicFraction × (1 − o2/O2sat)` | no3 → N₂（移出系統） |
| 真菌分解（`water_mold`） | `V_fun × B × detritus/(5 + detritus)` | detritus → doc |

- 細菌成長：`ΔB = Y × 轉換量 − d × B`；附著族群受 `surfaceArea` 容量限制。
- `V_aob`、`V_nob` 使接種後族群約 14 遊戲日達到能處理一般生物負荷的量。

### 5.3 初級生產者

`G = μmax × f_env × f_I × f_nut × B × (1 − B / K)`

- `f_I = I / (I + K_I)`；`I > I_opt` 時乘 `exp(−(I − I_opt) / I_opt)`（光抑制）
- `f_nut = min(N/(N + K_N), P/(P + K_P), CO2/(CO2 + K_C), [SiO2/(SiO2 + K_Si) 僅矽藻])`；`N = tan + no3`
- 固氮者（`cyanobacteria`）：N 項下限 0.3
- 水草：N、P 另計底材養分池
- `K` = [09](09-life-history.md) 最大密度 × 棲位對應量（[09](09-life-history.md) §7）× 細胞或個體質量
- 養分吸收（質量比）：N 0.07、P 0.01、SiO₂ 0.2（矽藻）；優先消耗 tan，再消耗 no3
- 光合產 O₂：1.2 mg/mg 生物量；消耗等量 CO₂ 換算值
- 夜間呼吸：`0.05 × μmax × B`，耗 O₂、產 CO₂

### 5.4 消費者

**代謝**（Kleiber，質量比代謝率）
`r_i = r0 × M_i^(−0.25) × 2^((T_body − 20)/10)`，M 以 mg 計

**體溫 `T_body`**：水域生物 = 水溫；陸域生物 = 空氣溫度；爬蟲類於光週期內 = `baskingTemperature`。

**區域使用**：每物種 `w_i` = 水域時間比例（W = 1、T = 0、A = 0.5，`habitat` 等位基因可調整 ±0.2）。
- 呼吸耗 O₂ 與排泄 tan、po4 的 `w_i` 部分進入水域，`1 − w_i` 部分進入 `soilTan`、`soilPo4`（陸域不耗水中 O₂）。
- 兩棲類卵與幼體 `w = 1`；變態後改為功能群區域值。

**攻擊率**
`a_ij = pref_ij × size_ij × overlap_ij × refuge_j × activity_i`

- `size_ij = exp(−(log10(M_j / M_i) − log10 ρ_i)² / (2σ_i²))`；`M_j / M_i` 超出 `[ρmin, ρmax]` 時為 0
- `overlap_ij` = 棲位重疊係數（0–1）× 區域重疊 `w_i w_j + (1 − w_i)(1 − w_j)`
- `refuge_j`：獵物庇護係數；水草、岩縫、殼降低被捕食率
- `activity_i`：夜行性物種白天 0.3、夜間 1.0；日行性相反

**攝食**（Holling II，多獵物）
`F_ij = B_i × a_ij R_j / (1 + h_i Σ_k a_ik R_k)`，`h_i = 1 / (4 r_i)`

**同化效率 e**：碎屑 0.2、藻／水草 0.45、細菌 0.6、動物 0.8。未同化部分 `(1 − e)F` 轉入 `detritus`。

**能量收支**
`ΔB_i = Σ_j e_j F_ij − r_i B_i − 死亡`
- 呼吸耗 O₂：`1.4 × r_i B_i`；排泄 tan：`0.07 × r_i B_i`；排泄 po4：`0.01 × r_i B_i`

### 5.5 共生（珊瑚 + 蟲黃藻）

- 蟲黃藻密度 `Z`（0–1）為珊瑚族群屬性。
- 光合供能：`Pz = Z × f_I × min(N, P 限制) × B_coral × p_z`；`Pz` 計入珊瑚能量收支。
- 白化：`I > I_bleach` 或 `T > T_opt + 2` 持續時，`Z` 每 tick 下降 2%；條件解除後每 tick 回升 0.5%。
- `Z < 0.2` 持續 14 遊戲日 → 珊瑚死亡率 ×5。
- 鈣化：成長消耗 `ca`；`ca` 不足時成長 ×0.2。

### 5.6 族群型態

**biomass 型**（微生物、藻、原生動物、水草）：`B` 與衰老狀態（`clonal_aging` 另有 `clonalGenerations`）；繁殖內含於成長項。

**cohort 型**（動物）：
- 族群由年齡世代群組成：`AgeCohort { birthTick, count, meanMass }`。
- 同一遊戲日出生者合併為同一世代群；每族群最多 24 個世代群，超過時合併相鄰且個體數總和最小的兩群（年齡、質量以個體數加權）。
- 生活階段：幼體（`age < maturityDays` 或 `meanMass < 0.5 × adultMass`）、成體、老年（`age > lifespanTyp`）。
- 成體將剩餘能量累積於 `reproReserve`；`reproReserve ≥ clutchSize × eggMass` 時產出新世代群：`count = clutchSize × 幼體存活 × recruitment × (1 − N/K)`。
- `recruitment`：normal 1、rare 0.05、none 0（[09](09-life-history.md) §2）。
- `modular` 群體（珊瑚、海綿、群體海鞘）：個體 = 群體；`meanMass` = 群體質量。

### 5.7 年齡與衰老

所有個體、細胞、模組、群體皆有年齡上限（[09](09-life-history.md)「遊戲上限」）。

| 衰老型態 | 規則 |
|---|---|
| `gompertz` | `h(a) = A·e^(G·a)`（每日）；物種推導時解 A、G，使僅計衰老時 `S(lifespanTyp) = 0.5`、`S(lifespanMax) = 0.01`，`S(a) = exp(−(A/G)(e^(G·a) − 1))`；`a ≥ lifespanMax` 全數死亡 |
| `negligible` | `h = h0`（常數；水螅 1.6 × 10⁻⁵／日）；`a ≥ 遊戲上限` 全數死亡 |
| `semelparous` | 產出世代群後，親世代群於 3 遊戲日內全數死亡 |
| `metamorphosis_exit` | `a ≥ 水中期` 且 `meanMass ≥ adultMass` → 移出系統（不轉碎屑），產生羽化事件 |
| `modular` | 模組汰換：每日 `B / moduleLifespan` 轉入碎屑，由成長補充；群體本身依 `gompertz` 套用群體壽命；群體海鞘有性生殖後 ≤ 70 遊戲日群體死亡 |
| `cell_turnover` | 每日汰換率 `d = 1 / cellLifespan`；汰換量轉入碎屑與 DOC 各半 |
| `clonal_aging` | `clonalGenerations += log2(1 + 成長量 / B)`；達 `sexualMin` 後每日有性生殖機率 `0.1 × B / K`，發生時歸零；達 `clonalMax` 時死亡率 +0.2／日 |

每 tick 套用 `h / 24`。

### 5.8 死亡

`m = h_age + m_stress`（`h_age` 見 §5.7）

| 壓力 | 條件 | 附加死亡率（每 tick） |
|---|---|---|
| 氨 | `NH3_free > nh3Max` | `0.02 × (NH3_free / nh3Max − 1)` |
| 亞硝酸 | `no2 > no2Max` | `0.01 × (no2 / no2Max − 1)` |
| 缺氧 | `o2 < o2Min` | `0.05 × (1 − o2 / o2Min)` |
| 溫度、鹽度、pH | `tol = 0` | 0.05 |
| 飢餓 | `meanMass < 0.5 × 正常質量` | 0.03 |
| 乾燥 | 陸域或兩棲生物 `humidity < humidityMin` | `0.02 × (1 − humidity / humidityMin)` |
| 缺陸域 | T 功能群成體，`landFraction = 0` | 0.2 |
| 缺水域 | W 功能群，`landFraction = 1` | 1 |
| 缺 UVB | 爬蟲類，`uvb = false` 連續 ≥ 30 遊戲日 | 0.002 |
| 逃逸 | 飛行昆蟲成蟲，`lid = false` | 0.05 |

死亡生物量轉入 `detritus`。

## 6. 營養層等級

- 生產者與分解者 TL = 1。
- 消費者 `TL_i = 1 + Σ_j w_ij × TL_j`；`w_ij` 為近 7 遊戲日攝食量占比。
- 每遊戲日重新計算。

## 7. 湧現

**機率**（每 tick，每個「功能群 × 來源途徑」組合）
`p = λ(vector, archetype) × suitability`

`suitability = f_env × foodAvailability × toxicityOk × capacityOk`

- `foodAvailability`：可食資源量正規化至 0–1
- `toxicityOk`：環境未超出耐受上限時為 1，否則為 0
- `capacityOk`：缸符合最小飼養空間時為 1（[09](09-life-history.md) §7）
- `f_env` 於陸域功能群改用濕度耐受取代鹽度耐受

**來源事件**

| 時機 | 處理 |
|---|---|
| 建缸 | 依水源、底材、造景的來源途徑，對所有功能群各擲一次初始接種 |
| 每 tick | `background` 與 `open_inflow` 依 λ 擲骰 |
| 玩家加入水草、活石、沉木 | 對應途徑擲一次搭便車 |
| 換水 | 依水源以 0.1 × λ 擲骰 |

- 湧現時依 [05](05-species-generation.md) §3 抽樣基因型；30% 機率改為重用同缸同功能群曾出現的基因型。
- 初始量：biomass 型為 `K` 的 0.1%；cohort 型為 2–10 個幼體。
- 建立判定：族群首次連續 7 遊戲日淨成長 > 0 時列入圖鑑。建立判定不移除族群；未通過者依模擬自然存續或滅絕。

## 8. 滅絕

- cohort 型：所有世代群個體數總和 < 1
- biomass 型：`B / cellMass < 1`（不足一個細胞或單元）
- 滅絕產生事件；物種保留於登錄表與圖鑑。

## 9. 數值穩定

- 所有池與生物量下限為 0。
- 單 tick 變化 > 50% 時拆分子步長（最多 8 個）。

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
- 七日內通量全為 0 的攝食邊刪除。
- 所有紀錄以陣列與字串鍵物件儲存，可直接序列化。
- 環狀紀錄僅供即時運算與 UI；完整每日歷史由 worker 寫入資料庫（[10](10-database.md) §3）。

# 11 地理、氣候與季節

建缸時以分類預設選擇地點；地點決定推薦設定、季節、戶外環境與自然來源的物種組成。所有推薦值皆可自訂。

## 1. 地點分類

| 維度 | 選項 | 代表值 |
|---|---|---|
| 半球 | 北、南 | 南半球季節相位 +182.5 日 |
| 緯度帶 | 熱帶（0–23.5°）、亞熱帶（23.5–35°）、溫帶（35–55°）、亞寒帶（55–66.5°）、寒帶（> 66.5°） | 代表緯度 10°、28°、45°、62°、72° |
| 海拔帶 | 低地（0–300 m）、丘陵（300–1,000 m）、山地（1,000–2,500 m）、高山（> 2,500 m） | 代表海拔 100、600、1,800、3,500 m |
| 乾濕型 | 全年濕潤、乾濕季、夏乾（地中海型）、半乾旱、乾旱 | — |
| 大陸度 | 海洋性、大陸性（僅溫帶與亞寒帶的全年濕潤） | — |
| 棲地類型 | §5 | — |
| 生物地理區 | §6 | — |

- 不存在的組合不可選（§2「不可選」列、§5.2）。
- 代表緯度、代表海拔可在範圍內自訂。

## 2. 氣候型

海平面附近測站 1991–2020 氣候平年值。`DTR` = 年平均日較差；霜日 = 日最低 ≤ 0 °C 日數。

| 緯度帶 × 乾濕型 | Köppen | 代表測站 | 年均溫 °C | 最暖月／最冷月 °C | DTR | 相對濕度 濕季／乾季 % | 年雨量 mm；雨季 | 霜日 |
|---|---|---|---|---|---|---|---|---|
| 熱帶 × 全年濕潤 | Af | 新加坡（1.4°N） | 27.8 | 28.6（5 月）／26.8（1 月） | 6.6 | 81–86 全年 | 2,113；每月 > 100 | 0 |
| 熱帶 × 乾濕季 | Aw | 達爾文（12.4°S） | 27.9 | 29.6（11 月，估）／25.2（7 月） | 9.1 | 70／40 | 1,832；12–3 月 | 0 |
| 熱帶 × 夏乾 | — | 不可選 | | | | | | |
| 熱帶 × 半乾旱 | BSh | 尼阿美（13.5°N） | 29.9 | 34.7（4 月）／24.6（1 月） | 13.3 | 55–74／17–34 | 554；6–9 月 | 0 |
| 熱帶 × 乾旱 | BWh | 喀土穆（15.6°N，380 m） | 30.4 | 35.0（5 月）／23.6（1 月） | 13.9 | 42–53／14–26 | 120；7–9 月 | 0 |
| 亞熱帶 × 全年濕潤 | Cfa | 紐奧良（30°N） | 21.4 | 28.9（8 月）／12.4（1 月） | 8.9 | 76 全年 | 1,609；全年，6–8 月略多 | 5（估） |
| 亞熱帶 × 乾濕季 | Cwa | 香港（22.3°N） | 23.5 | 28.9（7 月）／16.5（1 月） | 4.4 | 81–83／70–73 | 2,431；5–9 月 | 0 |
| 亞熱帶 × 夏乾 | Csa | 伯斯（32°S） | 19.0 | 25.1（2 月）／13.3（7 月） | 11.9 | 56／39 | 724；5–8 月 | 1（估） |
| 亞熱帶 × 半乾旱 | BSh | （估） | 23.5（估） | 31.5／15（估） | 13（估） | 50／25（估） | 375（估）；單一短雨季 | 2（估） |
| 亞熱帶 × 乾旱 | BWh | 利雅德（24.7°N，600 m） | 26.9 | 36.9（8 月）／14.6（1 月） | 13.0 | 47／10 | 100；1–4 月 | 0 |
| 溫帶 × 全年濕潤（海洋性） | Cfb | 倫敦（51.5°N） | 12.0 | 18.9（7 月）／6.0（1 月） | 7.7 | 75–85（估） | 563；全年 | 30（估） |
| 溫帶 × 全年濕潤（大陸性） | Dfb | 明尼亞波利斯（45°N） | 8.3 | 23.5（7 月）／−8.8（1 月） | 9.4 | 67.5 | 803；5–8 月 | 150（估） |
| 溫帶 × 乾濕季 | Dwa | 北京（39.9°N） | 13.3 | 27.2（7 月）／−2.7（1 月） | 10.2 | 69–71／40–43 | 528；6–8 月 | 120（估） |
| 溫帶 × 夏乾 | Csa | 羅馬（41.8°N） | 15.8 | 25.4（8 月）／7.5（1 月） | 10.1 | 75／64 | 752；10–12 月 | 15（估） |
| 溫帶 × 半乾旱 | BSk | 阿斯特拉罕（46°N） | 10.9 | 26.1（7 月）／−3.6（1 月） | 10.2 | 84–86／58 | 231；全年 | 110（估） |
| 溫帶 × 乾旱 | BWk | 阿什哈巴德（38°N，220 m） | 17.5 | 31.7（7 月）／3.9（1 月） | 12.2 | 77–78／34 | 221；12–4 月 | 50（估） |
| 亞寒帶 × 全年濕潤（海洋性） | Dfc | 阿爾漢格爾斯克（64.5°N） | 1.9 | 16.5（7 月）／−11.6（1 月） | 8.0 | 68–89 | 636；7–10 月 | 190（估） |
| 亞寒帶 × 全年濕潤（大陸性） | Dfc | 費爾班克斯（64.8°N） | −2.1 | 17.2（7 月）／−22.4（1 月） | 11.3 | 65 | 296；6–9 月 | 245（估） |
| 亞寒帶 × 乾濕季 | Dwc | （估） | −3（估） | 16／−25（估） | 12（估） | 70／60（估） | 400（估）；6–8 月 | 230（估） |
| 亞寒帶 × 夏乾、半乾旱、乾旱 | — | 不可選 | | | | | | |
| 寒帶 × 全年濕潤 | ET | 烏特恰維克（71.3°N） | −10.2 | 5.4（7 月）／−24.4（2 月） | 6.1 | 87–91／70–74 | 137；7–9 月 | 330 |
| 寒帶 × 乾旱 | ET/EF | 尤里卡（80°N） | −18.1 | 6.8（7 月）／−36.8（2 月） | 6.6 | 70 | 78；7–8 月 | 340（估） |
| 寒帶 × 乾濕季、夏乾、半乾旱 | — | 不可選 | | | | | | |

測站高於 0 m 者，以 §3 遞減率換算至代表海拔。

## 3. 大氣與天文公式

| 項目 | 公式 | 來源 |
|---|---|---|
| 氣溫遞減 | `T(z) = T_station − 0.0065 × (z − z_station)` | 國際標準大氣 |
| 氣壓 | `P(z) = 101325 × (1 − 2.25577×10⁻⁵ z)^5.25588` Pa | 國際標準大氣 |
| 溶氧飽和度 | `DO = DO₀ × F_S × F_P`（§3.1） | USGS（Benson & Krause） |
| 日照長度 | Forsythe CBM 模型（§3.2） | Forsythe et al. 1995 |
| 正午晴空輻照度 | `z_n = |lat − δ|`；`AM = 1 / cos z_n`；`I_D = 1.353 × [(1 − 0.14h) × 0.7^(AM^0.678) + 0.14h]` kW/m²（h 為海拔 km）；`I_G = 1.1 × I_D` | Laue 1970（PVEducation） |
| 太陽赤緯 | `δ = 0.409 × sin(2πJ/365 − 1.39)` | FAO-56 |
| PPFD | `PPFD ≈ 2.1 × I_G`（µmol·m⁻²·s⁻¹，I_G 以 W/m²） | PAR 比例 0.45–0.5 × 4.57 |
| UV 隨海拔 | 每 1,000 m +12% | 香港天文台 |

### 3.1 溶氧飽和度（取代 [04](04-simulation-model.md) §4 舊式）

- `T` = 水溫 K；`t` = 水溫 °C；`S` = 鹽度 ppt；`P` = 氣壓 atm
- `DO₀ = exp(−139.34411 + 1.575701×10⁵/T − 6.642308×10⁷/T² + 1.243800×10¹⁰/T³ − 8.621949×10¹¹/T⁴)` mg/L
- `F_S = exp(−S × (0.017674 − 10.754/T + 2140.7/T²))`
- `u = exp(11.8571 − 3840.70/T − 216961/T²)`；`θ₀ = 0.000975 − 1.426×10⁻⁵ t + 6.436×10⁻⁸ t²`
- `F_P = (P − u)(1 − θ₀P) / ((1 − u)(1 − θ₀))`
- 驗算值（淡水，mg/L）：0 °C／0 m = 14.62；20 °C／0 m = 9.09；20 °C／2,500 m = 6.65

### 3.2 日照長度

- `θ = 0.2163108 + 2 × atan(0.9671396 × tan(0.00860 × (J − 186)))`
- `φ = asin(0.39795 × cos θ)`
- `D = 24 − (24/π) × acos(clamp((sin 0.8333° + sin L × sin φ) / (cos L × cos φ), −1, 1))` 小時
- `L` 南半球取負值；`D` 為 0 時極夜、24 時極晝。

## 4. 季節時鐘與每日氣候

- 遊戲日期：`J = (startDayOfYear + floor(tick / 24)) mod 365`；`startDayOfYear` 於建缸設定，預設為所在半球春分（北 80、南 263）。
- 年循環：`T_day(J) = T_ann + A × cos(2π(J − J_warm) / 365)`，`A = (T_warm − T_cold) / 2`，`J_warm` = 最暖月中日。
- 日循環：`T(h) = T_day(J) + (DTR / 2) × cos(2π(h − 15) / 24)`（最高溫 15 時）。
- 相對濕度：雨季月份取濕季值，其餘取乾季值；月界前後 15 日線性過渡。
- 降雨：月雨量 `P_m` 依雨季分配（雨季月份平分年雨量的 80%，其餘月份平分 20%，全年平均者均分）；每日降雨機率 `p = min(0.9, P_m / 300)`（估），降雨量 = `P_m / 30 / p`。以當 tick 亂數判定。
- 日照率（晴空比例）：雨季 0.4、乾季 0.8、全年濕潤 0.5（估）；`PPFD_natural = PPFD_clear × (0.25 + 0.75 × 日照率)`。
- 蒸發（開放水面，mm/日）：乾旱 6.5、半乾旱 4.4、熱帶濕潤 5、亞熱帶濕潤 4（估）、溫帶夏 3.5／冬 0.5（估）、亞寒帶夏 2.5／結冰時 0（估）、寒帶夏 1（估）。

## 5. 棲地類型與推薦設定

### 5.1 推薦值

| 棲地 | 缸型 | 陸域 % | 水深 cm | 水溫 °C | pH | 硬度 | 鹽度 ppt | 水流 | 單寧 | 氣溫 °C | 濕度 % | 噴霧 | 陸域底材 | 曬點 | 光照 | 光週期 h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 溪流 | 水族 | 0–10 | 15–40 | 20–26 | 6.5–7.5 | GH 5–12 | 0 | 強 | 清澈 | — | — | — | — | — | 中–強 | 10–12 |
| 湖泊 | 水族 | 0 | 40–60+ | 溫帶 10–22／熱帶 23–28 | 6.5–8.0（估） | GH 4–12（估） | 0 | 弱–中 | 清澈 | — | — | — | — | — | 中–強 | 10–12 |
| 池塘濕地 | 水陸 | 30–50（估） | 10–30 | 冷水 4–25／熱帶 24–30 | 6.5–8.0 | GH 6–15（估） | 0 | 靜止 | 淡 | 15–28（估） | 60–80（估） | 0–1 | 壤土、挺水植物 | 龜 28–32（估） | 強 | 12–14（估） |
| 黑水沼澤 | 水族／水陸 | 0–30（估） | 20–50 | 26–30 | 4.0–6.0 | GH 0–3、KH 0–1 | 0 | 靜止–緩 | 濃 | 26–30 | 80–95（估） | 1–2 | 落葉、白砂、樹根 | — | 弱 | 10–12 |
| 雨林地面 | 雨林 | 85–100 | 0–5 | — | 5.5–7.0（估） | 軟（估） | 0 | 靜止 | 淡 | 日 22–27／夜 20 | 80–100 | 2–6 | 排水層＋土壤＋落葉 | 無 | 弱–中 | 12 |
| 雲霧林 | 雨林 | 90–100 | 0–5 | 15–22 | 6.0–7.0（估） | 軟（估） | 0 | 涓流 | 淡 | 日 18–24／夜 13–16 | 85–100 | 3–6 | 苔蘚、附生植物、泥炭土 | 無 | 中 | 12 |
| 紅樹林河口 | 半鹹水陸 | 50–66 | 5–30 | 24–30 | 7.5–8.3（估） | KH 8–12（估） | 7–20 | 中、潮汐 | 淡–中 | 24–30 | 70–90 | 1–2 | 砂泥 | 選配（估） | 強 | 12 |
| 岩岸潮間帶 | 潮汐缸 | 10–30（隨潮汐） | 10–40（隨潮汐） | 溫帶 10–16／熱帶 24–28 | 8.0–8.3 | KH 7–10 | 32–35 | 強湧浪 | 無 | 環境溫度 | 浪花區 | 無 | 岩石、礫石 | 無 | 強 | 12 |
| 珊瑚礁 | 海水 | 0 | 40–60+ | 24–28 | 8.1–8.4 | KH 7–11、Ca 380–450 | 34–36 | 強 | 無 | — | — | — | — | — | 強（PAR 50–400） | 8–12 |
| 沙漠 | 純陸 | 95–100 | 水盆 | — | — | — | — | — | — | 冷區 29／環境 30–35；夜間關熱源 | 20–40 | 無 | 砂土、岩石 | 49–54、UVI 4–6 | 極強＋UVB | 12–14 |
| 莽原水塘 | 水陸、季節乾涸 | 20–40（估） | 10–30 | 22–28 | 6.5–7.5 | 軟 | 0 | 靜止 | 濁褐 | 日 25–35／夜 18–22（估） | 40–70（估） | 隨季節 | 黏土、砂 | 爬蟲需要（估） | 強 | 12 |
| 溫帶林地 | 純陸 | 90–100 | 水盆 | 13–20 | 6.0–7.0（估） | 軟 | 0 | 靜止 | 淡 | 日 16–20／夜 ≥ 13 | 60–80 | 每日 | 表土＋落葉＋苔蘚 | 無 | 弱 | 10–14 |
| 洞穴湧泉 | 水族／水陸 | 0–20（估） | 10–30 | 當地年均溫 ±3（溫帶岩溶 8–15） | 7.0–8.0 | GH/KH 8–20（估） | 0 | 中（泉）／靜止（洞） | 清澈 | 同水溫 | 90–100（估） | 無 | 岩石、淤泥 | 無 | 無–弱 | 0–8（估） |
| 泥炭沼 | 水陸 | 60–80（估） | 5–20 | 5–25（估） | 3.5–4.5 | ~0 | 0 | 靜止 | 濃 | 10–28（估） | 70–90（估） | 雨水 | 活水苔＋泥炭 | 無 | 強 | 12–16（估） |
| 高山溪流 | 冷水水族 | 0–10 | 10–30 | 2–10 | 6.5–7.5（估） | GH 2–6（估） | 0 | 強 | 清澈或冰河濁 | 0–15（估） | 60–90（估） | 無 | 礫石、卵石 | 無 | 中–強 | 12–16 |

範圍取中點作為推薦值。水源與材料推薦：室內為自來水（鹽度 ≥ 5 ppt 時為 RO 水 + 人工海鹽）與乾淨材料；戶外為該棲地的野外水與所在地區系的野外材料。室內模式的水溫、氣溫推薦值 = 棲地範圍內最接近所選氣候型暖季月均溫者（含海拔修正）。

推薦值存於參考資料 `habitats.specs.<棲地>`（含野外水源 `wildWater`、推薦底材 `recommendedSubstrate`、推薦造景 `recommendedHardscape`）；預設缸體尺寸、室溫、底材深度、加蓋濕度門檻、過濾器與曝氣門檻存於 `setup.*`（[10](10-database.md) §2.1）。

### 5.2 可選條件

| 棲地 | 緯度帶 | 海拔帶 | 乾濕型 |
|---|---|---|---|
| 溪流 | 熱帶–亞寒帶 | 低地–山地 | 全年濕潤、乾濕季 |
| 湖泊 | 全部 | 全部 | 全部（乾旱時為鹽湖） |
| 池塘濕地 | 熱帶–亞寒帶 | 低地–山地 | 全年濕潤、乾濕季、夏乾 |
| 黑水沼澤 | 熱帶、亞熱帶 | 低地 | 全年濕潤 |
| 雨林地面 | 熱帶 | 低地–丘陵 | 全年濕潤 |
| 雲霧林 | 熱帶、亞熱帶 | 丘陵–高山 | 全年濕潤 |
| 紅樹林河口 | 熱帶、亞熱帶 | 低地 | 全部 |
| 岩岸潮間帶 | 全部 | 低地 | 全部 |
| 珊瑚礁 | 熱帶、亞熱帶 | 低地 | 全部 |
| 沙漠 | 熱帶–溫帶 | 低地–山地 | 半乾旱、乾旱 |
| 莽原水塘 | 熱帶、亞熱帶 | 低地–丘陵 | 乾濕季 |
| 溫帶林地 | 溫帶 | 低地–山地 | 全年濕潤、夏乾 |
| 洞穴湧泉 | 熱帶–亞寒帶 | 全部 | 全部 |
| 泥炭沼 | 溫帶、亞寒帶 | 低地–山地 | 全年濕潤 |
| 高山溪流 | 全部 | 高山（亞寒帶、寒帶可至低地） | 全年濕潤 |

### 5.3 棲地專屬機制

- **潮汐**（岩岸潮間帶、紅樹林河口）：水深以半日潮週期 12.42 h 正弦變化，振幅為設定水深的 50%；陸域比例隨水位反向變化。
- **季節乾涸**（莽原水塘）：戶外模式下由降雨與蒸發自然產生；室內模式可選「模擬乾季」：乾季月份每日水位 −2%（標稱水量），雨季月份以水源補水每日 +2% 至標稱水量。

## 6. 生物地理區

### 6.1 區系

| 代碼 | 名稱 | 範圍 | 對應海域 |
|---|---|---|---|
| NA | 新北區 | 北美大部、格陵蘭 | 大西洋、東太平洋 |
| NT | 新熱帶區 | 中南美、加勒比海、南佛州、墨西哥火山帶 | 大西洋、東太平洋 |
| PA | 古北區 | 歐亞大陸、北非、日本、華北 | 大西洋、印度—太平洋 |
| AT | 非洲熱帶區 | 撒哈拉以南、馬達加斯加、阿拉伯 | 大西洋、印度—太平洋 |
| IM | 東洋區 | 印度次大陸、東南亞、華南、大巽他群島 | 印度—太平洋 |
| AU | 澳洲區 | 澳洲、新幾內亞、紐西蘭、華萊士區 | 印度—太平洋 |
| OC | 大洋洲區 | 玻里尼西亞、密克羅尼西亞、斐濟 | 印度—太平洋、東太平洋 |
| AN | 南極區 | 南極洲、南喬治亞 | 南大洋 |

### 6.2 規則

- 自然來源途徑（`background`、`pond_water`、`natural_seawater`、`open_inflow`、`outside`、`soil`、`leaf_litter`、`plant`、`live_rock`、`live_sand`、`driftwood`）只產生原生於所選區系（或其對應海域）的功能群。
- 野外採集的水與材料依其採集地區系觸發途徑；採集地區系與缸所在區系不同時，湧現物種標記為「外來」。
- `player_release`、圖鑑重新投放、`feeder_escape` 不受區系限制。
- 粒徑 < 1 mm 的微生物與微型動物多為世界性分布（Finlay 2002）。

### 6.3 功能群原生區系

全部 = 8 區系；全部−AN = 除南極區外。海域：IP 印度—太平洋、ATL 大西洋、EP 東太平洋、SO 南大洋。

| 功能群 | 原生區系 | 依據 |
|---|---|---|
| `aob`、`nob`、`heterotroph`、`denitrifier`、`soil_bacteria`、`biofilm`、`cyanobacteria`、`water_mold`、`saprotrophic_fungus`、`diatom`、`green_algae`、`phytoplankton`、`macroalgae`、`ciliate`、`rotifer`、`nematode`、`soil_nematode`、`copepod`、`ostracod`、`cladoceran`、`moss_liverwort`、`terrestrial_plant`、`springtail`、`detritivore_mite`、`predatory_mite` | 全部 | 實測（Finlay 2002；澳洲南極局） |
| `amphipod`、`isopod`、`bristle_worm`、`detritus_worm`、`potworm`、`shrimp`、`sea_urchin`、`brittle_star`、`sea_star`、`tunicate`、`octopus` | 全部（南極區僅海域） | （估） |
| `zooxanthellae`、`coral`、`mantis_shrimp`、`grouper`、`tang`、`triggerfish`、`moray`、`marine_stingray`、`spiny_lobster`、`benthic_shark` | IP、ATL、EP（熱帶–暖溫帶） | （估） |
| `planarian`、`hydra`、`snail`、`bivalve`、`sponge`、`aquatic_plant`、`planktivore_fish`、`grazer_fish`、`benthic_omnivore_fish`、`piscivore_fish`、`odonate_nymph`、`predatory_insect`、`terrestrial_isopod`、`millipede`、`centipede`、`spider`、`pseudoscorpion`、`land_snail_slug`、`fungus_gnat`、`fruit_fly`、`cricket`、`rove_beetle`、`darkling_beetle`、`small_arboreal_lizard` | 全部−AN | 澳洲南極局；其餘（估） |
| `earthworm` | 全部−AN（OC 少或無） | 澳洲南極局 |
| `ant` | 全部−AN（夏威夷無原生） | 夏威夷大學 |
| `crayfish` | NA、PA、NT、AT（僅馬達加斯加）、AU | Parastacidae 文獻 |
| `bromeliad_epiphyte` | NT | 蒙特婁植物園 |
| `dart_frog_small` | NT、AT（馬達加斯加） | Mantella |
| `tree_frog` | NA、NT、PA、AT、IM、AU | 樹蛙科分布 |
| `semi_aquatic_toad` | PA、IM | AmphibiaWeb |
| `aquatic_frog_dwarf`、`aquatic_frog_clawed`、`bichir` | AT | Wikipedia 物種頁 |
| `large_frog_ambush`、`axolotl`、`oscar`、`pacu`、`silver_dollar`、`large_pleco`、`freshwater_stingray` | NT | Wikipedia、WWF NT0310、FishBase |
| `large_frog_aquatic` | NA | Wikipedia |
| `newt` | PA、NA、IM | AmphibiaWeb |
| `semi_aquatic_lizard` | NT、IM、AU | （估） |
| `water_monitor` | IM、AU（華萊士區） | 澳洲生物多樣性目錄 |
| `garter_water_snake` | NA、NT | Wikipedia |
| `small_python` | AT、IM、AU | Pythonidae 分布 |
| `musk_turtle`、`slider_turtle` | NA、NT | Wikipedia、Vertebrate Zoology |
| `softshell_turtle` | NA、PA、AT、IM、AU | ADW |
| `vampire_crab` | IM、AU | Wikipedia |
| `mangrove_crab`、`fiddler_crab` | IP、ATL、EP 沿岸 | PMC9755989 |
| `mudskipper`、`scat` | IP、東大西洋（西非） | （估） |
| `arowana` | NT、IM、AU | Britannica |
| `gar` | NA、NT | Wikipedia |
| `snakehead` | AT、IM、PA | Wikipedia |
| `cichlid_pursuit_predator` | NT、AT | Kullander 2003 |
| `koi`、`goldfish` | PA、IM | FAO |
| `giant_catfish` | NA、NT、PA、AT、IM、AU | （估） |
| `fire_eel` | IM | FishBase |
| `lionfish` | IP | Wikipedia |
| `cuttlefish` | IP、東大西洋 | 澳洲生物多樣性目錄 |

南極區：淡水與陸域只有微生物、苔蘚、輪蟲、線蟲、小型甲殼類、跳蟲、蟎。

## 7. 室內與戶外

| 項目 | 室內 | 戶外 |
|---|---|---|
| 環境溫度 | 室溫設定（預設 22 °C） | §4 每日氣候 |
| 水溫 | [04](04-simulation-model.md) §4 | `dT_w/dt = (T_air_daymean − T_w) / τ`，`τ = 3 + 0.1 × 水深 cm` 日（估）；加熱器可疊加；下限 0 °C |
| 光照 | 燈具；可選「季節光照」：光週期 = §3.2 日照長度 | 自然光 §3、§4；遮蔭 0–90% 可設 |
| UVB | 燈具 | 自然光，遮蔭 < 70% 時視為有 UVB |
| 濕度 | [04](04-simulation-model.md) §4.1 | 未加蓋 = 當地相對濕度；加蓋依 §4.1 |
| 降雨 | 無 | 水量 += 降雨 mm × 開放水面面積；雨水含無機氮（[04](04-simulation-model.md) §3.3）；超過缸高溢流，依比例帶走溶質 |
| 蒸發 | 自動補水，水量固定 | 水量 −= 蒸發 mm × 水面面積；溶質留存 |
| 結冰 | 無 | 水溫 0 °C 且熱量持續流失 → 冰封：`kLa × 0.05`；光照 × 0.5，降雪期間 × 0.05（估） |
| 氣壓 | §3 代表海拔 | §3 代表海拔 |
| `outside` 途徑 | λ × 1 | λ × 5（估） |

- 戶外水量降為 0 時：W 功能群適用「缺水域」壓力（[04](04-simulation-model.md) §5.8）。
- 冬季冰封下溶氧持續 < 1 mg/L 數日 → 冬季缺氧死亡（由 [04](04-simulation-model.md) §5.8 缺氧壓力自然產生）。

## 8. 參考來源

- Köppen–Geiger：[Beck et al. 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC6207062)、[Peel et al. 2007](https://hess.copernicus.org/articles/11/1633/2007/)
- 測站平年值：[新加坡](https://en.wikipedia.org/wiki/Climate_of_Singapore)、[孟買](https://en.wikipedia.org/wiki/Mumbai)、[達爾文](https://en.wikipedia.org/wiki/Darwin,_Northern_Territory)、[尼阿美](https://en.wikipedia.org/wiki/Niamey)、[喀土穆](https://en.wikipedia.org/wiki/Khartoum)、[紐奧良](https://en.wikipedia.org/wiki/New_Orleans)、[香港](https://en.wikipedia.org/wiki/Climate_of_Hong_Kong)、[伯斯](https://en.wikipedia.org/wiki/Climate_of_Perth)、[利雅德](https://en.wikipedia.org/wiki/Riyadh)、[倫敦](https://en.wikipedia.org/wiki/Climate_of_London)、[明尼亞波利斯](https://en.wikipedia.org/wiki/Climate_of_Minneapolis%E2%80%93Saint_Paul)、[北京](https://en.wikipedia.org/wiki/Beijing)、[羅馬](https://en.wikipedia.org/wiki/Climate_of_Rome)、[阿斯特拉罕](https://en.wikipedia.org/wiki/Astrakhan)、[阿什哈巴德](https://en.wikipedia.org/wiki/Ashgabat)、[阿爾漢格爾斯克](https://en.wikipedia.org/wiki/Arkhangelsk)、[費爾班克斯](https://en.wikipedia.org/wiki/Fairbanks,_Alaska)、[烏特恰維克](https://en.wikipedia.org/wiki/Utqiagvik,_Alaska)、[尤里卡](https://en.wikipedia.org/wiki/Eureka,_Nunavut)
- 大氣：[國際標準大氣](https://en.wikipedia.org/wiki/International_Standard_Atmosphere)、[氣壓公式](https://en.wikipedia.org/wiki/Barometric_formula)
- 溶氧：[USGS 備忘錄 2011.03](https://water.usgs.gov/admin/memo/QW/qw11.03.pdf)、[USGS 81.11](https://water.usgs.gov/admin/memo/QW/qw81.11.html)、[LakeMetabolizer](https://rdrr.io/pkg/LakeMetabolizer/man/o2.at.sat.html)
- 日照與輻射：[Forsythe 1995（geosphere）](https://r-packages.io/packages/geosphere/daylength)、[FAO-56 第 3 章](http://www.fao.org/4/x0490e/x0490e07.htm)、[PVEducation 空氣質量](https://www.pveducation.org/pvcdrom/properties-of-sunlight/air-mass)、[PAR](https://en.wikipedia.org/wiki/Photosynthetically_active_radiation)、[bigleaf Rg.to.PPFD](https://search.r-project.org/CRAN/refmans/bigleaf/html/Rg.to.PPFD.html)、[香港天文台 高海拔 UV](https://www.hko.gov.hk/en/education/weather/sunshine-and-uv/00120-ultraviolet-radiation-at-high-altitude.html)
- 結冰與冬季缺氧：[Biogeosciences 2019 冰下氣體交換](https://bg.copernicus.org/articles/16/3351/2019/)、[明尼蘇達 DNR](https://dnr.state.mn.us/areas/fisheries/waterville/winterkill.html)、[密西根 DNR RR1014](https://www.dnr.state.mi.us/PUBLICATIONS/PDFS/DNRFishLibrary/ResearchReports/RR1001-RR1100/RR1014.pdf)
- 水溫與蒸發：[Air2Water](https://hess.copernicus.org/articles/17/3323/2013/)、[MDPI Water 2020](https://www.mdpi.com/2073-4441/12/5/1508)、[昆士蘭環境報告](https://www.ehp.qld.gov.au/state-of-the-environment/finding/?id=4.1.0.3)、[MAUSAM](https://mausamjournal.imd.gov.in/index.php/MAUSAM/article/view/2378)
- 棲地設定：[Biotope Aquarium](https://biotope-aquarium.info/?p=11458)、[Biotope Aquarium Project](https://biotopeaquariumproject.com/bin/igarape-do-aturia-rio-negro-basin-amazonas-brazil-acvalgueiro/)、[Malawi cichlids](https://malawicichlids.com/mw01011.htm)、[Tanganyika 水質](https://tanganyika.si/slides/Lake%20Tanganyika%20Water.html)、[OATA 冷水缸](https://ornamentalfish.org/wp-content/uploads/Unheated-aquarium-inhabitants.pdf)、[Josh's Frogs 濕度](https://joshsfrogs.com/blog/low-dart-frog-humidity)、[Cloud forest](https://en.wikipedia.org/wiki/Cloud_forest)、[Brackish aquarium](https://en.wikipedia.org/wiki/Brackish-water_aquarium)、[USDA 紅樹林](https://data.fs.usda.gov/research/pubs/iitf/ja_iitf_2015_Soares001.pdf)、[Glaucus 潮間帶](https://glaucus.org.uk/PF2.htm)、[珊瑚礁水質](https://saltwateraquariumblog.com/9-most-important-reef-tank-aquarium-water-parameters)、[珊瑚礁分布](https://geo.libretexts.org/Workbench/Introduction_to_Ocean_Sciences/15%3A_Ocean_Ecosystems/15.02%3A_Coral_Reefs)、[ReptiFiles Uromastyx](https://reptifiles.com/uromastyx-care-sheet)、[火蠑螈](https://amphibiancare.com/2005/05/31/fire-salamander/)、[奧地利岩溶泉](https://opac.geologie.ac.at/ais312/dokumente/Statistical-analysis-of-karst-springs-in-Lower-Austria.pdf)、[泥炭沼](https://www.d.umn.edu/~tbates/ened3341/BogReviewInfo.pdf)、[Vermont 沼澤](https://vtfishandwildlife.com/conserve/conservation-planning/natural-community-fact-sheets/dwarf-shrub-bog)
- 生物地理區：[Biogeographic realm](https://en.wikipedia.org/wiki/Biogeographic_realm)、[WWF 生態區資料](https://databasin.org/datasets/13454660867a411fbe5dad0f75cdf02a)、[Finlay 2002 微生物世界性分布](https://web.nies.go.jp/chiiki1/protoz/refere/id6999/6798.htm)、[澳洲南極局 無脊椎](https://www.antarctica.gov.au/about-antarctica/animals/invertebrates/)、[夏威夷螞蟻](https://hawaii.edu/ant/home/home.html)、[Parastacidae](https://en.wikipedia.org/wiki/Parastacidae)、[AmphibiaWeb Salamandridae](https://amphibiaweb.org/lists/Salamandridae.shtml)、[WWF NT0310](https://ecoregions.worldwildlife.org/ecoregions/nt0310)、[ADW Trionychidae](https://animaldiversity.org/accounts/Trionychidae)、[Varanus](https://biodiversity.org.au/afd/taxa/Varanus)、[Geosesarma](https://en.wikipedia.org/wiki/Geosesarma)、[招潮蟹分布 PMC9755989](https://pmc.ncbi.nlm.nih.gov/articles/PMC9755989)、[Kullander 2003](https://www.svenkullander.se/publications/Kullander_Cichlidae_2003.pdf)、[FAO 鯉](https://www.fao.org/4/X5628E/x5628e09.htm)、[Sepiidae](https://biodiversity.org.au/afd/taxa/SEPIIDAE)

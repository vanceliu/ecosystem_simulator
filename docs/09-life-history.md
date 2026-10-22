# 09 生活史與族群密度

各功能群的壽命、成熟、繁殖、體型與族群密度。物種抽樣範圍與容量上限以本文件為準；年齡機制見 [04](04-simulation-model.md) §5.6–5.8。

## 1. 標記

- **來源規則**：每個數值必須有來源。依據分兩類：
  - **實測**：來源直接量測該功能群代表物種。
  - **（推）**：來源量測近緣類群，依明載的推算方式換算；必須同時列出來源與推算方式。
- **（估）**：尚未補齊來源的暫定值；可進入 `src/content`（`basis = estimated`），持續補齊來源後改為實測或（推）。
- **年齡上限必填**：每個功能群都必須有遊戲上限；查無資料時先填暫定值並標（估）。
- **遊戲上限**：遊戲強制套用的最長壽命（日）。所有個體、細胞、模組、群體皆有年齡上限。
- 溫度條件約 20–30 °C。

## 2. 衰老型態

| 代碼 | 名稱 | 規則 |
|---|---|---|
| `cell_turnover` | 細胞汰換 | 不追蹤個體年齡；細胞以汰換率死亡，平均細胞壽命 = 汰換率倒數 |
| `clonal_aging` | 克隆老化 | 族群記錄自上次有性生殖起的分裂代數；超過上限時族群崩潰，有性生殖重置代數 |
| `modular` | 模組汰換 | 單元（莖葉、水螅體、個蟲、菌絲）依模組壽命汰換；群體另有群體壽命上限 |
| `gompertz` | 個體衰老 | 死亡率隨年齡指數上升；達最長壽命全數死亡 |
| `negligible` | 可忽略衰老 | 死亡率與年齡無關的低常數；達遊戲上限全數死亡 |
| `semelparous` | 一次繁殖 | 繁殖後短期內死亡 |
| `metamorphosis_exit` | 羽化離缸 | 水中期結束後離開系統 |

**缸內繁殖**：`normal` 正常；`rare` 幼體存活率 × 0.05；`none` 不產生新世代。

## 3. 微生物、藻類、原生動物（biomass 型）

| ID | 世代／倍增時間（短／典型／長） | 衰老型態 | 遊戲上限 | 一般密度 | 最大密度 | 可信度 |
|---|---|---|---|---|---|---|
| `aob` | 5.5 h／8–11 h（實驗室）／1–3 日（缸內生物膜，估） | `cell_turnover` | 細胞 30 日（估） | 濾材 10⁷–10⁹ /g（估）；水中 10³–10⁵ /mL（估） | 濾材 10¹⁰ /g（估） | 中 |
| `nob` | 13 h／32–37 h／數日 | `cell_turnover` | 細胞 30 日（估） | 同 `aob`（估） | 同 `aob`（估） | 中 |
| `heterotroph` | 1–4 h／1–3 日／15 日 | `cell_turnover` | 細胞 30 日（估） | 0.6–2 × 10⁶ /mL | 1.4 × 10⁷ /mL | 高 |
| `denitrifier` | 4.4 h（實驗室）／1–10 日（估） | `cell_turnover` | 細胞 30 日（估） | 10⁴ /g 濕重底質 | 10⁹ /g（成熟深砂床，估） | 低–中 |
| `water_mold` | 菌絲 48 h 達最大生長；產孢 ≤ 28 日 | `modular`（菌絲） | 菌絲 60 日（估） | 孢子 6–73 /L（湖泊）；50–3,200 /L（孵化場進水） | > 5,000 /L | 中 |
| `biofilm` | 群落成長 0.03 /日（貧營養）；缸內成熟 3–6 週（估） | `cell_turnover` | 細胞 30 日（估） | 10⁶ cells/cm² | 10⁷–10⁸ cells/cm² | 中 |
| `cyanobacteria` | 13 h／1 日／3.2 日 | `cell_turnover` | 細胞 30 日（估） | 葉綠素 a 25–350 mg/m² | 815–1,422 mg/m² | 中 |
| `diatom` | 5–8 h／1 日／2.5–17 日 | `clonal_aging`（細胞逐代縮小，有性生殖恢復） | 分裂 300–1,000 代（估） | 底棲 6.5 × 10³ cells/cm²；浮游 10²–10³ /mL（估） | 底棲 4.6 × 10⁵ /cm²；浮游 4 × 10⁵ /mL | 中 |
| `green_algae` | 生物量倍增 1–4 日（估） | `modular`（絲狀體） | 絲狀體 60 日（估） | 葉綠素 a < 100–150 mg/m² | 150–200 mg/m²；> 50 g 乾重/m² | 中 |
| `phytoplankton` | 1.3–2 h／1–1.6 日／4–7 日 | `cell_turnover` | 細胞 30 日（估） | 葉綠素 a ≤ 10 µg/L；10³–10⁴ cells/mL（估） | 葉綠素 a 40 µg/L 起為藻華，> 100 µg/L 可致魚死；10⁵–10⁶ cells/mL | 中 |
| `aquatic_plant` | 生物量倍增 7–20 日（估） | `modular`（莖葉） | 莖葉 30–180 日（估） | 100–300 g 乾重/m²（估） | 522 g 乾重/m² | 中 |
| `macroalgae` | 每日成長 1.7–4.8%（Caulerpa）；5–15%（Chaetomorpha，估） | `modular`（葉狀體） | 葉狀體 30–120 日（估） | 缸內 100–1,000 g 濕重（估） | 受空間限制 | 中 |
| `zooxanthellae` | 3 日／7 日／74 日（宿主體內） | `cell_turnover` | 細胞 120 日（估） | 1–1.4 × 10⁶ cells/cm² 珊瑚組織 | 4 × 10⁶ /cm²（估）；白化時 < 正常值 0.5% | 高 |
| `ciliate` | 7.6–8.4 h／20–26 h／數日 | `clonal_aging`（約 60 代成熟；200–600 代未行有性生殖則克隆死亡） | 分裂 200–600 代 | 3–20 /mL（湖泊） | 4,000–14,000 /mL（培養） | 高 |

## 4. 小型無脊椎（cohort 型）

壽命單位：日。

| ID | 壽命 短／典型／長 | 遊戲上限 | 成熟 | 繁殖 | 成體體型 | 一般密度 | 最大密度 | 衰老型態 | 缸內繁殖 | 可信度 |
|---|---|---|---|---|---|---|---|---|---|---|
| `rotifer` | 3.4／4.4／13.5 | 14 | 0.5–1.5 | 每 4 h 一卵，一生約 10 次 | 0.1–0.3 mm（估） | 0.3–1.4 /mL | 60–211 /mL | `gompertz` | normal | 高 |
| `copepod` | 20／30–45／75 | 75 | 7–22 | 每卵囊約 70 卵，間隔 0.75–3 日 | 0.5–2 mm | 1–50 /L（估） | 40,000 /L（培養） | `gompertz` | normal | 中 |
| `ostracod` | 30／60–90／365 | 365 | 15–25（估） | 一生 0–64 卵；常孤雌生殖；卵可休眠 > 157 日 | 0.5–3 mm | 658–1,160 /m² | 9,472 /m²（淡水）；40,000 /m²（半鹹） | `gompertz` | normal | 低–中 |
| `cladoceran` | Moina 5／11／19；Daphnia 30／40–56／90 | 90 | Moina 2–4；Daphnia 6–10 | Daphnia 每胎 6–10 仔，每 3–4 日；Moina 每胎 11–16 | 1–5 mm | 20–100 /L | 7,000–10,000 /L | `gompertz` | normal | 高 |
| `amphipod` | 90／180–365／700 | 700 | 24–130 | 每胎 5–50 卵，7–8 胎 | 3–20 mm | 904 /m² | > 1,000 /m²（野外）；5,000–10,000 /m²（藻缸，估） | `gompertz` | normal | 中 |
| `isopod` | 270／365／600 | 600 | 45–90 | 每胎 20–60（估）；海水種 5–20 | 8–20 mm | 71–240 /m² | 3,759 /m² | `gompertz`；部分物種 `semelparous` | normal | 中 |
| `detritus_worm` | 180／365–730（估）／4,000 | 4,000 | 60–90（估） | 每成體 8–10 卵繭；部分物種斷裂生殖，倍增 10–20 日（估） | 20–90 mm | 1,000–10,000 /m²（估） | 10⁴–10⁵ /m² | `gompertz`；斷裂生殖物種 `negligible` | normal | 低–中 |
| `nematode` | 5／7–21／30 | 30 | 3–4 | 每日最多約 40 仔 | 0.5–2 mm | 3,000–70,000 /m² | 1.6 × 10⁶ /m² | `gompertz` | normal | 中–低 |
| `bristle_worm` | 60／120／365（估）；大型種數年（估） | 1,825（估） | 30–365 | 部分物種產卵一次後死亡；部分分裂生殖 | 5–150 mm | 1,000–3,000 /m² | 6,820–11,620 /m²（富營養底質） | `gompertz`；部分 `semelparous` | normal | 低–中 |
| `snail` | 囊螺 50／100／154；扁卷螺約 730；蜑螺 365–730（1,100）；織紋螺 730–1,100（缸內 2,200） | 2,200 | 囊螺 28–42；扁卷螺約 105 | 囊螺每卵囊 1–11 卵，連續約 20 週；尖帽螺孤雌胎生 | 7–39 mm | 13–84 /m² | 1,800 /m²（囊螺） | `gompertz` | normal；蜑螺於淡水 none | 中 |
| `shrimp` | 米蝦 365／450／730；海水清潔蝦 ≥ 1,100 | 1,500（估） | 30–75 | 米蝦每次 20–60 卵，每 21–28 日；海水蝦 200–500 卵 | 20–30 mm；0.1–0.2 g | 0.26–2.5 /L | 4–5 /L | `gompertz` | 淡水 normal；海水 rare | 中 |
| `bivalve` | 豆蜆 365–730（估）；河蜆 730–1,100 | 1,100 | 90–180 | 豆蜆體內育幼約 20；河蜆每日最多 2,000 幼貝 | 3–30 mm | 60–500 /m² | 1,000–3,520 /m² | `gompertz` | normal | 中 |
| `planarian` | 無性：無固定壽命；有性：365–1,000（估） | 3,650（估） | 分裂後約 18 日長回 | 分裂生殖；族群倍增 20–43 日 | 5–15 mm（估） | 10–100 /m² 玻璃（估） | 1,000+ /m²（估） | 無性 `negligible`；有性 `gompertz` | normal | 中 |
| `hydra` | 死亡率約 0.6%/年，與年齡無關 | 3,650（估） | 芽體 3–4 日脫離（估） | 出芽；族群倍增 3.5–14.8 日 | 5–15 mm（估） | 每缸 10–100（估） | 每缸數百至數千（估） | `negligible` | normal | 衰老高；密度低 |

## 5. 海洋固著與大型無脊椎（cohort 型）

壽命單位：年，遊戲上限單位：日。

| ID | 壽命 短／典型／長 | 遊戲上限 | 成熟 | 繁殖 | 成體體型 | 一般密度 | 最大密度（每 100 L） | 衰老型態 | 缸內繁殖 | 可信度 |
|---|---|---|---|---|---|---|---|---|---|---|
| `sea_urchin` | 1–2／5–7／> 12 | 4,500 | 6–12 月（估） | 體外受精，浮游幼體 | 5–10 cm | 每 75 L 一隻 | 1–2 | `gompertz` | none | 中 |
| `brittle_star` | 1（估）／3–5／5 | 1,825 | 約 1 年 | 抱卵每年約 100 仔；部分物種分裂生殖 | 盤徑 3–5.5 mm | — | 100–1,000（估） | `gompertz`；分裂物種 `negligible` | normal | 中；密度低 |
| `sponge` | 群體：數月／1–數年／無定限 | 群體 3,650（估） | 3–12 月（估） | 幼體、斷裂；部分物種繁殖後退化 | 片狀 cm²–dm² | 5–20 片（估） | 約 500 cm²（估） | `modular`；部分 `semelparous` | normal（斷裂） | 低 |
| `tunicate` | 單體約 1／2–3；群體個蟲 1–3 週，群體 ≤ 2 | 1,095 | 單體 1–3 月；群體 ≥ 49 日 | 單體 1,000–10,000 卵；群體每週出芽 | 單體 ≤ 15 cm；個蟲約 2 mm（估） | 2–5 單體或 1–3 群體（估） | 10 單體（估） | 單體 `gompertz`；群體 `modular`，有性生殖後 ≤ 70 日群體死亡 | 單體 rare；群體 normal（出芽） | 中 |
| `coral` | 水螅體 2–5（中位 4，最長 12）；群體數十年至數千年 | 水螅體 4,380；群體 7,300（估） | 有性 2–8 年（估）；無性出芽持續 | 出芽、斷裂 | 水螅體 1 mm–3 cm | 10–30 株（估） | 40 株；紐扣珊瑚 500+ 水螅體 | `modular` | 無性 normal；有性 none | 中 |
| `odonate_nymph` | 水中期 2–3 月／1–2／5–10 | 水中期 3,650（估） | 水中期結束即羽化 | 5–14 次蛻皮；成蟲在缸外產卵 | 豆娘 ≤ 25 mm；蜻蜓約 50 mm、0.5 g（估） | 3–6（估） | 10（估） | `metamorphosis_exit` | none | 中 |
| `predatory_insect` | 龍蝨成蟲 1–3；水蠍成蟲約 1（2–2.5）；負子蟲 ≤ 2 | 1,095 | 龍蝨需上岸化蛹；水蠍約 2 月成蟲 | 水蠍每次 20–30 卵；負子蟲雄蟲背卵 6–13 日 | 2–10 cm | 1–2（估） | 3–4（估） | `gompertz` | 龍蝨 none；水蠍、負子蟲 normal | 低–中 |
| `crayfish` | 美國螯蝦 1–1.5／2–5／6；侏儒螯蝦 1.5–2／2–3；紅螯螯蝦 3／4.5／5+ | 2,190 | 3–12 月 | 美國螯蝦 100–500 卵；侏儒螯蝦 20–50 卵；紅螯螯蝦每窩 300–800 卵，每季 3–5 窩 | 3–35 cm | 侏儒一對/30 L；美國螯蝦 1 隻/100 L；紅螯螯蝦 1 隻/200 L | 侏儒約 10；大型種 1–2 | `gompertz` | normal | 中 |
| `mantis_shrimp` | 3／4–7／8 | 2,920 | 約 1 年（估） | 抱卵 ≤ 50,000；幼體浮游約 3 月 | ≤ 9 cm | 每缸 1 | 1 | `gompertz`；終生成長 | none | 低–中 |

## 6. 魚類（cohort 型）

壽命單位：年，遊戲上限單位：日。

| ID | 壽命範圍（代表物種） | 遊戲上限 | 成熟 | 繁殖 | 成體體型 | 一般密度（每 100 L） | 最大（每 100 L） | 衰老型態 | 缸內繁殖 | 可信度 |
|---|---|---|---|---|---|---|---|---|---|---|
| `planktivore_fish` | 一年生鱂魚 0.2–0.6；孔雀魚 1–2；日光燈 2–3；三角燈 5–8；雀鯛 8–15 | 5,475 | 鱂魚 2–5 週；孔雀魚 7–20 週；三角燈 9–12 月 | 孔雀魚每 28 日 20–40 仔；三角燈 100–200 卵 | 2–10 cm；乾重 20–2,500 mg（推） | 6–12（估） | 20–30（≤ 3 cm） | `gompertz`；一年生種快速衰老 | normal；海水種 none | 中 |
| `grazer_fish` | 耳斑鯰 3–5（6+）；大鬍子異型 4–5（8–12）；鳚 2–6 | 4,380 | 耳斑鯰體長 19–20 mm；鳚約 18 月；異型 9–12 月（估） | 耳斑鯰約 84 卵；異型 30–120 卵 | 2.4–15 cm | 耳斑鯰 6；異型、鳚 1 | 耳斑鯰 10；其他 1 | `gompertz` | 淡水 normal；海水 none | 中 |
| `benthic_omnivore_fish` | 鼠魚 5–10；庫勒鰍約 10（14）；吻鰕虎 2–5（估） | 5,475 | 6–18 月 | 鼠魚每次約 100 卵；吻鰕虎每 4 週 46–62 卵 | 4.7–10 cm | 6–8（估） | 12（估） | `gompertz` | normal | 中 |
| `piscivore_fish` | 斑馬短鰭蓑鮋 5–8；小型梭口魚 5–8 | 3,650 | 約 1 年（估） | 梭口魚雙親護卵（估）；蓑鮋浮游卵 | 7.6–20 cm | 每 154 L 一隻；缸長 90 cm | 1 | `gompertz` | 淡水 normal；海水 none | 中 |

## 7. 容量換算與飼養空間

**密度換算**

- 每 L 密度 × `waterVolumeL`。
- 每 m² 密度 × `waterFloorArea`（水域底棲、底材內）、`landArea`（陸域）或 `surfaceArea`（附著）。
- 每 cm² 密度 × 對應面積。
- 每 100 L 數量 × `waterVolumeL / 100`，至少 1。
- 「每最小飼養空間 N 隻」：`K = N × floor(可用量 / 最小量)`；可用量取水量（W）、陸域面積（T）或兩者比值較小者（A）。
- 最大密度換算值 = 族群容量 `K`；一般密度換算值 = 平衡驗收目標區間（[06](06-gameplay.md) §6）。

**最小飼養空間**

- 欄位：缸長、水量、陸域面積、缸高（樹棲），未列者不限制。
- 缸不符任一欄位 → 該功能群湧現 `suitability = 0`，玩家投放被拒並顯示原因。
- `size` 等位基因換算體長 `Lₐ`；所需缸長 = 最小缸長 × `Lₐ / 功能群典型體長`；超出時該等位基因權重為 0。
- 蛇類：缸長 ≥ 蛇體長。
- `巨大化` 突變後超出時，突變族群不成立。

## 8. 陸域生物

壽命單位：日（另註者除外）。

| ID | 壽命 短／典型／長 | 遊戲上限 | 成熟 | 繁殖 | 成體體型 | 一般密度 | 最大密度 | 衰老型態 | 缸內繁殖 | 可信度 |
|---|---|---|---|---|---|---|---|---|---|---|
| `moss_liverwort` | 芽體 250／700／1,060 | 芽體 1,095 | — | 斷片營養繁殖 | 年生長 10–50 mm（估） | 覆蓋 10–60%（估） | 覆蓋 100% | `modular` | normal | 低 |
| `terrestrial_plant` | 葉 120／365／540（估） | 葉 540（估） | — | 扦插、分株；每芽 7–14 日一葉（估） | — | — | 受陸域面積限制 | `modular` | normal | 中 |
| `bromeliad_epiphyte` | 蓮座 1,100–1,460 | 蓮座 1,460 | 2–3 年（估） | 開花一次後產 2–6 子株 | — | — | — | `semelparous`（蓮座） | normal | 中 |
| `saprotrophic_fungus` | 子實體 1／2／5（估）；菌絲汰換 130–150 | 菌絲 180（估） | 7–21（估） | 孢子；菌絲 0.2–10.8 mm/日 | — | — | 新造景白黴 2–6 週（估） | `modular` | normal | 中 |
| `soil_bacteria` | 倍增 1.6–64 日 | 細胞 60（估） | — | 分裂 | — | 10⁸–10⁹ /g 土 | 5 × 10⁹ /g | `cell_turnover` | normal | 中 |
| `soil_nematode` | 7／14／30（估） | 30（估） | 3–4（估） | 50–300 卵（估） | 0.5–2 mm | 10⁶ /m²（估） | 10⁷ /m²（估） | `gompertz` | normal | 低 |
| `springtail` | 17／42–115／571 | 571 | 約 14 | 平均 39 卵（1–178），約每 6.7 日；部分孤雌 | 1–2 mm | 10⁴–4.4 × 10⁴ /m² | 10⁵–10⁶ /m²（估） | `gompertz` | normal | 高 |
| `terrestrial_isopod` | 180／365–730／1,250 | 1,250 | 60–450 | 每胎 2–200，每年 1–3 胎；小型種孤雌 | 2–18 mm | 160–3,000 /m² | 3,000–10⁴ /m² | `gompertz` | normal | 中 |
| `millipede` | 365／730／1,800 | 1,800 | 150–210 | 每次 40–150 卵 | 約 20 mm | 10–100 /m²（估） | 10³ /m²（估） | `gompertz` | normal | 低 |
| `potworm` | 60／150／254 | 254 | 世代 14–39 | 卵繭 5–20 卵 | 10–30 mm | 3,400–22,000 /m² | 36,000 /m² | `gompertz` | normal | 中 |
| `earthworm` | 365／730／1,800（估） | 1,800（估） | 40–60 | 每週 2.4–3 卵繭 × 2.4–2.7 仔 | 0.3–0.6 g | 20–100 /m² | 610–733 /m² | `gompertz` | normal | 中 |
| `land_snail_slug` | 螺 250／365／700（估）；蛞蝓 85–216 | 700（估） | 螺 50–60；蛞蝓 3–12 月 | 螺每月約 20 卵，自體受精 | 50–200+ mg | 10 /m²（估） | 100 /m²（估） | `gompertz` | normal | 中 |
| `detritivore_mite` | 成體 60／180／700（估） | 700（估） | 9–14 | 最多 528 卵 | 0.3–0.5 mm | 32,985–117,352 /m² | 4 × 10⁵ /m² | `gompertz` | normal | 中 |
| `predatory_mite` | 成體 21／30／42 | 60（估） | 9.7–21 | 最多 60 卵 | 0.5–1 mm | 54–323 /m² | 10³ /m²（估） | `gompertz` | normal | 中 |
| `fungus_gnat` | 成蟲 4／7／10 | 35（估） | 卵至成蟲 19–22 | 40–130 卵 | 2–4 mm | 0–10 /m²（估） | 10³ /m²（估） | `gompertz` | normal | 高 |
| `fruit_fly` | 20／30／60（估） | 75（估） | 7–19 | 每日 40–100 卵 | 2–3 mm | 短暫 | — | `gompertz` | normal | 中 |
| `cricket` | 成蟲 30／45／90（估） | 290（估） | 66–200 | 最多 1,360 卵 | 約 20 mm、0.4 g | 少見自立族群 | — | `gompertz` | rare | 中 |
| `rove_beetle` | 成蟲 30／48／60 | 80（估） | 約 17 | 約 90 卵 | 3–4 mm | 1–10 /m²（估） | 100 /m²（估） | `gompertz` | normal | 高 |
| `darkling_beetle` | 90／180／365（估） | 485（估） | 60–120（估） | 100–500 卵（估） | 6–25 mm | 少見 | — | `gompertz` | normal | 低 |
| `spider` | 成體 223／400／774 | 1,140（估） | 6–12 月（估） | 2–8 卵囊 × 20–50 卵 | 7–10 mm | 每缸 0–2（估） | — | `gompertz` | normal | 中 |
| `centipede` | 1,100／1,800／2,500 | 2,500 | 約 730 | 每年約 25 卵 | 20–30 mm | 10–100 /m²（估） | — | `gompertz` | normal | 中 |
| `pseudoscorpion` | 365（估）／730（估）–1,095／1,460 | 1,460 | 10–24 月 | 每胎 20–40 | 2.5–4.5 mm | 10–100 /m²（估） | 500 /m²（估） | `gompertz` | normal | 低 |
| `ant` | 工蟻 60–365（估） | 工蟻 365；群體 3,650（估） | — | 依蟻后 | 1–5 mm | 0（入侵者） | 一個群體 | 工蟻 `gompertz`；群體 `modular` | normal | 低 |

## 9. 兩棲、爬蟲與半陸生動物

壽命單位：年；遊戲上限單位：日。

| ID | 壽命 短／典型／長 | 遊戲上限 | 成熟 | 繁殖 | 成體體型 | 最小飼養空間 | 一般密度 | 最大密度 | 缸內繁殖 | 可信度 |
|---|---|---|---|---|---|---|---|---|---|---|
| `dart_frog_small` | 4／10／20+ | 7,300 | 12–18 月（估） | 陸上產卵 2–30，每 2–4 週；蝌蚪 60–84 日 | 2–5 cm、1–8 g | 38 L；水域 10–20% | 每 38 L 1–2 | 每 38 L 4 | normal | 中 |
| `tree_frog` | 3／5／10（估） | 3,650（估） | 1–2 年 | 每窩 11–78 卵，每季數窩；蝌蚪 1–3 月 | 4–7 cm、6–15 g | 126 L；缸高 ≥ 61 cm | 每 126 L 2–4 | 每 126 L 4 | normal | 中 |
| `semi_aquatic_toad` | 7／12／20+（長估） | 7,300（估） | 1–2 年（估） | 40–110 卵；蝌蚪 6–10 週 | 4–5 cm、約 10 g | 75 L；水陸各半 | 每 75 L 3–4 | 每 75 L 6 | normal | 低 |
| `aquatic_frog_dwarf` | 5／7／12 | 4,380 | 約 1 年（估） | 水面散卵，2–3 日孵化；成體吃卵 | 3–7.5 cm、2–5 g | 19 L | 每 38 L 2–3 | 每 38 L 5（估） | rare | 中 |
| `aquatic_frog_clawed` | 15／20／30（估） | 10,950（估） | 8–12 月 | 數百至數千卵；蝌蚪約 8 週 | 6–13 cm、60–200 g | 75 L／2 隻 | 每 75 L 2 | 每 75 L 4 | normal | 中 |
| `large_frog_ambush` | 5／8／15 | 5,475 | 約 1 年 | 1,000+ 卵；肉食蝌蚪 3–4 週 | ≤ 12.5 cm、200–500 g | 40 L | 每 40 L 1 | 每 40 L 1 | rare | 中 |
| `large_frog_aquatic` | 7／9／16 | 5,840 | 2–5 年（估） | 6,000–20,000 卵，每季 ≤ 3 窩；蝌蚪 4 月–3 年 | 9–20 cm、0.45–1 kg | 水量 400 L | 每 400 L 1 | 每 400 L 1 | rare | 中 |
| `newt` | 10／12–15／30 | 10,950 | 1–3 年（估） | 每季 10–236 卵；幼體 2–3 月 | 6–10 cm、3–6 g | 75 L；水域 70% | 每 75 L 2–6 | 每 75 L 6 | normal | 中 |
| `axolotl` | 10／12–15／20+ | 7,300 | 12–18 月（估） | 100–1,000 卵 | 15–30 cm、60–200 g | 90 L；缸長 80 cm | 每 90 L 1 | 每 90 L 1 | normal | 中 |
| `small_arboreal_lizard` | 3／5–7／10（守宮 ≤ 20） | 7,300（估） | 8–12 月（估） | 每 1–3 週 1–2 卵（估） | 12–30 cm、3–70 g | 230 L；缸高 ≥ 61 cm | 1 雄 + 雌 | 每 230 L 3（估） | normal | 中 |
| `semi_aquatic_lizard` | 8／10–15／20 | 7,300 | 18–24 月 | 每窩 6–17 卵，每季 4–5 窩；孵化 8–10 週 | 60–90 cm、0.2–1 kg | 1,360 L；缸長 183 cm | 1 雄 | 每 3,000 L 3（估） | normal | 中 |
| `water_monitor` | 8／15／20+ | 9,125 | 約 2 年 | 每年 5–30 卵（估） | 1–3 m、5–25 kg | 7,000 L；缸長 305 cm | 1 | 1 | rare | 低–中 |
| `garter_water_snake` | 3／8／15 | 5,475 | 2–3 年（估） | 胎生 4–40（最多 100），每年 | 45–150 cm、50–600 g | 缸長 ≥ 蛇長；122 cm | 束帶蛇群養；水蛇 1 | 每 122 cm 缸長 3（估） | normal | 中 |
| `small_python` | 20／25／30 | 10,950 | 2–3 年（估） | 4–15 卵，每年 | 75–150 cm、0.3–0.6 kg | 缸長 ≥ 蛇長 | 1 | 1 | normal | 中 |
| `musk_turtle` | 20／30–50／54+ | 19,710 | 雄 3–6 年；雌 4–11 年 | 1–9 卵，每年 1–4 窩；孵化 65–86 日 | 背甲 8–13 cm、150–300 g | 115 L；缸長 100 cm | 1 | 1 | normal | 高 |
| `slider_turtle` | 20／30／40+ | 14,600 | 雄 2–5 年；雌 5–8 年 | 每窩 4–23 卵，每季 2–3 窩 | 背甲 13–30 cm、0.5–2.5 kg | 每 2.5 cm 背甲 38 L（估） | 1–3 | 3 | normal | 中 |
| `softshell_turtle` | 25／30／50（估） | 18,250（估） | 雄約 4 年；雌 8–9 年 | 每窩 3–39 卵，每季 ≤ 3 窩 | 背甲 13–48 cm、≤ 11 kg | 285–2,270 L | 1 | 1 | rare | 中 |
| `vampire_crab` | 1.5／2–3／3+ | 1,280 | 約 6 月 | 抱卵 20–80，約 1 月；直接發育 | 甲寬 2–3.8 cm | 30 L；陸域 70% | 每 30 L 4–6 | 每 30 L 8（估） | normal | 高 |
| `mangrove_crab` | 2／2–3／4（估） | 1,460（估） | 約 1 年（估） | 浮游幼體 | 甲寬 ≤ 5 cm | 38 L；陸域 50–60% | 每 38 L 1 雄 2 雌 | 每 38 L 1 雄 3 雌 | none | 中 |
| `fiddler_crab` | 2／2–3／10（存疑） | 1,825（估） | 約 1 年（估） | 浮游幼體 | 寬約 5 cm | 38 L；陸域 70–80%、深砂 | 每 38 L 3–4 | 每 38 L 5（估） | none | 中 |
| `mudskipper` | 2／5／8 | 2,920 | 體長 10–11 cm | 洞穴產卵 | 10–20 cm、20–80 g | 缸長 120 cm；110 L | 每 110 L 1 | 每 110 L 1 | none | 中 |

衰老型態：全部 `gompertz`。

## 10. 大型水生動物

壽命單位：年；遊戲上限單位：日。

| ID | 壽命 短／典型／長 | 遊戲上限 | 成熟 | 繁殖 | 成體體型 | 最小飼養空間 | 每缸 | 缸內繁殖 | 可信度 |
|---|---|---|---|---|---|---|---|---|---|
| `arowana` | 10／15／20 | 7,300 | 3–4 年（估） | 雄魚口孵 12–30 仔 | 60–120 cm、3–6 kg | 缸長 240 cm；950 L | 1 | none | 中 |
| `gar` | 10／18／22 | 8,030 | 雄 3–4 年；雌 6 年 | 黏性卵數千 | 55–132 cm、1–4.5 kg | 缸長 150 cm；680 L | 1–3 | none | 中 |
| `bichir` | 10／15／20 | 7,300 | 3–4 年（估） | 數百卵（估） | 40–75 cm、1–3.4 kg | 缸長 210 cm；2,300 L | 1–3 | rare | 中 |
| `snakehead` | 10／15／20（估） | 7,300（估） | 2–3 年（估） | 浮巢數千卵，雙親護巢 | 90–130 cm、≤ 20 kg | 缸長 300 cm；2,000 L | 1 | rare | 中 |
| `cichlid_pursuit_predator` | 8／10／15（估） | 5,475（估） | 1–2 年（估） | 4,500–10,000 卵（上限估） | 30–99 cm、≤ 6.8 kg | 380 L（小型）至 3,400 L；缸長 305 cm | 1 或 1 對 | rare | 中 |
| `oscar` | 10／12／20 | 7,300 | 1–1.5 年（估） | 每 4–6 週 1,000–2,000 卵 | 25–45 cm、≤ 1.6 kg | 缸長 120 cm；285 L | 1–2 | normal | 高 |
| `pacu` | 15／40／65 | 23,725 | 2–2.5 年 | 每年約百萬卵 | 70–108 cm、≤ 40 kg | 缸長 300 cm；2,300 L | 1 | none | 中 |
| `silver_dollar` | 5／10／15 | 5,475 | 約 1 年（估） | 散卵 1,000–2,000；親魚食卵 | 14–18 cm、0.1–0.2 kg | 缸長 150 cm；285 L | ≥ 5（每 285 L 最多 8，估） | rare | 中 |
| `koi` | 25／35／50+ | 21,900（估） | 2–3 年 | 每公斤體重每年 89,000–185,000 卵 | 45–90 cm、2–10 kg | 每尾 750 L | 3 | normal | 中 |
| `goldfish` | 10／15／43 | 15,695 | 1–2 年（估） | 每次數千卵 | 20–40 cm、0.3–1 kg | 每尾 800 L | ≥ 2 | normal | 中 |
| `large_pleco` | 10／15／20（估） | 7,300（估） | 2–3 年（估） | 挖洞產卵 500–3,000（估） | 35–61 cm、0.3–1 kg | 缸長 150 cm；285 L | 1 | none | 中 |
| `giant_catfish` | 15／20／30（估） | 10,950（估） | 3–5 年（估） | 洄游產卵 | 0.9–1.8 m、≤ 44.2 kg | 缸長 240 cm；3,800 L | 1 | none | 中 |
| `freshwater_stingray` | 10／15／20+ | 7,300 | 3–4 年（估） | 胎生 3–21 仔，妊娠約 3 月，每年 1–2 胎 | 盤寬 35–45 cm、≤ 1 m、5–15 kg | 缸長 180 cm；750 L | 1–2（每 1,800 L 5，依水量折算） | normal | 中 |
| `fire_eel` | 10／12／15 | 5,475 | 2–3 年（估） | — | 50–100 cm、約 1 kg | 缸長 120 cm；400 L | 1 | rare | 中 |
| `scat` | 8／12／20（估） | 7,300（估） | 約 1 年（估） | 浮游卵 | 15–45 cm、0.3–1 kg | 缸長 150 cm；600 L（估） | ≥ 3（每 600 L 5，估） | none | 中 |
| `grouper` | 9／15／37 | 13,505 | 2–3 年（估）；先雌後雄 | 撒卵 | 50–70 cm、2–3.5 kg | 缸長 240 cm（估）；680 L | 1 | none | 中 |
| `lionfish` | 5／10／15+ | 5,475 | < 1 年 | 每 2–4.1 日 1,800–41,945 卵 | 30–47 cm、0.5–1.2 kg | 缸長 150 cm（估）；450 L | 1 | none | 高 |
| `tang` | 5／15／40（野外） | 14,600 | 約 1 年（估） | 浮游產卵 | 18–45 cm、0.1–2 kg | 缸長 180 cm；380 L | 每屬 1 | none | 中 |
| `triggerfish` | 8／12／20 | 7,300 | 1–2 年（估） | 護巢沉性卵 | 25–50 cm、1–2 kg | 底面 120 × 120 cm；900 L | 1 | none | 中 |
| `moray` | 10／20／30 | 10,950 | 2–4 年（估） | 柳葉狀幼體 | 50 cm–2 m+ | 缸長 120 cm；190 L（小型）至 1,900 L | 1 | none | 中 |
| `benthic_shark` | 15／20／25 | 9,125 | 4–7 年（估） | 每年 115–152 卵，20–50% 可孵，孵化 120–140 日 | 70–132 cm、2–4 kg | 缸長 240 cm（估）；680 L | 1–2 | normal | 中 |
| `marine_stingray` | 10／15／20（估） | 7,300（估） | 3–4 年（估） | 胎生 ≤ 7（估） | 全長約 70 cm、1–5 kg | 缸長 240 cm；950 L | 1 | rare | 低 |
| `spiny_lobster` | 10／20／50（估） | 18,250（估） | 2–5 年（估） | 每窩 10–70 萬卵；浮游幼體 6–12 月 | 25–45 cm、0.5–7 kg | 缸長 120 cm；285 L | 1 | none | 低 |
| `octopus` | 1／1.2／2 | 730 | 8–12 月（估） | 100–800 大卵，護卵 2–5.5 月 | 腕展約 60 cm、0.4–0.8 kg | 缸長 120 cm；190 L | 1 | rare | 中 |
| `cuttlefish` | 1／1.5／2 | 730 | 約 9 月 | 144–225 卵（飼養） | 外套膜 15–45 cm、1–4 kg | 缸長 200 cm（估）；500 L | 1–3 | normal | 中 |
| `sea_star` | 5／10／?（估） | 5,475（估） | 約 2 年（估） | 撒卵 | 直徑 25–38 cm、0.3–0.5 kg | 285 L | 1–3 | none | 低 |

衰老型態：`octopus`、`cuttlefish` 為 `semelparous`，其餘 `gompertz`。

## 11. 參考來源：陸域、兩棲爬蟲、大型水生

- **陸域**：[Collembola 壽命 PMC2527682](https://pmc.ncbi.nlm.nih.gov/articles/PMC2527682/)、[Frontiers 2023](https://doi.org/10.3389/fevo.2023.1112045)、[collembola.org](https://collembola.org/publicat/egg.htm)、[scaber.org](https://scaber.org/porcellio-sub/woodlice/lcycle/)、[UF IFAS](https://edis.ifas.ufl.edu/pdf/IN/IN109900.pdf)、[Trichorhina](https://en.wikipedia.org/wiki/Trichorhina_tomentosa)、[BugGuide](https://www.bugguide.net/node/view/26414)、[NIES](https://web.nies.go.jp/chiiki1/protoz/refere/id5999/5901.htm)、[Aarhus](https://pure.au.dk/ws/files/335048566/1_s2.0_S003140562305014X_main.pdf)、[Soil Organisms](https://soil-organisms.org/index.php/SO/article/view/375)、[BioStor](https://archive.org/download/biostor-192539/biostor-192539.pdf)、[Florida Entomologist](https://journals.flvc.org/flaent/article/view/88264)、[OSU Slug Portal](https://agsci.oregonstate.edu/slug-portal/life-slug/biology-and-life-cycle-gray-field-slug)、[PMC3349857](https://pmc.ncbi.nlm.nih.gov/articles/PMC3349857/)、[Green Methods](https://greenmethods.com/?p=100)、[KoreaScience](https://koreascience.kr/article/JAKO199811920246943.pub)、[PMC6550394](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6550394/)、[DIS](https://www.ou.edu/journals/dis/DIS40/Gregg%2085.pdf)、[EANSO](https://journals.eanso.org/index.php/eajab/article/view/834)、[KSU](https://bookstore.ksre.ksu.edu/pubs/MF3614.pdf)、[Espace pour la vie](https://espacepourlavie.ca/en/insects-arthropods/long-bodied-cellar-spider)、[Lithobius](https://en.wikipedia.org/wiki/Lithobius_forficatus)、[Chelifer](https://en.wikipedia.org/wiki/Chelifer_cancroides)、[The Bio Dude](https://www.thebiodude.com/blogs/how-to-deal-with-vivarium-pests/help-there-are-ants-in-my-bioactive-enclosure)、[UF Pothos](https://edis.ifas.ufl.edu/publication/EP151)、[Neoregelia](https://en.wikipedia.org/wiki/Neoregelia)、[CU Boulder](https://vivo.colorado.edu/display/pubid_327935)
- **兩棲爬蟲**：[Blue poison dart frog](https://en.wikipedia.org/wiki/Blue_poison_dart_frog)、[Josh's Frogs](https://joshsfrogs.com/care-sheet/dendrobates-tinctorius-azureus)、[Red-eyed tree frog](https://training.joshsfrogs.com/care-sheet/red-eye-tree-frog-captive-bred-agalychnis-callidryas)、[Rutgers Xenopus SOP](https://research.rutgers.edu/system/files/2025-09/aquatics-sop-5-08-zenopus-husbandry.pdf)、[NC Wildlife 牛蛙](https://ncwildlife.gov/education/american-bullfrog-species-profile/open)、[Caudata axolotl](https://caudata.org/cc/species/Ambystoma/A_mexicanum.shtml)、[ReptiFiles anole](https://reptifiles.com/green-anole-care/)、[Lafeber 水龍](https://lafeber.com/vet/basic-information-for-chinese-or-green-water-dragons/)、[Herpetological Journal 水巨蜥](https://www.thebhs.org/publications/the-herpetological-journal/volume-5-number-1-january-1995/1388-03-sexual-maturation-in-varanus-salvator-laurenti-1768-with-notes-on-growth-and-reproductive-effort)、[ReptiFiles garter](https://reptifiles.com/garter-snake-care/)、[Children's python](https://en.wikipedia.org/wiki/Children%27s_python)、[COSEWIC 麝香龜](https://www.canada.ca/en/environment-climate-change/services/species-risk-public-registry/cosewic-assessments-status-reports/stinkpot/chapter-6.html)、[Lafeber 滑龜](https://lafeber.com/vet/basic-information-red-eared-slider/)、[MDC 鱉](https://mdc.mo.gov/discover-nature/field-guide/northern-spiny-softshell)、[Geosesarma](https://en.wikipedia.org/wiki/Geosesarma_dennerle)、[Perisesarma](https://en.wikipedia.org/wiki/Perisesarma_bidens)、[PFK 招潮蟹](https://www.practicalfishkeeping.co.uk/features/fiddler-crabs/)、[彈塗魚](https://thetropicaltank.co.uk/Fishindx/african-mudskipper.htm)
- **大型水生**：[Silver arowana](https://en.wikipedia.org/wiki/Silver_arowana)、[Lepisosteus](https://en.wikipedia.org/wiki/Lepisosteus)、[Seriously Fish Polypterus](https://www.seriouslyfish.com/species/polypterus-endlicheri-endlicheri)、[Channa micropeltes](https://seriouslyfish.com/species/channa-micropeltes)、[Cichla](https://seriouslyfish.com/species/cichla-ocellaris)、[FishBase oscar](https://www.fishbase.se/summary/SpeciesSummary.php?id=3612)、[Tambaqui](https://en.wikipedia.org/wiki/Tambaqui)、[Silver dollar](https://en.wikipedia.org/wiki/Silver_dollar_(fish))、[Pond Trade 錦鯉](https://www.pondtrademag.com/ponds-by-the-numbers-rules-for-a-lawless-industry/)、[Guinness 金魚](https://www.guinnessworldrecords.com/world-records/70745-oldest-goldfish-ever)、[Redtail catfish](https://seriouslyfish.com/species/phractocephalus-hemioliopterus)、[PFK 淡水魟](https://www.practicalfishkeeping.co.uk/features/definitive-guide-to-south-american-freshwater-rays/)、[Fire eel](https://seriouslyfish.com/species/mastacembelus-erythrotaenia)、[FishBase scat](https://fishbase.se/summary/4698)、[Panther grouper](https://Animal-World.com/panther-grouper)、[Frontiers 獅子魚](https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2015.00007/pdf)、[Biota 倒吊](https://reefs.com/fish/biota-captive-bred-yellow-tang/)、[FishBase 炮彈魚](https://fishbase.se/summary/2300)、[Snowflake eel](https://www.liveaquaria.com/products/snowflake-eel)、[FRDC 竹鯊](https://fish.gov.au/docs/SharkReport/2023_FRDC_Chiloscyllium_punctatum_final.pdf)、[Ribbontail ray](https://en.microcosmaquariumexplorer.com/wiki/Bluespotted_Ribbontail_Ray)、[Spiny lobster](https://www.dohenystatebeach.org/wp-content/uploads/2013/05/The-Great-Spiny-One.pdf)、[Redclaw](https://thefishsite.com/articles/cultured-aquatic-species-red-claw-crayfish)、[TONMO 章魚](https://tonmo.com/articles/comments/28/)、[Sci. Mar. 烏賊](https://scimar.icm.csic.es/index.php/secId/6/IdArt/3089/)、[海星](https://www.liveaquaria.com/products/chocolate-chip-sea-star)

## 12. 參考來源：水域功能群

- **aob／nob**：[Springer](https://link.springer.com/doi/10.1007/BF00408008)、[PMC238513](https://pmc.ncbi.nlm.nih.gov/articles/PMC238513)、[US6207440](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6207440)、[PMC4257543](https://pmc.ncbi.nlm.nih.gov/articles/PMC4257543)、[bioRxiv](https://www.biorxiv.org/content/10.1101/2021.11.24.468873.full.pdf)、[PMC4277589](https://pmc.ncbi.nlm.nih.gov/articles/PMC4277589/table/T1)、[PubMed 18093145](https://pubmed.ncbi.nlm.nih.gov/18093145)
- **heterotroph**：[Rekayasa](https://journal.trunojoyo.ac.id/rekayasa/article/view/16844)、[Ifremer](https://archimer.ifremer.fr/doc/00000/1553/1186.pdf)、[Michigan Tech](https://digitalcommons.mtu.edu/michigantech-p/7549)、[Hydrobiologia](https://link.springer.com/article/10.1007/s10750-007-0585-x)
- **denitrifier**：[PMC3907716](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3907716/)、[Springer](https://link.springer.com/article/10.1007/BF02759473)
- **water_mold**：[AGRIS](https://agris.fao.org/search/en/records/65df91a00f3e94b9e5d9f115)、[Springer](https://doi.org/10.1007/BF00031875)、[Wikipedia](https://en.wikipedia.org/wiki/Saprolegnia)
- **biofilm**：[DTU](https://orbit.dtu.dk/en/publications/dynamics-of-biofilm-formation-in-a-model-drinking-water-distribut/)、[PMC2168204](https://pmc.ncbi.nlm.nih.gov/articles/PMC2168204/table/t2)
- **cyanobacteria**：[Springer](https://link.springer.com/article/10.1007/BF00408860)、[CCMP 2024](https://ccmp2024.chesapeake.org/wp-content/uploads/2024/04/Session-20-Abstracts.pdf)、[AME](https://int-res.com/abstracts/ame/v32/n2/p175-184)
- **diatom**：[Hydrobiologia](https://link.springer.com/doi/10.1007/s10750-008-9513-y)、[Philippine J. Sci.](https://philjournalsci.dost.gov.ph/community-structure-of-periphytic-diatoms-in-early-stage-marine-biofilms-in-a-mariculture-impacted-area)、[J. Plankton Res.](https://academic.oup.com/plankt/article-abstract/21/6/1101/1479176)
- **green_algae**：[Great Lakes Center](https://greatlakescenter.buffalostate.edu/sites/glc/files/documents/FinalReport-LakeOntarioCladophora2019.pdf)、[PMC12729994](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12729994/)
- **phytoplankton**：[PLOS One](https://pmc.ncbi.nlm.nih.gov/articles/PMC3974682/table/pone-0092460-t001)、[SCCF](https://recon.sccf.org/parameters/chlorophyll)、[LSU](https://repository.lsu.edu/enviro_sciences_pubs/275)、[AUB](https://scholarworks.aub.edu.lb/items/d253a8f1-b5f5-4721-b903-fd84c79e644c)
- **aquatic_plant**：[Planta Daninha](https://scielo.br/j/pd/a/yh6kHDxDcm6VkjJwY9hgfDP/abstract/?lang=en)、[Western Sydney](https://researchers.westernsydney.edu.au/en/publications/biomass-distribution-growth-and-decay-of-egeria-densa-in-a-tropic/)、[bioRxiv](https://www.biorxiv.org/content/10.1101/2023.11.07.566010.full.pdf)
- **macroalgae**：[INVEMAR](https://boletin.invemar.org.co/ojs/index.php/boletin/article/download/36/35/141)、[Hidrobiológica](https://hidrobiologica.izt.uam.mx/index.php/revHidro/article/view/504)
- **zooxanthellae**：[BioNumbers 114525](https://bionumbers.hms.harvard.edu/bionumber.aspx?id=114525)、[BioNumbers 114526](https://bionumbers.hms.harvard.edu/bionumber.aspx?id=114526)、[SCU](https://researchportal.scu.edu.au/esploro/outputs/journalArticle/Quantification-of-algal-endosymbionts-Symbiodinium-in/991012820746302368)
- **ciliate**：[NIES](https://www.nies.go.jp/chiiki1/protoz/toxicity/protozoa/parameci.htm)、[Zoociências](https://periodicos.ufjf.br/index.php/zoociencias/article/view/24632)、[Jpn. J. Protozool.](https://www.protistology.jp/journal/jjp41/12TakagiE.pdf)、[BioNumbers 114555](https://bionumbers.hms.harvard.edu/bionumber.aspx?id=114555)
- **rotifer**：[FAO](https://www.fao.org/4/w3732e/w3732e0f.htm)、[PMC12292424](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12292424/)、[PAN](https://journals.pan.pl/Content/93026)、[Redalyc](https://www.redalyc.org/pdf/5156/515651977004.pdf)
- **copepod**：[UTAS](https://figshare.utas.edu.au/articles/thesis/The_culture_of_copepods_as_live_food_for_marine_fish_larvae/23247782)、[ZSI](https://zsi.gov.in/PDFVolumes/bulletin/004/01/0047-0056.pdf)、[Springer](https://link.springer.com/article/10.1007/BF00229968)、[MEPS](https://int-res.com/abstracts/meps/v118/p121-128)
- **ostracod**：[PAN](https://www.czasopisma.pan.pl//Content/110563/PDF/PPR29-033.pdf)、[Springer](https://link.springer.com/article/10.1007/BF00116482)、[GBA](https://opac.geologie.ac.at/ais312/dokumente/Geo11_74_Szlauer_Ostracod%20assemblages.pdf)
- **cladoceran**：[ADW](https://animaldiversity.org/accounts/Daphnia_magna)、[ANGFA](https://rainbowfish.angfa.org.au/foods_and_feeding/daphnia.html)、[BUU](https://scijournal.buu.ac.th/index.php/sci/article/view/2893)、[FAO](https://www.fao.org/4/W3732E/w3732e0x.htm)
- **amphipod**：[USGS](https://www.usgs.gov/publications/postembryonic-growth-and-development-hyalella-azteca-laboratory-cultures-and)、[Oceanol. Hydrobiol. Stud.](https://reference-global.com/article/10.26881/oahs-2022.3.03)、[Janelia](https://research.janelia.org/pavlopoulos/pdf/browne2005.pdf)
- **isopod**：[Unife](https://sfera.unife.it/retrieve/e309ade0-b59d-3969-e053-3a05fe0a2c94/Vitagliano%20et%20al%201991.pdf)、[Figshare](https://figshare.com/articles/Ecology_and_bioenergetics_of_two_species_of_Asellus_in_Rutland_Water_/10191515)、[NHM](https://isopods.nhm.org/pdfs/2246/2246.pdf)
- **detritus_worm**：[Naturalis](https://fw-oligochaeta.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?id=94578)、[SeaLifeBase](https://sealifebase.se/summary/Tubifex-tubifex)
- **nematode**：[WPI](https://www.wpi.edu/news/bkworm)、[Biodiversitas](https://smujo.id/biodiv/article/view/18152)、[MDPI Water](https://www.mdpi.com/2073-4441/16/14/1959)、[ScienceAsia](https://scienceasia.org/1997.23.n4/347.php)
- **bristle_worm**：[IJM](https://www.ijm.fr/balavoine-lab-fast-cycling-culture-of-the-annelid-model-platynereis-dumerilii/)、[Annelida.net](https://www.annelida.net/nz/Polychaeta/Family/Capitellidae/capitella-capitata.html)、[SeaLifeBase](https://sealifebase.ca/summary/38154)
- **snail**：[Ekológia](https://reference-global.com/article/10.1515/eko-2017-0006)、[SEDICI](https://sedici.unlp.edu.ar/handle/10915/176866)、[Acta Sci.](https://periodicos.uem.br/ojs/index.php/ActaSciBiolSci/article/view/45720)、[Wikipedia](https://en.wikipedia.org/wiki/Planorbella)、[Top Shelf Aquatics](https://topshelfaquatics.com/products/nassarius-snails)
- **shrimp**：[Wikipedia](https://en.wikipedia.org/wiki/Neocaridina_davidi)、[Biodiversitas](https://mail.smujo.id/biodiv/article/view/4975)、[SeaLifeBase](https://sealifebase.org/summary/Palaemonetes-pugio)、[Breeders Registry](https://breedersregistry.org/?p=596)
- **bivalve**：[MDC](https://mdc.mo.gov/discover-nature/field-guide/fingernail-clams)、[Dayton](https://ecommons.udayton.edu/bio_fac_pub/307)、[J. Conch.](https://conchsoc.org/sites/default/files/jconch/40/5/2011-40505.pdf)、[Konstanz](https://kops.uni-konstanz.de/entities/publication/15c8ceb4-f3b1-4710-865b-f6de0c3f81ef)
- **planarian**：[PMC3306686](https://pmc.ncbi.nlm.nih.gov/articles/PMC3306686)、[Nottingham](https://eprints.nottingham.ac.uk/12308)、[J. Gen. Physiol.](https://rupress.org/jgp/article/61/6/767/12791/Population-Growth-in-Planaria-Dugesia-tigrina)
- **hydra**：[HAGR](https://hagr.ageing-map.org/species/biblio.php?id=0653)、[Live Science](https://www.livescience.com/53178-hydra-may-live-forever.html)、[IJDB](https://ijdb.ehu.eus/article/pdf/113461dm)、[PLOS One](https://pmc.ncbi.nlm.nih.gov/articles/PMC2765617/table/pone-0007698-t003)
- **sea_urchin**：[J-STAGE](https://www.jstage.jst.go.jp/article/pbr/18/4/18_B180401/_article)、[Reeflex](https://en.reeflex.net/tiere/726_Mespilia_globulus.htm)、[LiveAquaria](https://www.liveaquaria.com/products/tuxedo-urchin)
- **brittle_star**：[MarLIN](https://marlin.ac.uk/biotic/browse.php?sp=6029)、[UW FHL](https://depts.washington.edu/fhl/zoo432/argyle/Reproduction.htm)、[Wikipedia](https://en.wikipedia.org/wiki/Ophiactis_savignyi)
- **sponge**：[MarLIN](https://marlin.ac.uk/habitats/detail/1203)、[Mental Floss](https://mentalfloss.com/article/80671/enormous-sea-sponge-may-be-oldest-animal-earth)
- **tunicate**：[MarLIN](https://marlin.ac.uk/species/detail/1369)、[Sci. Rep.](https://link.springer.com/article/10.1038/s41598-023-36923-6)、[PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC48905)
- **coral**：[HAL](https://hal.sorbonne-universite.fr/hal-02927645)、[Guinness](https://www.guinnessworldrecords.com/world-records/635833-oldest-colonial-organism)、[Aquarium La Rochelle](https://www.aquarium-larochelle.com/en/species-encyclopedia/elkhorn-coral/)
- **odonate_nymph**：[British Dragonfly Society](https://british-dragonflies.org.uk/odonata/life-cycle-and-biology/)、[Sci. Rep.](https://link.springer.com/10.1038/s41598-021-84639-2)
- **predatory_insect**：[New Forest NPA](https://www.newforestnpa.gov.uk/discover/wildlife/beetles/great-diving-beetle)、[Aquatic Bugs](https://aquaticbugs.com/nepa-cinerea/)、[EIU](https://thekeep.eiu.edu/theses/2788)
- **crayfish**：[NE Invasives](https://neinvasives.com/aquatic-invasive-animals/red-swamp-crayfish/)、[arXiv](https://arxiv.org/pdf/1210.3970)、[Amazonas](https://www.amazonasmagazine.com/2013/03/15/a-mexican-crayfish-for-nano-aquariums/)、[Garnelio](https://www.garnelio.de/en/oranger-zwergkrebs-oranger-zwergflusskrebs-cpo)
- **mantis_shrimp**：[SeaLifeBase](https://sealifebase.org/summary/91825)、[ADW](https://animaldiversity.org/accounts/Gonodactylus_smithii)
- **planktivore_fish**：[eLife](https://elifesciences.org/articles/41548)、[FishBase 3228](https://fishbase.se/summary/3228)、[Wikipedia](https://en.wikipedia.org/wiki/Harlequin_rasbora)、[FishBase 5679](https://fishbase.org/summary/5679)
- **grazer_fish**：[Braz. J. Biol.](https://scielo.br/j/bjb/a/WDVzqdswS7gdNHBZ8HvjTrQ)、[FishBase 6058](https://www.fishbase.se/summary/6058)、[MEPS](https://int-res.com/abstracts/meps/v389/p245-255)
- **benthic_omnivore_fish**：[FishBase 10926](https://www.fishbase.se/summary/10926)、[Wikipedia](https://en.wikipedia.org/wiki/Kuhli_loach)、[Amazonas](https://amazonasmagazine.com/2012/12/13/zhous-vermilion-goby)、[FishBase 15825](https://www.fishbase.se/summary/15825)
- **piscivore_fish**：[USM](https://aquila.usm.edu/fac_pubs/18377)、[FishBase 5195](https://www.fishbase.se/summary/5195)、[LiveAquaria](https://www.liveaquaria.com/products/dwarf-zebra-lionfish)、[Seriously Fish](https://seriouslyfish.com/species/crenicichla-compressiceps)

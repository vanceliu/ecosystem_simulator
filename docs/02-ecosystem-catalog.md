# 02 生態目錄

本文件定義所有功能群（Archetype），共 111 個，涵蓋水域、陸域與兩棲。只納入變溫動物；鳥類與哺乳類不納入。實作資料位於 `src/content/archetypes/`，數值參數以程式碼為準，本文件定義類群、角色與規則。壽命、繁殖與族群密度見 [09](09-life-history.md)。

## 1. 代碼

**鹽度**：F 淡水（0–0.5 ppt）、B 半鹹水（0.5–30 ppt）、M 海水（30–35 ppt）。

**族群型態**：`biomass` 以總生物量計算；`cohort` 以個體數與世代群計算。

**來源途徑（Vector）**

| 代碼 | 說明 |
|---|---|
| `background` | 背景孢子雨：空氣、器材帶入，每缸恆定低速率 |
| `tap_water` | 自來水；微生物極少 |
| `aged_water` | 熟成缸水；帶硝化菌與微型生物 |
| `pond_water` | 池塘水；微型動物多樣性高，可能帶掠食性昆蟲 |
| `natural_seawater` | 天然海水；帶海洋浮游生物 |
| `live_rock` | 活石；大量海洋微生物與搭便車無脊椎 |
| `live_sand` | 活砂；底棲微生物與小型無脊椎 |
| `plant` | 加入水草時的搭便車生物 |
| `driftwood` | 沉木；真菌與生物膜 |
| `open_inflow` | 開放系統流入：連通池塘或海域的持續補充 |
| `soil` | 陸域土壤基質；土壤細菌、線蟲、蟎、跳蟲 |
| `leaf_litter` | 落葉層；真菌、等足類、馬陸、擬蠍、蜈蚣 |
| `feeder_escape` | 活餌昆蟲逃逸後建立族群 |
| `outside` | 未加蓋時從缸外進入：螞蟻、蜘蛛、蕈蚋 |
| `player_release` | 玩家投放；從功能群隨機抽出新物種，或從圖鑑重新投放 |

自然來源途徑只產生原生於所選生物地理區的功能群；`player_release`、`feeder_escape` 不受限（[11](11-geography-climate.md) §6）。
| `mutation` | 缸內族群繁殖時突變（[05](05-species-generation.md) §5） |

## 2. 營養層總覽

| 層 | 名稱 | 組成 |
|---|---|---|
| L0 | 非生物資源 | 水域：光、O₂、CO₂、TAN、NO₂、NO₃、PO₄、SiO₂、Ca、DOC、碎屑；陸域：落葉、土壤有機質、土壤濕度、空氣濕度（定義於 [04](04-simulation-model.md)） |
| L1-D | 分解者與化能自營菌 | 細菌、真菌、生物膜、土壤細菌 |
| L1-P | 初級生產者 | 藻類、藍綠菌、水草、大型藻、共生藻、苔蘚、陸生植物、附生植物 |
| L2 | 微型消費者 | 原生動物、輪蟲 |
| L3 | 小型無脊椎 | 水生甲殼類、蠕蟲、螺貝、濾食者、珊瑚；陸生碎屑食者（跳蟲、等足類、馬陸、蚯蚓、蟎） |
| L3-P | 微型掠食者 | 渦蟲、水螅、捕食蟎、隱翅蟲、擬蠍、蜘蛛 |
| L4 | 小型脊椎與中型消費者 | 小型魚、小型蛙、蠑螈、小型蜥、半陸生蟹、大型草食／雜食魚 |
| L5 | 中大型掠食者 | 蜻蜓幼蟲、水生昆蟲、螯蝦、螳螂蝦、大型蛙、蛇、龜、頭足類、中大型魚 |
| L6 | 頂端掠食者 | 大型肉食魚、鯊、水巨蜥 |

**區域**：W 水域、T 陸域、A 兩棲（兩者皆用）。§3.1–3.8 皆為 W。

營養層等級（Trophic Level）於執行期依實際食物組成計算，見 [04](04-simulation-model.md) §6。

## 3. 功能群

### 3.1 L1-D 分解者與化能自營菌

| ID | 名稱 | 功能 | 棲位 | 鹽度 | 型態 | 來源途徑 | 出現／優勢條件 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `aob` | 氨氧化菌（Nitrosomonas 類） | TAN → NO₂，耗 O₂ | 附著 | FBM | biomass | background、aged_water、live_rock、live_sand | TAN > 0、有附著面積 | 從接種到建立約 14 遊戲日 |
| `nob` | 亞硝酸氧化菌（Nitrospira 類） | NO₂ → NO₃，耗 O₂ | 附著 | FBM | biomass | background、aged_water、live_rock、live_sand | NO₂ > 0 | 在 `aob` 之後約 14 遊戲日建立 |
| `heterotroph` | 異營細菌 | 碎屑／DOC → TAN + PO₄ + CO₂，耗 O₂ | 水層、附著 | FBM | biomass | 所有途徑 | 恆存在 | 新缸白濁期爆發 |
| `denitrifier` | 脫氮菌 | NO₃ → N₂（逸出系統） | 底材深層 | FBM | biomass | background、live_sand、live_rock | 底材深度 ≥ 5 cm，或底材為泥／活砂 | 只在缺氧區運作 |
| `water_mold` | 水生真菌與水黴（卵菌） | 分解碎屑、沉木 | 附著 | F B | biomass | background、driftwood | 有沉木或碎屑過量 | 鹽度 > 15 ppt 抑制；新沉木白膜期 2–4 遊戲週 |
| `biofilm` | 生物膜群落 | 細菌、微藻、胞外聚合物（EPS）複合體 | 表面 | FBM | biomass | background、driftwood | 有表面積且 `heterotroph` 存在 | 刮食者主食 |

### 3.2 L1-P 初級生產者

| ID | 名稱 | 功能 | 棲位 | 鹽度 | 型態 | 來源途徑 | 出現／優勢條件 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `diatom` | 矽藻 | 光合，需 SiO₂ | 附著、水層 | FBM | biomass | background、所有水源 | SiO₂ > 0；低光可生長 | 新缸前期優勢，SiO₂ 耗盡後衰退 |
| `green_algae` | 綠藻（含綠毛藻） | 光合 | 附著 | FBM | biomass | background、plant、pond_water | 高光 + NO₃ + PO₄ | 與水草競爭光與營養 |
| `cyanobacteria` | 藍綠菌 | 光合；可固氮 | 底材表面 | FBM | biomass | background、live_rock、pond_water | 高 PO₄、光照、低流速 | 固氮：N 不足時仍可生長 |
| `phytoplankton` | 浮游微藻（綠水） | 光合 | 水層 | FBM | biomass | pond_water、natural_seawater、open_inflow | 高營養、光照、低過濾 | 濾食者與枝角類主食 |
| `aquatic_plant` | 水草 | 光合；根部吸收底材養分 | 底棲 | F B | biomass | player_release、plant | 鹽度 < 10 ppt、有底材 | 優先吸收 TAN；提供附著面積與庇護所 |
| `macroalgae` | 大型藻 | 光合 | 附著、漂浮 | B M | biomass | live_rock、natural_seawater、player_release | 鹽度 ≥ 10 ppt | 吸收 NO₃、PO₄；提供庇護所 |
| `zooxanthellae` | 蟲黃藻 | 共生光合 | 宿主體內 | M | 隸屬宿主 | 隨宿主 | 僅與 `coral` 共存 | 見 [04](04-simulation-model.md) §5.5 |

### 3.3 L2 微型消費者

| ID | 名稱 | 食物 | 棲位 | 鹽度 | 型態 | 來源途徑 | 出現／優勢條件 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `ciliate` | 纖毛蟲（草履蟲類） | 細菌、微藻 | 水層 | FBM | biomass | aged_water、pond_water、natural_seawater、plant、background | 細菌與碎屑多 | 分裂繁殖；魚苗食物 |
| `rotifer` | 輪蟲 | 濾食細菌、微藻 | 水層、附著 | FBM | cohort | aged_water、pond_water、natural_seawater、plant | 同上 | 孤雌生殖 |

### 3.4 L3 小型無脊椎

| ID | 名稱 | 食物 | 棲位 | 鹽度 | 型態 | 來源途徑 | 出現／優勢條件 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `copepod` | 橈足類 | 雜食：微藻、纖毛蟲、碎屑 | 水層、底棲 | FBM | cohort | aged_water、pond_water、natural_seawater、live_rock、live_sand、plant | 微藻或纖毛蟲存在 | 游動模式：爆發—停頓 |
| `ostracod` | 介形蟲 | 碎屑、生物膜 | 底棲 | FBM | cohort | pond_water、plant、live_sand | 碎屑存在 | 雙殼閉合：抗藥 |
| `cladoceran` | 枝角類（水蚤） | 浮游微藻；大型個體捕食輪蟲 | 水層 | F B（≤ 5 ppt） | cohort | pond_water、open_inflow | `phytoplankton` 存在 | 浮游微藻不足時快速衰退 |
| `amphipod` | 端足類 | 碎屑、殘餌 | 底棲 | FBM | cohort | live_rock、live_sand、pond_water、plant | 碎屑存在 | — |
| `isopod` | 等足類 | 腐食 | 底棲 | FBM | cohort | live_rock、pond_water | 碎屑、屍體 | — |
| `detritus_worm` | 碎屑蟲（寡毛類） | 碎屑 | 底材 | F B | cohort | pond_water、plant、aged_water | 碎屑過量 | 爆發代表餵食過量 |
| `nematode` | 線蟲 | 碎屑、細菌 | 底材 | FBM | cohort | 所有水源、plant、live_sand | 碎屑存在 | — |
| `bristle_worm` | 刷毛蟲（多毛類） | 殘餌、死組織、碎屑 | 底材、岩縫 | B M | cohort | live_rock、live_sand | 碎屑存在 | 夜行；爆發代表餵食過量 |
| `snail` | 螺 | 刮食藻、生物膜、碎屑 | 底棲 | FBM | cohort | plant、pond_water、live_rock、player_release | 藻或生物膜存在 | 有殼 |
| `shrimp` | 小型蝦 | 刮食、腐食 | 底棲 | FBM | cohort | player_release、pond_water、open_inflow | 生物膜或碎屑存在 | 幼體易被渦蟲、水螅捕食 |
| `sea_urchin` | 海膽 | 刮食藻、大型藻 | 底棲 | M | cohort | live_rock、player_release | 藻類存在 | 棘刺防禦 |
| `brittle_star` | 陽燧足 | 腐食 | 底棲、岩縫 | M | cohort | live_rock、live_sand | 碎屑存在 | 夜行 |
| `bivalve` | 雙殼貝 | 濾食浮游微藻、細菌 | 底材 | FBM | cohort | live_sand、pond_water、player_release | 浮游微藻或細菌存在 | 有殼 |
| `sponge` | 海綿 | 濾食浮游細菌 | 固著 | M（F 少見） | cohort | live_rock | 浮游細菌存在 | 可帶共生藻 |
| `tunicate` | 海鞘 | 濾食浮游細菌 | 固著 | M | cohort | live_rock、natural_seawater | 浮游細菌存在 | — |
| `coral` | 珊瑚 | 宿主蟲黃藻 + 捕捉微型浮游生物 | 固著 | M | cohort | live_rock、player_release | 光照、Ca | 共生、鈣化、白化 |

### 3.5 L3-P 微型掠食者

| ID | 名稱 | 食物 | 棲位 | 鹽度 | 型態 | 來源途徑 | 出現／優勢條件 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `planarian` | 渦蟲 | 幼蝦、卵、腐肉 | 底棲 | F B | cohort | plant、pond_water | 碎屑過量 | 捕食 `shrimp` 幼體 |
| `hydra` | 水螅 | 浮游動物、魚苗 | 固著 | F B | cohort | plant、pond_water | 浮游動物多 | 捕食魚苗、幼蝦 |

### 3.6 L4 小型魚類

| ID | 名稱 | 食物 | 棲位 | 鹽度 | 型態 | 來源途徑 | 出現／優勢條件 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `planktivore_fish` | 浮游動物食性小魚 | 橈足類、枝角類、輪蟲 | 水層 | FBM | cohort | player_release、open_inflow | 容量 ≥ 10 L | — |
| `grazer_fish` | 藻食魚 | 藻、生物膜 | 附著面、底棲 | FBM | cohort | player_release、open_inflow | 容量 ≥ 30 L | — |
| `benthic_omnivore_fish` | 底棲雜食魚 | 碎屑、小型無脊椎 | 底棲 | FBM | cohort | player_release、open_inflow | 容量 ≥ 30 L | — |

### 3.7 L5 大型無脊椎掠食者

| ID | 名稱 | 食物 | 棲位 | 鹽度 | 型態 | 來源途徑 | 出現／優勢條件 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `odonate_nymph` | 蜻蜓／豆娘幼蟲 | 蝦、小魚、無脊椎 | 底棲、水草間 | F | cohort | plant、pond_water、open_inflow | 有水草 | 伏擊；成熟後羽化離缸 |
| `predatory_insect` | 掠食性水生昆蟲（龍蝨、水蠍、負子蟲） | 無脊椎、小魚 | 水層、水草間 | F | cohort | pond_water、open_inflow | — | 同類相食 |
| `crayfish` | 螯蝦 | 雜食：腐植、可制伏的動物 | 底棲 | F | cohort | player_release | 容量 ≥ 30 L | 捕食範圍上限為自身體型 |
| `mantis_shrimp` | 螳螂蝦 | 蝦、螺、小魚 | 岩縫 | M | cohort | live_rock | 有岩縫 | 夜行 |

### 3.8 L6 頂端掠食者

| ID | 名稱 | 食物 | 棲位 | 鹽度 | 型態 | 來源途徑 | 出現／優勢條件 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `piscivore_fish` | 小型肉食魚（≤ 20 cm：短鰭蓑鮋、小型梭口魚） | 魚、蝦 | 水層 | FBM | cohort | player_release、open_inflow | 容量 ≥ 160 L | — |

### 3.9 陸域生產者與分解者

| ID | 名稱 | 層 | 區域 | 功能 | 型態 | 來源途徑 | 特殊機制 |
|---|---|---|---|---|---|---|---|
| `moss_liverwort` | 苔蘚與蘚苔 | L1-P | T | 光合 | biomass | plant、background | 濕度 > 80%；陸生螺與蛞蝓啃食 |
| `terrestrial_plant` | 陸生植物（蕨類、蔓綠絨、挺水植物） | L1-P | T | 光合；落葉供碎屑食者 | biomass | player_release | 葉片汰換產生落葉 |
| `bromeliad_epiphyte` | 鳳梨科附生植物 | L1-P | T | 光合；葉筒積水為微棲地 | biomass | player_release | 開花一次後母株死亡，產生 2–6 子株 |
| `saprotrophic_fungus` | 腐生真菌（蕈類、黴菌） | L1-D | T | 分解落葉、木材 | biomass | background、soil、leaf_litter、driftwood | 新造景 2–6 週白黴期 |
| `soil_bacteria` | 土壤細菌 | L1-D | T | 分解落葉與土壤有機質 → TAN、PO₄ | biomass | soil 及所有陸域途徑 | 恆存在；活性比例 3–30% |

### 3.10 陸生無脊椎

| ID | 名稱 | 層 | 區域 | 食物 | 型態 | 來源途徑 | 特殊機制 |
|---|---|---|---|---|---|---|---|
| `soil_nematode` | 土壤線蟲 | L3 | T | 細菌、真菌 | cohort | soil、leaf_litter | — |
| `springtail` | 跳蟲 | L3 | T | 碎屑、真菌 | cohort | player_release、plant、soil | 濕度 ≥ 90%；部分孤雌生殖；小型蛙主食 |
| `terrestrial_isopod` | 陸生等足類（鼠婦、球鼠婦） | L3 | T | 落葉、碎屑 | cohort | player_release、leaf_litter | 需濕區與乾區；小型種孤雌生殖 |
| `millipede` | 馬陸 | L3 | T | 落葉 | cohort | leaf_litter、plant | — |
| `potworm` | 線蚓 | L3 | T | 碎屑、微生物 | cohort | soil、player_release | — |
| `earthworm` | 蚯蚓 | L3 | T | 土壤有機質 | cohort | soil、player_release | 土深 ≥ 5 cm；提高土壤通氣 |
| `land_snail_slug` | 陸生螺與蛞蝓 | L3 | T | 植物、苔蘚、碎屑 | cohort | plant | 自體受精；啃食植物 |
| `detritivore_mite` | 腐食蟎 | L3 | T | 真菌、碎屑、殘餌 | cohort | soil、leaf_litter、feeder_escape | 殘餌過量時爆發 |
| `predatory_mite` | 捕食蟎 | L3-P | T | 蕈蚋幼蟲、蟎、跳蟲 | cohort | player_release、soil | — |
| `fungus_gnat` | 蕈蚋 | L3 | T | 幼蟲食真菌與根 | cohort | outside、plant、soil | 濕基質時爆發 |
| `fruit_fly` | 果蠅 | L3 | T | 腐果、殘餌 | cohort | feeder_escape | 無翅品系 > 27.5 °C 恢復飛行；未加蓋時逃逸 |
| `cricket` | 蟋蟀 | L3 | T | 雜食 | cohort | feeder_escape | 啃食植物與卵 |
| `rove_beetle` | 隱翅蟲 | L3-P | T | 小型無脊椎 | cohort | player_release、leaf_litter | — |
| `darkling_beetle` | 擬步行蟲（麵包蟲成蟲） | L3 | T | 腐食 | cohort | feeder_escape | 需乾區 |
| `spider` | 蜘蛛 | L3-P | T | 飛蟲 | cohort | outside、plant | 結網 |
| `centipede` | 蜈蚣 | L4 | T | 無脊椎 | cohort | leaf_litter | — |
| `pseudoscorpion` | 擬蠍 | L3-P | T | 蟎、跳蟲 | cohort | leaf_litter、player_release | — |
| `ant` | 螞蟻 | L3 | T | 雜食；捕食清潔隊 | cohort | outside | 群體；未加蓋時入侵 |

### 3.11 兩棲類

| ID | 名稱 | 層 | 區域 | 食物 | 鹽度 | 型態 | 來源途徑 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `dart_frog_small` | 小型陸蛙（箭毒蛙、曼蛙） | L4 | T | 跳蟲、果蠅 | F | cohort | player_release | 陸上產卵；蝌蚪需水域 |
| `tree_frog` | 樹蛙 | L4 | T | 蟋蟀、飛蟲 | F | cohort | player_release | 樹棲，需缸高；卵產於水面上方葉片 |
| `semi_aquatic_toad` | 半水生蟾（鈴蟾） | L4 | A | 昆蟲 | F | cohort | player_release | — |
| `aquatic_frog_dwarf` | 侏儒爪蟾 | L4 | W | 小型無脊椎、碎屑 | F | cohort | player_release | 需至水面換氣；成體吃卵 |
| `aquatic_frog_clawed` | 爪蟾 | L5 | W | 魚、無脊椎、小蛙 | F | cohort | player_release | — |
| `large_frog_ambush` | 大型伏擊蛙（角蛙） | L5 | T | 蛙、魚、大型無脊椎 | F | cohort | player_release | 同類相食；蝌蚪肉食 |
| `large_frog_aquatic` | 牛蛙 | L5 | A | 蛙、魚、蛇、幼龜 | F | cohort | player_release、open_inflow | 蝌蚪期 4 個月至 3 年 |
| `newt` | 蠑螈 | L4 | A | 蠕蟲、小型無脊椎、魚苗 | F | cohort | player_release、pond_water | 水溫 ≤ 24 °C；水生幼體 |
| `axolotl` | 墨西哥鈍口螈 | L5 | W | 蠕蟲、魚 | F | cohort | player_release | 幼態延續，不變態；同類相食；水溫 14–22 °C |

**變態**：蛙類與蠑螈的卵與幼體只能生活在水域；變態後依功能群區域移動。缸內無水域時無法完成繁殖。

### 3.12 爬蟲類

| ID | 名稱 | 層 | 區域 | 食物 | 鹽度 | 型態 | 來源途徑 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `small_arboreal_lizard` | 小型樹棲蜥（變色蜥、日行守宮、石龍子） | L4 | T | 昆蟲、幼蛙 | — | cohort | player_release | 需 UVB、加熱燈；雄性互鬥 |
| `semi_aquatic_lizard` | 半水棲蜥（雙冠蜥、水龍） | L5 | A | 昆蟲、魚、蛙 | F | cohort | player_release | 需 UVB、加熱燈、大水池；雄性互鬥 |
| `water_monitor` | 水巨蜥 | L6 | A | 魚、蛙、蟹、龜 | F B | cohort | player_release | 陸域頂端掠食者 |
| `garter_water_snake` | 束帶蛇、水蛇 | L5 | A | 魚、蛙、蝌蚪、蠑螈 | F（部分 B） | cohort | player_release | 胎生 |
| `small_python` | 小型蟒（兒童蟒） | L5 | T | 蜥蜴、蛙 | — | cohort | player_release | 卵生 |
| `musk_turtle` | 麝香龜 | L5 | W | 螺、昆蟲、腐肉、小魚 | F | cohort | player_release | 需曬背處、UVB |
| `slider_turtle` | 滑龜 | L5 | A | 雜食：魚、蝌蚪、螺、水草 | F（耐微鹹） | cohort | player_release | 需曬背處、UVB；啃食水草 |
| `softshell_turtle` | 鱉 | L5 | W | 魚、螯蝦、蛙 | F | cohort | player_release | 需細砂底 |

**體溫**：爬蟲類體溫 = 空氣溫度；光週期內有加熱燈時 = 曬點溫度。無 UVB 時壓力死亡率見 [04](04-simulation-model.md) §5.8。

### 3.13 半陸生甲殼類與魚

| ID | 名稱 | 層 | 區域 | 食物 | 鹽度 | 型態 | 來源途徑 | 特殊機制 |
|---|---|---|---|---|---|---|---|---|
| `vampire_crab` | 吸血鬼蟹 | L4 | A | 碎屑、蝦、幼蛙 | F | cohort | player_release | 直接發育，缸內可繁殖 |
| `mangrove_crab` | 紅螯相手蟹 | L4 | A | 雜食、碎屑 | B | cohort | player_release | 海洋浮游幼體；雄性互鬥 |
| `fiddler_crab` | 招潮蟹 | L4 | A | 沉積物碎屑 | B | cohort | player_release | 海洋浮游幼體；需深砂 |
| `mudskipper` | 彈塗魚 | L4 | A | 昆蟲、甲殼類、小魚 | B（耐淡至海） | cohort | player_release | 領域性；需加蓋 |

### 3.14 大型水生動物

| ID | 名稱 | 層 | 食物 | 鹽度 | 型態 | 來源途徑 | 特殊機制 |
|---|---|---|---|---|---|---|---|
| `arowana` | 龍魚 | L6 | 水面伏擊：昆蟲、魚、蛙 | F | cohort | player_release | 雄魚口孵 |
| `gar` | 雀鱔 | L6 | 魚、蝦 | F（耐微鹹） | cohort | player_release、open_inflow | — |
| `bichir` | 多鰭魚 | L5 | 夜行：魚、蠕蟲、甲殼類 | F | cohort | player_release | 可呼吸空氣 |
| `snakehead` | 鱧 | L6 | 魚 | F | cohort | player_release、open_inflow | 雙親護巢 |
| `cichlid_pursuit_predator` | 大型追擊慈鯛（皇冠三間、大型梭口魚） | L6 | 魚 | F | cohort | player_release | 雙親護卵 |
| `oscar` | 大型雜食慈鯛（地圖魚） | L5 | 雜食、掠食 | F | cohort | player_release | 缸內易繁殖 |
| `pacu` | 淡水白鯧 | L4 | 果實、種子、浮游動物 | F | cohort | player_release | — |
| `silver_dollar` | 銀板 | L4 | 水草 | F | cohort | player_release | 群游；啃食水草 |
| `koi` | 錦鯉 | L4 | 底棲雜食 | F | cohort | player_release | 冷水耐受 4–28 °C |
| `goldfish` | 金魚 | L4 | 雜食 | F | cohort | player_release | 冷水耐受 |
| `large_pleco` | 大型異型 | L4 | 碎屑、藻 | F | cohort | player_release | 挖洞產卵 |
| `giant_catfish` | 巨型掠食鯰（紅尾鯰、虎鯰） | L6 | 夜行：魚 | F | cohort | player_release | — |
| `freshwater_stingray` | 淡水魟 | L5 | 蠕蟲、甲殼類、魚 | F | cohort | player_release | 胎生 |
| `fire_eel` | 火鱔 | L5 | 夜行：蠕蟲、甲殼類、魚 | F | cohort | player_release | 需細砂底 |
| `scat` | 金錢魚 | L4 | 雜食、碎屑 | B | cohort | player_release | — |
| `grouper` | 石斑 | L6 | 魚、甲殼類 | M | cohort | player_release | 先雌後雄 |
| `lionfish` | 獅子魚 | L6 | 小魚、蝦 | M | cohort | player_release | 毒棘 |
| `tang` | 倒吊 | L4 | 絲狀藻 | M | cohort | player_release | 同屬互鬥 |
| `triggerfish` | 炮彈魚 | L5 | 海膽、蟹、貝 | M | cohort | player_release | 咬碎硬殼 |
| `moray` | 鯙 | L6 | 夜行：甲殼類、魚 | M | cohort | live_rock、player_release | — |
| `benthic_shark` | 底棲小型鯊（竹鯊、肩章鯊） | L6 | 夜行：甲殼類、蠕蟲、小魚 | M | cohort | player_release | 卵生 |
| `marine_stingray` | 海水魟 | L5 | 甲殼類、蠕蟲、貝 | M | cohort | player_release | 胎生 |
| `spiny_lobster` | 龍蝦與大型蟹 | L5 | 夜行：腐食、貝類 | M | cohort | player_release | — |
| `octopus` | 章魚 | L5 | 蟹、螺、貝 | M | cohort | player_release、live_rock | 需加蓋；一次繁殖後死亡 |
| `cuttlefish` | 烏賊 | L5 | 蝦、蟹、小魚 | M | cohort | player_release | 一次繁殖後死亡 |
| `sea_star` | 大型海星 | L4 | 固著無脊椎、腐肉 | M | cohort | player_release | 捕食珊瑚、海綿 |

`crayfish` 包含侏儒螯蝦、美國螯蝦、紅螯螯蝦；`sea_urchin` 包含小型與大型海膽。

### 3.15 體型與飼養空間

各功能群於 [09](09-life-history.md) 定義最小飼養空間（缸長、水量、陸域面積、缸高）。缸不符時該功能群不可出現；`size` 等位基因換算的體長超出缸可容納上限時，該等位基因權重為 0（[09](09-life-history.md) §7）。

## 4. 生物類別

物種列表「生物類別」分組依據。

| 類別 | 功能群 |
|---|---|
| 細菌 | `aob`、`nob`、`heterotroph`、`denitrifier`、`biofilm`、`cyanobacteria`、`soil_bacteria` |
| 真菌與卵菌 | `water_mold`、`saprotrophic_fungus` |
| 藻類與植物 | `diatom`、`green_algae`、`phytoplankton`、`aquatic_plant`、`macroalgae`、`zooxanthellae`、`moss_liverwort`、`terrestrial_plant`、`bromeliad_epiphyte` |
| 原生動物 | `ciliate` |
| 輪蟲 | `rotifer` |
| 甲殼類 | `copepod`、`ostracod`、`cladoceran`、`amphipod`、`isopod`、`shrimp`、`crayfish`、`mantis_shrimp`、`terrestrial_isopod`、`vampire_crab`、`mangrove_crab`、`fiddler_crab`、`spiny_lobster` |
| 蠕蟲類 | `detritus_worm`、`nematode`、`bristle_worm`、`planarian`、`soil_nematode`、`potworm`、`earthworm` |
| 軟體動物 | `snail`、`bivalve`、`land_snail_slug`、`octopus`、`cuttlefish` |
| 刺胞動物 | `coral`、`hydra` |
| 海綿與海鞘 | `sponge`、`tunicate` |
| 棘皮動物 | `sea_urchin`、`brittle_star`、`sea_star` |
| 多足類 | `millipede`、`centipede` |
| 蛛形類 | `detritivore_mite`、`predatory_mite`、`spider`、`pseudoscorpion` |
| 昆蟲與六足類 | `odonate_nymph`、`predatory_insect`、`springtail`、`fungus_gnat`、`fruit_fly`、`cricket`、`rove_beetle`、`darkling_beetle`、`ant` |
| 硬骨魚類 | `planktivore_fish`、`grazer_fish`、`benthic_omnivore_fish`、`piscivore_fish`、`mudskipper`、`arowana`、`gar`、`bichir`、`snakehead`、`cichlid_pursuit_predator`、`oscar`、`pacu`、`silver_dollar`、`koi`、`goldfish`、`large_pleco`、`giant_catfish`、`fire_eel`、`scat`、`grouper`、`lionfish`、`tang`、`triggerfish`、`moray` |
| 軟骨魚類 | `freshwater_stingray`、`benthic_shark`、`marine_stingray` |
| 兩棲類 | `dart_frog_small`、`tree_frog`、`semi_aquatic_toad`、`aquatic_frog_dwarf`、`aquatic_frog_clawed`、`large_frog_ambush`、`large_frog_aquatic`、`newt`、`axolotl` |
| 爬蟲類 | `small_arboreal_lizard`、`semi_aquatic_lizard`、`water_monitor`、`garter_water_snake`、`small_python`、`musk_turtle`、`slider_turtle`、`softshell_turtle` |

## 5. 參考來源

- [Secrets to success: Your aquarium's food chain — reefs.com](https://reefs.com/secrets-success-aquariums-food-chain/)
- [Trophic Cascades in Aquatic Systems — UTK](https://lgross.utk.edu/eeb507/ecobeak/trophcascades.html)
- [Ammonia & the Nitrogen Cycle — LiveAquaria](https://www.liveaquaria.com/blogs/water-quality/ammonia-the-nitrogen-cycle-keep-your-aquarium-healthy)
- [Nitrification in aquaria — Coral Magazine](https://www.coralmagazine.com/?p=3064201)
- [How to cycle an aquarium — Bulk Reef Supply](https://www.bulkreefsupply.com/content/post/md-2021-03-how-to-cycle-an-aquarium)
- [Microfauna of the botanical method aquarium](https://bettabotanicals.com/blogs/bens-aquarium/little-bugs-in-my-fish-tank-microfauna-of-the-botanical-method-aquarium)
- [Aquarium Pest Identification](https://gensou.sg/?p=20084)
- [Clean-up crew — Wikipedia](https://en.wikipedia.org/wiki/Clean-up_crew)
- [Bristle Worms in Reef Tanks — Algaebarn](https://help.algaebarn.com/portal/en/kb/articles/the-great-bristle-worm-debate-the-truth-about-bristle-worms-in-saltwater-aquariums-27-10-2025)
- [Aquarium Algae Control: Diatoms, Cyano, GHA — Bulk Reef Supply](https://www.bulkreefsupply.com/content/post/md-2016-03-aquarium-algae-control-part-1-diatoms-cyano-green-hair-algae)
- [Ciliates as engineers of phototrophic biofilms](https://agris.fao.org/search/ar/records/65dfa1a30f3e94b9e5dacda9)
- [Aquarium Biofilm Guide](https://gensou.sg/?p=30844)
- [Reef aquarium lighting: zooxanthellae — reefs.com](https://reefs.com/tag/light-intensity/)
- [Filter feeding of sponges and tunicates — Journal of Experimental Biology](https://cob.silverchair.com/jeb/article-pdf/205/22/3505/1243261/3505.pdf)
- [Pond Insects and Other Invert Invaders — TFH Magazine](https://www.tfhmagazine.com/articles/freshwater/pond-insects-and-other-invert-invaders)
- [Aquatic insects — University of Kentucky Entomology](https://www.uky.edu/Ag/CritterFiles/casefile/bugconnection/petbugs/Kentucky/aquatic.htm)
- [Dragonfly Nymphs in Your Aquarium](https://gensou.sg/dragonfly-nymph-aquarium/)
- [Stream Invertebrate Biology Briefs — Cary Institute](https://www.caryinstitute.org/sites/default/files/public/downloads/lesson-plans/1B3_Stream_Invertebrate_Biology_Briefs.pdf)
- [Madingley General Ecosystem Model — Harfoot et al. 2014](https://projects.nceas.ucsb.edu/nceas/attachments/download/1904/MadingleyModel.pdf)
- [Virtual Ecosystem model — GMD 2025](https://gmd.copernicus.org/articles/18/9633/2025/gmd-18-9633-2025.html)

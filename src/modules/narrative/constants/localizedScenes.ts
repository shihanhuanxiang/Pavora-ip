import { LocalizedScene } from "../../../shared/types/types";

export const LOCALIZED_SCENES: LocalizedScene[] = [
  // --- 中間場域 (Liminal DNA) ---
  {
    id: "LIM-01",
    city: "全台灣",
    region: "all",
    category: "中間場域",
    event: "捷運手扶梯上俯瞰湧動的人群",
    sensory: "手扶梯金屬摩擦聲、隧道陣風、上方日光燈閃爍、空調冷感",
    visualNoise: "前方背影、扶手帶反光、廣告螢幕藍光、人群模糊的頭頂",
    promptSkeleton: "Asian woman on long MRT escalator, downward perspective on blurred crowd, dim tunnel lighting, lens flare from overhead fluorescent",
    emotions: ["沉浸", "日常"]
  },
  {
    id: "LIM-02",
    city: "全台灣",
    region: "all",
    category: "中間場域",
    event: "深夜空蕩的捷運月台，獨自等待末班車",
    sensory: "軌道深處的風壓、電子看板的低鳴、進站鳴響、冷氣運轉聲",
    visualNoise: "進站告示畫面、空椅子、地上黃線、滅火器、冷清的自動門",
    promptSkeleton: "Asian woman standing on empty subway platform at night, yellow warning line, cinematic low angle, electronic display glow on face",
    emotions: ["脆弱", "沉浸"]
  },
  {
    id: "LIM-03",
    city: "全台灣",
    region: "all",
    category: "中間場域",
    event: "Uber 後座看著窗外倒退的城市霓虹",
    sensory: "司機廣播的雜訊、皮革座椅味、雨刷撥水的節律、窗外車流低鳴",
    visualNoise: "窗戶雨滴、導航螢幕微光、倒映的霓虹燈、司機的後腦勺模糊",
    promptSkeleton: "Asian woman looking out of Uber car window, rainy night city lights reflection on glass, moody cool lighting, film grain",
    emotions: ["期待", "釋然", "脆弱"]
  },
  {
    id: "LIM-04",
    city: "全台灣",
    region: "all",
    category: "中間場域",
    event: "機車停等區，感受身旁引擎的陣陣熱浪",
    sensory: "排氣管熱氣、引擎震動、安全帽內的悶熱、柏油路氣息",
    visualNoise: "機車後照鏡、前車排氣管、紅綠燈倒數、雜亂的電線",
    promptSkeleton: "Asian woman sitting on scooter in traffic, blurred tail lights, heat haze from exhaust, sunset dust, hyper-realistic texture",
    emotions: ["日常", "沉浸"]
  },
  {
    id: "LIM-05",
    city: "全台灣",
    region: "all",
    category: "中間場域",
    event: "24H 便利店靠窗吧檯，看著路上行人走過",
    sensory: "自動門叮咚聲、冰櫃冷氣、微波食品香氣、吸管塑膠感",
    visualNoise: "揉皺的發票、咖啡紙杯環、店外機車反光、玻璃窗上的指紋",
    promptSkeleton: "Asian woman sitting at convenience store window bar, night street lights outside, half-empty coffee cup, crumpled receipt on table, neon glare",
    emotions: ["釋然", "日常", "沉浸"]
  },

  // --- 北北基 ---
  {
    id: "TPE-01",
    city: "台北市",
    region: "north",
    category: "私密晨光",
    event: "在永康街吃芒果冰，冰涼糖水濺到手指上",
    sensory: "剉冰金屬碗冷凝水滴、芒果香、潮濕熱氣、隔壁鼎泰豐蒸籠味",
    visualNoise: "鄰桌遊客模糊、濺出糖水、紙菜單邊角、桌邊濕紙巾",
    promptSkeleton: "Asian woman at Yongkang Street mango shaved ice shop Taipei, 4pm awning light, sweat-condensation on metal bowl, half-eaten mango",
    emotions: ["期待", "日常"]
  },
  {
    id: "TPE-02",
    city: "台北市",
    region: "north",
    category: "都市隱匿",
    event: "雨後的象山觀景台，看著 101 被霧氣纏繞",
    sensory: "濕木棧道、汗鹽味、雨後柏油氣、遠方車流低鳴",
    visualNoise: "登山客背影、潮濕扶手反光、地面泥印、霓虹倒影",
    promptSkeleton: "Asian woman, post-rain Xiangshan trail viewing platform Taipei, Taipei 101 in distant haze, sweat-damp temple hair",
    emotions: ["沉浸", "釋然"]
  },
  {
    id: "TPE-03",
    city: "台北市",
    region: "north",
    category: "社交儀式",
    event: "信義區跨年倒數，在人群中縮著脖子躲寒風",
    sensory: "人群體溫、香氣、煙火硝味、冷風、捷運風壓",
    visualNoise: "遠方手機螢光點、灑落彩帶、地上塑膠杯、過路人模糊頭頂",
    promptSkeleton: "Asian woman amid New Year's Eve crowd at Xinyi District Taipei, 11:55pm, glittering Taipei 101 fireworks reflecting in eyes",
    emotions: ["期待", "沉浸"]
  },
  {
    id: "TPE-04",
    city: "台北市",
    region: "north",
    category: "專注瞬間",
    event: "大稻埕碼頭夕陽，手裡握著熱美式看著淡水河",
    sensory: "河水潮濕氣味、咖啡豆香、遠方低頻重機、夕陽餘溫",
    visualNoise: "河面波光、防洪牆塗鴉、摺疊椅、揉皺的發票、掉色的集點卡",
    promptSkeleton: "Asian woman at Dadaocheng Wharf sunset, holding paper coffee cup, river reflection on face, cinematic lens flare, realistic skin pores",
    emotions: ["釋然", "沉浸"]
  },
  {
    id: "TPE-05",
    city: "台北市",
    region: "north",
    category: "都市隱匿",
    event: "台北車站地下街 K 區，迷失在無盡的指標中",
    sensory: "空調循環聲、廣播迴響、各種食肆混合味、明亮日光燈",
    visualNoise: "發亮的格狀天花板、密集的店家招牌、路人提袋、地上反光瓷磚",
    promptSkeleton: "Asian woman lost in Taipei Main Station underground mall, repetitive perspective, grid lighting, cinematic symmetry, motion blur of passengers",
    emotions: ["日常", "脆弱"]
  },
  {
    id: "TPE-06",
    city: "台北市",
    region: "north",
    category: "私密晨光",
    event: "微風南山 47 樓看著烏雲壓境的信義街頭",
    sensory: "地毯靜音、高空耳壓、高級香氛味、冰塊撞擊聲",
    visualNoise: "玻璃窗倒影、手機螢幕藍光、名片盒、桌邊散落的髮夾",
    promptSkeleton: "Asian woman in high-rise lounge Xinyi Taipei, looking at overcast city through glass, dramatic sky, high-end lifestyle photography",
    emotions: ["脆弱", "沉浸"]
  },
  {
    id: "NWT-01",
    city: "新北市",
    region: "north",
    category: "反叛足跡",
    event: "九份豎崎路雨夜，紅燈籠在霧氣中暈開",
    sensory: "石階濕滑、紅燈籠暖光、芋圓蒸氣、海風遠潮聲",
    visualNoise: "濕傘、倒影、水窪反光、老店招牌、被淋濕的髮絲",
    promptSkeleton: "Asian woman on rain-wet stone steps of Jiufen Shuqi Road, red lanterns glowing through mist, transparent umbrella",
    emotions: ["沉浸", "脆弱"]
  },
  {
    id: "NWT-02",
    city: "新北市",
    region: "north",
    category: "都市隱匿",
    event: "淡水老街渡船頭，看著波光盪漾的河水",
    sensory: "鹹鹹河水味、烤魷魚香、人群喧嘩、船隻引擎聲",
    visualNoise: "水面漂浮物、觀光客手機、褪色海報、路邊機車",
    promptSkeleton: "Asian woman by Tamsui River sunset, messy hair wind, realistic skin texture, warm backlight",
    emotions: ["釋然", "日常"]
  },
  {
    id: "KEE-01",
    city: "基隆市",
    region: "north",
    category: "專注瞬間",
    event: "基隆港邊魚市清晨，空氣裡全是碎冰與海味",
    sensory: "碎冰冷感、海鮮腥氣、漁夫膠靴聲、遠方汽笛",
    visualNoise: "鋁箱、保麗龍、地上水跡、忙碌路人、鼻尖的冷氣",
    promptSkeleton: "Asian woman at Keelung fish market 5am, mist rising over crushed ice, fish scales glittering, raincoat half-zipped",
    emotions: ["日常", "沉浸"]
  },
  {
    id: "KEE-02",
    city: "基隆市",
    region: "north",
    category: "都市隱匿",
    event: "正濱漁港彩色屋前，看著倒映在水面的色彩",
    sensory: "海水濕熱、漁船油耗味、海風吹拂、遠方嬉笑",
    visualNoise: "彩色建築倒影、防波堤、垃圾袋、棄置的浮球",
    promptSkeleton: "Asian woman at Zhengbin Fishing Harbor colorful houses, vibrant reflections on water, natural overexposure, realistic detail",
    emotions: ["期待", "日常"]
  },

  // --- 桃竹苗 ---
  {
    id: "TYN-01",
    city: "桃園市",
    region: "north",
    category: "奢華暫留",
    event: "桃園機場候機室，看著窗外飛機滑行",
    sensory: "行李箱輪聲、空調乾燥、咖啡豆味、候機席皮革",
    visualNoise: "登機證、行李箱標籤、紙杯環、遠處地勤、稍微弄亂的髮絲",
    promptSkeleton: "Asian woman at Taoyuan Airport terminal, airport lounge, looking at airplanes through glass, mood lighting, travel photography",
    emotions: ["期待", "脆弱"]
  },
  {
    id: "HCC-01",
    city: "新竹市",
    region: "north",
    category: "反叛足跡",
    event: "城隍廟口吃米粉湯，蒸氣模糊了視線",
    sensory: "米粉湯熱氣、廟口香火、傳統紅椅、人聲鼎沸",
    visualNoise: "塑膠筷套、辣椒瓶、香爐、寫滿標語的攤位、桌上的充電線",
    promptSkeleton: "Asian woman eating rice noodles at Hsinchu Chenghuang Temple, steam rising, traditional street food stall, realistic skin pores",
    emotions: ["日常"]
  },
  {
    id: "MIA-01",
    city: "苗栗縣",
    region: "north",
    category: "私密晨光",
    event: "三義龍騰斷橋，感受到歷史的靜謐",
    sensory: "青草氣味、石磚涼感、微風吹拂、遠方蟲鳴",
    visualNoise: "石磚裂縫、野草、其他遊客背影、防曬乳味",
    promptSkeleton: "Asian woman at Long騰 Broken Bridge Miaoli, lush green background, ancient ruins, soft daylight",
    emotions: ["沉浸", "釋然"]
  },

  // --- 中彰投雲 ---
  {
    id: "TXG-01",
    city: "台中市",
    region: "central",
    category: "反叛足跡",
    event: "一中街珍奶巷，啜飲著冰涼的半糖去冰",
    sensory: "珍奶香、塑膠杯冷凝水、機車熱浪、霓虹光影",
    visualNoise: "塑膠袋、路邊公告、霓虹看板、過路人、揉皺的發票",
    promptSkeleton: "Asian woman drinking bubble tea on Yizhong Street Taichung, neon signs, damp street, cinematic handheld shot",
    emotions: ["日常", "釋然"]
  },
  {
    id: "TXG-02",
    city: "台中市",
    region: "central",
    category: "都市隱匿",
    event: "高美濕地夕陽，赤腳感受泥灘的濕冷",
    sensory: "海泥味、夕陽溫熱、海風、遠方快門聲",
    visualNoise: "招潮蟹、木棧道、倒影、遊客剪影、微亂髮絲",
    promptSkeleton: "Asian woman barefoot on Gaomei Wetland Taichung at sunset, mud flats reflection, windblown hair, warm orange backlight",
    emotions: ["沉浸", "釋然"]
  },
  {
    id: "TXG-03",
    city: "台中市",
    region: "central",
    category: "私密晨光",
    event: "勤美誠品綠園道，在草地上感受微風與咖啡香",
    sensory: "割草後的清香、咖啡豆味、遠方嬉笑、暖陽溫熱",
    visualNoise: "草地野餐墊、外帶紙餐墊、揉皺的發票、路邊停放的共享單車",
    promptSkeleton: "Asian woman sitting on grass at Calligraphy Greenway Taichung, picnic vibe, soft dappled sunlight, high-end lifestyle photography",
    emotions: ["釋然", "期待"]
  },
  {
    id: "NTO-01",
    city: "南投縣",
    region: "central",
    category: "奢華暫留",
    event: "日月潭涵碧樓陽台，看著晨霧在湖面散開",
    sensory: "湖水濕氣、檜木香、晨間冷風、白瓷杯燙感",
    visualNoise: "湖面小船、白霧、欄杆水滴、高級亞麻睡袍",
    promptSkeleton: "Asian woman on luxury hotel balcony overlooking Sun Moon Lake, heavy morning mist, cozy atmosphere",
    emotions: ["釋然", "脆弱"]
  },
  {
    id: "CHA-01",
    city: "彰化縣",
    region: "central",
    category: "節慶儀式",
    event: "鹿港老街摸乳巷，觸摸著古老的紅磚牆",
    sensory: "紅磚涼感、狹縫中的風、檀香餘韻、舊木門味",
    visualNoise: "磚牆裂紋、地上青苔、老舊招牌、提袋",
    promptSkeleton: "Asian woman in narrow Molu Lane Lukang, ancient red brick walls, high contrast lighting, hand touching wall",
    emotions: ["沉浸", "日常"]
  },
  {
    id: "YUN-01",
    city: "雲林縣",
    region: "central",
    category: "節慶儀式",
    event: "北港朝天宮隨香，感受到香火的重量",
    sensory: "濃郁檀香、人群熱度、爆竹聲、金箔反光",
    visualNoise: "香灰、平安符、信徒背影、紙錢碎片",
    promptSkeleton: "Asian woman at Beigang Mazu Temple Yunlin, thick incense smoke, traditional festival atmosphere, cinematic lighting",
    emotions: ["沉浸", "期待"]
  },

  // --- 嘉南高屏 ---
  {
    id: "TNN-01",
    city: "台南市",
    region: "south",
    category: "社交儀式",
    event: "神農街酒吧微醺，聽著老房子呼吸",
    sensory: "威士忌氣息、舊木頭味、燈籠暖光、空調運轉聲",
    visualNoise: "酒杯上的口紅印、半空酒瓶、木桌裂痕、揉皺的發票",
    promptSkeleton: "Asian woman at vintage bar in Shennong Street Tainan, warm tungsten lighting, moody atmosphere",
    emotions: ["釋然", "沉浸", "脆弱"]
  },
  {
    id: "TNN-02",
    city: "台南市",
    region: "south",
    category: "私密晨光",
    event: "國華街吃小卷米粉，感受府城的甜味",
    sensory: "鮮甜海鮮湯頭、悶熱攤位、塑膠椅、人群磨肩擦踵",
    visualNoise: "塑膠湯匙、辣椒罐、牆上的舊報導、桌邊的環保袋、揉皺的發票",
    promptSkeleton: "Asian woman eating squid vermicelli in Tainan street, steam on skin, chaotic food stall background, natural lighting",
    emotions: ["日常"]
  },
  {
    id: "KHH-01",
    city: "高雄市",
    region: "south",
    category: "反叛足跡",
    event: "駁二藝術特區塗鴉牆，聞到海風與噴漆味",
    sensory: "噴漆罐氣味、海風、貨櫃金屬熱、輪船汽笛",
    visualNoise: "塗鴉牆、貨櫃、滑板人、雜亂的充電線、稍微弄亂的髮絲",
    promptSkeleton: "Asian woman at Pier-2 Art Center graffiti wall Kaohsiung, salt wind, artistic background, realistic textures",
    emotions: ["沉浸", "日常"]
  },
  {
    id: "KHH-02",
    city: "高雄市",
    region: "south",
    category: "都市隱匿",
    event: "西子灣看落日，船隻緩緩進港",
    sensory: "鹹鹹海風、汽笛低鳴、夕陽餘暉、消波塊碎浪聲",
    visualNoise: "落日餘暉倒影、堤防長釣竿、過往情侶、冰過的飲料杯水珠",
    promptSkeleton: "Asian woman at Sizihwan Kaohsiung sunset, golden hour lighting, cinematic ocean view, windblown hair",
    emotions: ["沉浸", "釋然"]
  },
  {
    id: "PIF-01",
    city: "屏東縣",
    region: "south",
    category: "社交儀式",
    event: "墾丁南灣沙灘，腳指鑽進發燙的細沙",
    sensory: "鹹海水、椰子油香、發燙細沙、海浪拍擊聲",
    visualNoise: "沙灘巾、防曬瓶、衝浪板、遠處泳客、髮絲上的鹽分",
    promptSkeleton: "Asian woman in bikini at Nanwan Beach Kenting, tropical sun, sand on skin, high-end photography",
    emotions: ["期待", "釋然"]
  },

  // --- 宜花東 ---
  {
    id: "ILA-01",
    city: "宜蘭縣",
    region: "east",
    category: "奢華暫留",
    event: "礁溪溫泉旅館，看著窗外的雨",
    sensory: "硫磺味、溫泉熱氣、檜木浴缸、雨打玻璃聲",
    visualNoise: "浴巾散落、洗面乳、玻璃霧氣、窗外蘭陽平原",
    promptSkeleton: "Asian woman in onsen bath Yilan, heavy steam, looking through window at rain, soft focused",
    emotions: ["釋然", "脆弱"]
  },
  {
    id: "HUA-01",
    city: "花蓮縣",
    region: "east",
    category: "專注瞬間",
    event: "七星潭海邊撿石頭，感受鵝卵石的冰冷",
    sensory: "海浪沖刷聲、鵝卵石冷感、海浪擊石噴霧、遠方雲層",
    visualNoise: "鵝卵石堆、漂流木、海藻、遠處遊客、鼻尖的冷氣",
    promptSkeleton: "Asian woman picking stones at Qixingtan Beach Hualien, grey pebble beach, moody sky, low angle",
    emotions: ["沉浸", "日常"]
  },
  {
    id: "TTT-01",
    city: "台東縣",
    region: "east",
    category: "私密晨光",
    event: "鹿野高台看熱氣球升起，感受到瓦斯的熱度",
    sensory: "瓦斯燃燒熱、晨露氣息、草地涼感、人群驚嘆聲",
    visualNoise: "熱氣球籃、繩索、草地露水、遠方山脈、稍微弄亂的髮絲",
    promptSkeleton: "Asian woman at Taitung Hot Air Balloon Festival, morning sun, colorful balloons, dreamy atmosphere",
    emotions: ["期待", "沉浸"]
  },

  // --- 離島 ---
  {
    id: "PEN-01",
    city: "澎湖縣",
    region: "islands",
    category: "社交儀式",
    event: "澎湖花火節，煙火在海面倒映出火光",
    sensory: "硝煙味、海風、人群呼喊、煙火爆裂聲",
    visualNoise: "煙火軌跡、海邊護欄、手持相機的人群、玻璃倒影",
    promptSkeleton: "Asian woman at Penghu Fireworks Festival, night sky with colorful bursts, ocean reflection, cinematic shot",
    emotions: ["期待", "沉浸"]
  },
  {
    id: "KIN-01",
    city: "金門縣",
    region: "islands",
    category: "專注瞬間",
    event: "翟山坑道看著水面倒影",
    sensory: "坑道冷感、岩石濕氣、水聲回音、冷調光影",
    visualNoise: "岩壁紋理、扶手、出口亮光、水面波紋",
    promptSkeleton: "Asian woman in Kinmen military tunnel, cinematic blue tones, water reflections, dramatic shadows",
    emotions: ["沉浸", "脆弱"]
  },
  {
    id: "MAT-01",
    city: "連江縣",
    region: "islands",
    category: "都市隱匿",
    event: "馬祖藍眼淚夜灘，看點點藍光在腳邊破碎",
    sensory: "海水冷感、沙灘溫感、藍光閃爍、浪聲",
    visualNoise: "發光浪花、地上海藻、漂流木、揉皺的發票",
    promptSkeleton: "Asian woman barefoot on Matsu beach at midnight bioluminescent blue tears, dim stars overhead",
    emotions: ["沉浸", "釋然"]
  }
];

export const getScenesByCity = (city: string): LocalizedScene[] => {
  const matched = LOCALIZED_SCENES.filter(s => city.includes(s.city) || s.city.includes(city));
  if (matched.length > 0) return matched;
  
  // Also try liminal scenes as default
  const liminal = LOCALIZED_SCENES.filter(s => s.category === "中間場域");
  return [...matched, ...liminal];
};

import { NonVisualPersona } from "../../../shared/types/types";

export const NON_VISUAL_PERSONAS: NonVisualPersona[] = [
  {
    "persona_id": "best_friend_kiki",
    "role": "best_friend",
    "name": "Kiki",
    "traits": [
      "遲到大王",
      "工作狂",
      "行銷業",
      "喝拿鐵不加糖"
    ],
    "mention_patterns": [
      "今天跟 Kiki 約咖啡她又遲到 20 分鐘",
      "Kiki 推薦我這家店",
      "Kiki 又在加班所以我自己來",
      "Kiki 說我這件穿起來太正了"
    ],
    "visual_traces": [
      "桌上第二杯飲料(只露杯緣)",
      "副駕駛座包包一角",
      "桌邊她的口紅或手機螢幕反光",
      "肩上一隻手(只露手腕)"
    ],
    "prompt_inject": "implied second person (friend Kiki, never fully visible) — second drink on table, partial bag at edge of frame, OR a single hand resting on subject's shoulder from off-frame"
  },
  {
    "persona_id": "pet_mantou",
    "role": "pet_cat",
    "name": "饅頭",
    "traits": [
      "愛叼襪子",
      "怕生但黏主人",
      "喜歡踩鍵盤"
    ],
    "mention_patterns": [
      "饅頭今天又把我的襪子叼到客廳",
      "饅頭一直坐在我的鍵盤上不准我工作",
      "饅頭今天難得讓我抱"
    ],
    "visual_traces": [
      "貓尾巴掃過膝蓋",
      "深色衣服上的橘色貓毛",
      "鍵盤角落貓爪",
      "地上叼來的襪子",
      "窗台上模糊背影"
    ],
    "prompt_inject": "orange-and-white tabby cat partial — only tail brushing knee, OR a paw on edge of laptop, OR distant blur on windowsill, never face-front, never hero subject"
  },
  {
    "persona_id": "grandma_southern",
    "role": "grandma",
    "name": "阿嬤",
    "traits": [
      "每月寄醃菜",
      "親手做的玉鐲",
      "電話裡關心吃飽沒"
    ],
    "mention_patterns": [
      "阿嬤又寄醃菜上來",
      "阿嬤打電話來問我今天吃什麼",
      "阿嬤說台南今天又熱"
    ],
    "visual_traces": [
      "手腕上的綠色玉鐲(角落)",
      "未拆的牛皮紙伴手禮箱",
      "玻璃罐裡的醃菜",
      "手寫便條紙(『阿嬤關心』語氣)"
    ],
    "prompt_inject": "implied family — green jade bracelet on wrist (corner of frame), OR unopened brown-paper care package on counter, OR glass jar of homemade pickles, never grandmother visible"
  }
];

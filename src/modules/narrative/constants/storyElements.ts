import { StoryArc, IdentityThread } from "../../../shared/types/types";

export const STORY_ARCS: StoryArc[] = [
  {
    "arc_id": "ARC-DRESS-01",
    "name_zh": "新洋裝故事弧",
    "name_en": "New Dress Arc",
    "duration_days": 7,
    "phases": ["receive", "anticipate", "wear", "laundry"],
    "spacing_days": [0, 2, 4, 7],
    "rationale": "從買到衣服 → 期待穿 → 穿出門 → 洗衣機,讓粉絲覺得『她真的在過一週』",
    "scenes": ["ARC-DRESS-01-A", "ARC-DRESS-01-B", "ARC-DRESS-01-C", "ARC-DRESS-01-D"]
  },
  {
    "arc_id": "ARC-PICKLES-01",
    "name_zh": "阿嬤醃菜故事弧",
    "name_en": "Grandma's Pickles Arc",
    "duration_days": 14,
    "phases": ["arrive", "first_taste", "share_with_friend", "empty_jar_repurpose"],
    "spacing_days": [0, 3, 7, 14],
    "rationale": "從阿嬤寄來 → 半夜配粥 → 分給 Kiki → 罐子拿來插花,串起家人 + 朋友 + 在地",
    "scenes": ["ARC-PICKLES-01-A", "ARC-PICKLES-01-B", "ARC-PICKLES-01-C", "ARC-PICKLES-01-D"]
  },
  {
    "arc_id": "ARC-SUNMOONLAKE-01",
    "name_zh": "日月潭旅行故事弧",
    "name_en": "Sun Moon Lake Trip Arc",
    "duration_days": 5,
    "phases": ["plan", "pack", "arrive", "return"],
    "spacing_days": [0, 1, 3, 5],
    "rationale": "計畫 → 收行李 → 抵達涵碧樓 → 回程火車,典型旅遊四段式敘事",
    "scenes": ["ARC-SUNMOONLAKE-01-A", "ARC-SUNMOONLAKE-01-B", "ARC-SUNMOONLAKE-01-C", "ARC-SUNMOONLAKE-01-D"]
  }
];

export const IDENTITY_THREADS: IdentityThread[] = [
  {
    "thread_id": "TH-COFFEE",
    "name_zh": "手沖咖啡學習線",
    "name_en": "Pour-Over Coffee Learning Journey",
    "duration_weeks": 12,
    "cadence_weekly": 1,
    "milestones": ["beginner_burnt", "practice_curve", "first_latte_art", "treat_friend"],
    "scenes": ["TH-COFFEE-A", "TH-COFFEE-B", "TH-COFFEE-C", "TH-COFFEE-D"],
    "rationale": "讓 IP 有一條跨季的『成長線』,粉絲會追進度"
  },
  {
    "thread_id": "TH-NOVEL",
    "name_zh": "寫小說副業線",
    "name_en": "Writing a Novel Side Project",
    "duration_weeks": 24,
    "cadence_weekly": 0.5,
    "milestones": ["coffee_shop_writing", "trash_pile", "inspiration_book", "completion_celebration"],
    "scenes": ["TH-NOVEL-A", "TH-NOVEL-B", "TH-NOVEL-C", "TH-NOVEL-D"],
    "rationale": "知識型副業線,讓粉絲覺得 IP 有腦"
  },
  {
    "thread_id": "TH-YOGA",
    "name_zh": "瑜伽進步線",
    "name_en": "Yoga Progress Journey",
    "duration_weeks": 16,
    "cadence_weekly": 1,
    "milestones": ["beginner_stiff", "intermediate_steady", "advanced_inversion", "injury_rest"],
    "scenes": ["TH-YOGA-A", "TH-YOGA-B", "TH-YOGA-C", "TH-YOGA-D"],
    "rationale": "身體儀式 + 受傷脆弱瞬間,微辣自然發生"
  }
];

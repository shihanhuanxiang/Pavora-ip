import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OutfitV2, Model } from '../../../shared/types/types';
import { useWardrobe } from '../../../shared/hooks/useWardrobe';
import Card from '../../../shared/components/common/Card';
import Button from '../../../shared/components/common/Button';
import { OUTFIT_SEEDS_V2 } from '../constants/outfitSeeds';

const TERM_DICT: Record<string, string> = {
    // ==== 核心關鍵字 (原子級) ====
    "fitted": "合身",
    "ribbed": "羅紋",
    "knit": "針織",
    "cotton": "棉質",
    "linen": "亞麻",
    "silk": "絲質",
    "lace": "蕾絲",
    "sheer": "透膚",
    "mesh": "網紗",
    "cropped": "短版",
    "crop": "短版",
    "oversized": "寬鬆",
    "long-sleeve": "長袖",
    "long sleeve": "長袖",
    "short-sleeve": "短袖",
    "short sleeve": "短袖",
    "sleeveless": "無袖",
    "camisole": "細肩帶背心",
    "tank": "背心",
    "tee": "T恤",
    "hoodie": "連帽上衣",
    "cardigan": "開襟衫",
    "blouse": "上衣",
    "shirt": "襯衫",
    "dress": "洋裝",
    "mini skirt": "迷你裙",
    "pleated skirt": "百褶裙",
    "shorts": "短褲",
    "denim": "丹寧",
    "jeans": "牛仔褲",
    "tights": "褲襪",
    "sneakers": "休閒鞋",
    "loafers": "樂福鞋",
    "boots": "靴子",
    "sandals": "涼鞋",
    "barefoot": "赤腳",
    "black": "黑色",
    "white": "白色",
    "cream": "奶油白",
    "ivory": "奶油白",
    "grey": "灰色",
    "gray": "灰色",
    "pink": "粉色",
    "navy": "海軍藍",
    "burgundy": "酒紅色",
    "wine-red": "酒紅色",
    "charcoal": "炭灰色",
    "beige": "米色",
    "brown": "棕色",
    "red": "紅色",
    "blue": "藍色",
    "green": "綠色",

    // ==== 整句/長片語（必須優先翻譯）====
    "long ivory cotton bedsheet draped classical style": "象牙白棉布古典垂墜",
    "long flowing white linen dress, classical drape": "白色亞麻長裙古典垂墜",
    "long sheer white linen kaftan-style": "白色亞麻長罩衫",
    "long sheer white linen kaftan": "白色亞麻長罩衫",
    "long silk robe loosely tied at waist, off one shoulder": "絲質長袍鬆綁腰露肩",
    "long silk shirt dress unbuttoned at top showing collarbone": "絲質長襯衫裙微敞露鎖骨",
    "modernized qipao with high mandarin collar elegant V-neckline detail": "改良式高領V口旗袍",
    "long-sleeve silk wrap blouse, V-neckline elegant": "絲質長袖綁帶V領上衣",
    "oversized cream cotton tee with faded vintage print": "寬鬆奶白棉T復古褪色印花",
    "oversized white men's dress shirt only, partially buttoned": "寬鬆白色男友襯衫半敞",
    "thin spaghetti strap camisole": "細肩帶背心",
    "high-collar Edwardian-inspired blouse": "愛德華式高領上衣",
    "silk slip dress with delicate strap, knee length": "細肩帶絲質中長吊帶裙",
    "vintage silk slip dress 1930s style": "1930年代復古絲質吊帶裙",
    "vintage 1970s wrap dress with floral print": "1970年代復古印花綁帶連身裙",
    "vintage 1960s collared dress with bow": "1960年代復古領結連身裙",
    "vintage 1950s rockabilly bowling shirt": "1950年代搖滾保齡球襯衫",
    "vintage 1960s travel polo shirt": "1960年代復古旅行Polo衫",
    "vintage 1970s knitted cardigan over plain tee": "1970年代針織開襟衫配素T",
    "vintage 1990s cropped knit polo": "1990年代短版針織Polo",
    "vintage Hawaiian-style bowling shirt": "復古夏威夷風保齡球襯衫",
    "high-slit silk midi skirt": "絲質高開衩中長裙",
    "high-waist tailored midi pencil skirt": "高腰合身中長鉛筆裙",
    "silk halter neck top with low-back detail": "絲質繞頸低背上衣",
    "casual modern hanfu-inspired blouse": "現代漢服風休閒上衣",
    "casual modern hanfu-inspired button-up": "現代漢服風休閒排扣衫",
    "casual modern hanfu-inspired tunic": "現代漢服風休閒長衫",
    "casual cotton hanfu-inspired top": "棉質漢服風休閒上衣",
    "modern Mandarin-collar tunic shirt unbuttoned at top": "現代立領長衫微敞",
    "modern hanfu-inspired button-up": "現代漢服風排扣衫",
    "modern qipao-inspired top with mandarin collar": "改良立領旗袍上衣",
    "elegant silk hanfu top with intricate embroidery": "精緻刺繡絲質漢服上衣",
    "silk hanfu top with elegant V-neckline detail": "絲質V領漢服上衣",
    "silk hanfu top with mandarin collar": "立領絲質漢服上衣",
    "silk hanfu outer robe with long sleeves": "長袖絲質漢服外袍",
    "long silk hanfu robe with intricate embroidery": "精緻刺繡絲質漢服長袍",
    "long silk hanfu robe with subtle embroidery": "細緻刺繡絲質漢服長袍",
    "plain hanfu-inspired cotton tunic": "漢服風素色棉質長衫",
    "loose pleated hanfu pants": "寬鬆百褶漢服褲",
    "long pleated hanfu skirt": "百褶漢服長裙",
    "shirtless toweling off chest after shower": "沐浴後赤裸上身擦拭",
    "soft white cotton bathrobe loosely on shoulders": "白色棉質浴袍鬆披肩",
    "open white linen shirt unbuttoned": "白色亞麻襯衫敞開",
    "loose linen button-down shirt half-tucked": "寬鬆亞麻襯衫半紮",
    "open soft button-down linen shirt": "柔軟敞開亞麻襯衫",
    "open beige trench coat over knit polo": "米色風衣敞開搭針織Polo",
    "flannel button-down shirt unbuttoned": "法蘭絨襯衫敞開",
    "flannel plaid shirt unbuttoned over white tee": "格紋法蘭絨敞開搭白T",
    "unbuttoned crisp white shirt loosened tie": "白襯衫敞開鬆領帶",
    "unbuttoned silk pajama-style shirt": "絲質睡衣襯衫敞開",
    "unbuttoned soft cotton shirt sleeves rolled": "棉質襯衫敞開捲袖",
    "slim-fit grey button-up shirt sleeves rolled": "合身灰襯衫捲袖",
    "chambray button-up sleeves rolled": "牛仔襯衫捲袖",
    "crisp white shirt with detachable collar": "白襯衫可拆領",
    "crisp white shirt with subtle jacquard pattern": "白襯衫提花暗紋",
    "crisp button-up shirt half-untucked": "排扣襯衫半紮",
    "oversized white dress shirt loosely worn": "寬鬆白襯衫隨性穿著",
    "three-piece tweed suit vest over white shirt": "三件式呢料背心搭白襯衫",
    "boxer shorts visible just below jersey hem": "球衣下擺露四角褲",
    "oversized basketball jersey from boyfriend": "寬鬆男友籃球球衣",
    "shirt long enough as nightshirt": "長版襯衫如睡衣",
    "shirt covers (long enough)": "襯衫兼下裝",
    "high-waist linen pleated wide-leg pants": "高腰亞麻百褶寬褲",
    "high-waist black wide-leg trousers": "高腰黑色寬褲",
    "high-waist black wide-leg pants": "高腰黑色寬褲",
    "high-waist beige cotton wide-leg pants": "高腰米色棉質寬褲",
    "high-waist taupe wide-leg pants": "高腰灰褐寬褲",
    "high-waist black trousers tapered": "高腰黑色錐形褲",
    "high-waist pleated wool trousers": "高腰百褶羊毛褲",
    "high-waist pleated midi skirt": "高腰百褶中長裙",
    "high-waist faux leather mini skirt": "高腰仿皮迷你裙",
    "high-waist tweed trousers": "高腰呢料褲",
    "high-waist tapered jeans": "高腰錐形牛仔褲",
    "high-waist straight-leg dad jeans": "高腰直筒老爸褲",
    "high-waist mom jeans": "高腰媽媽褲",
    "high-waist cuffed jeans": "高腰反折牛仔褲",
    "high-waist cuffed shorts": "高腰反折短褲",
    "high-waist running shorts": "高腰跑步短褲",
    "high-waist biker shorts": "高腰騎行短褲",
    "comfortable navy cotton sweat shorts": "舒適海軍藍棉質運動短褲",
    "soft pink cotton drawstring shorts": "粉色棉質抽繩短褲",
    "loose silk pajama-style pants": "寬鬆絲質睡褲",
    "loose silk-blend trousers": "寬鬆絲混紡褲",
    "loose linen drawstring pants": "寬鬆亞麻抽繩褲",
    "loose linen pleated pants": "寬鬆亞麻百褶褲",
    "loose drawstring cotton pants": "寬鬆抽繩棉褲",
    "loose ivory linen pants": "寬鬆象牙亞麻褲",
    "loose cropped beige cotton pants": "寬鬆短版米色棉褲",
    "loose taupe cotton pants": "寬鬆灰褐棉褲",
    "loose cream cotton pants": "寬鬆奶白棉褲",
    "loose tailored grey trousers": "寬鬆合身灰褲",
    "loose cotton lounge pants": "寬鬆棉質家居褲",
    "loose cotton jogger": "寬鬆棉質慢跑褲",
    "loose comfy joggers": "寬鬆舒適慢跑褲",
    "loose cuffed jeans": "寬鬆反折牛仔褲",
    "loose worn jeans": "寬鬆穿舊牛仔褲",
    "loose linen pants": "寬鬆亞麻褲",
    "selvedge raw denim jeans": "原色赤耳丹寧",
    "raw selvedge denim": "原色赤耳丹寧",
    "selvedge denim": "赤耳丹寧",
    "slim selvedge denim": "修身赤耳丹寧",
    "slim straight black trousers": "修身直筒黑褲",
    "slim leather slides": "纖細皮革拖鞋",
    "slim leather loafers": "纖細皮革樂福鞋",
    "slim charcoal trousers": "修身炭灰褲",
    "slim grey wool trousers": "修身灰羊毛褲",
    "slim wool trousers": "修身羊毛褲",
    "slim cargo trousers": "修身工裝褲",
    "slim suit trousers": "修身西裝褲",
    "slim white linen trousers": "修身白亞麻褲",
    "slim taupe chinos": "修身灰褐卡其褲",
    "slim black trousers": "修身黑褲",
    "slim dark jeans": "修身深色牛仔褲",
    "tailored wide-leg trousers": "合身寬褲",
    "tailored knit shorts": "合身針織短褲",
    "tailored navy blazer": "合身海軍藍西裝外套",
    "linen wide-leg pants": "亞麻寬褲",
    "khaki linen trousers": "卡其亞麻褲",
    "khaki chinos pressed": "熨平卡其褲",
    "athletic shorts": "運動短褲",
    "athletic performance tee": "機能運動T",
    "track jacket half-zip": "半拉鍊運動外套",
    "track jacket zipped halfway": "運動外套半拉",
    "technical zip-front mid layer": "機能拉鍊中層",
    "technical mid layer": "機能中層",
    "thermal henley": "保暖亨利衫",
    "henley waffle thermal": "鬆餅紋亨利保暖衫",
    "black mock-neck base layer": "黑色立領內搭",
    "black mock-neck base": "黑色立領內搭",
    "black technical mock-neck": "黑色機能立領",
    "performance running sneakers": "高機能跑鞋",
    "techwear sneakers clean": "潔淨機能鞋",
    "techwear sneakers": "機能鞋",
    "running sneakers": "跑鞋",
    "casual sneakers": "休閒鞋",
    "vintage canvas sneakers": "復古帆布鞋",
    "chunky retro Reebok sneakers": "厚底復古銳步鞋",
    "chunky white sneakers": "厚底白鞋",
    "chunky sneakers": "厚底鞋",
    "clean white sneakers": "潔淨白鞋",
    "plain white sneakers": "素色白鞋",
    "cargo techwear pants tapered": "錐形機能工裝褲",
    "cargo techwear pants": "機能工裝褲",
    "baggy cargo pants": "寬鬆工裝褲",
    "baggy gray sweatpants": "寬鬆灰運動褲",
    "comfy travel joggers": "舒適旅行慢跑褲",
    "matching silk pajama pants": "成套絲質睡褲",
    "matching tweed jacket": "成套呢料外套",
    "matching tweed trousers": "成套呢料褲",
    "Doc Marten 1460 boots": "馬汀1460靴",
    "Birkenstock-style sandals": "勃肯式涼鞋",
    "Mary Jane heels": "瑪莉珍高跟鞋",
    "leather Mary Janes": "皮革瑪莉珍鞋",
    "thrifted leather block heels": "二手皮革粗跟鞋",
    "leather work boots polished": "拋光皮革工作靴",
    "leather work boots": "皮革工作靴",
    "leather loafers polished": "拋光皮革樂福鞋",
    "leather boat shoes": "皮革帆船鞋",
    "leather creepers": "厚底皮革鞋",
    "leather biker jacket": "皮革機車外套",
    "black leather biker jacket": "黑色皮革機車外套",
    "black leather oxford shoes": "黑色皮革牛津鞋",
    "black leather loafers": "黑色皮革樂福鞋",
    "polished oxford shoes": "拋光牛津鞋",
    "polished oxfords": "拋光牛津鞋",
    "polished brogues": "拋光雕花鞋",
    "pointed black leather flats": "尖頭黑色皮革平底鞋",
    "pointed leather ankle boots": "尖頭皮革短靴",
    "pointed black heels": "尖頭黑色高跟鞋",
    "low block-heel beige loafers": "低粗跟米色樂福鞋",
    "thigh-high boots": "過膝靴",
    "leather boots": "皮革靴",
    "black derby shoes": "黑色德比鞋",
    "brown leather derbies": "棕色皮革德比鞋",
    "plain black derbies": "素色黑德比鞋",
    "fuzzy cream slippers": "毛絨奶白拖鞋",
    "velvet slippers": "絲絨拖鞋",
    "embroidered slippers": "刺繡拖鞋",
    "traditional embroidered slippers": "傳統刺繡拖鞋",
    "flat embroidered shoes": "平底刺繡鞋",
    "traditional cloth slip-ons": "傳統布鞋",
    "cotton slip-ons": "棉質懶人鞋",
    "white canvas slip-ons": "白色帆布懶人鞋",
    "plain canvas slip-ons": "素色帆布懶人鞋",
    "plain leather slip-ons": "素色皮革懶人鞋",
    "strappy nude heels": "裸色細帶高跟鞋",
    "strappy black heels": "黑色細帶高跟鞋",
    "strappy heels carried in hand": "手提細帶高跟鞋",
    "barefoot in hotel suite stepping out to balcony": "赤腳於套房走向陽台",
    "barefoot on Mediterranean stone steps": "赤腳於地中海石階",
    "barefoot on Mediterranean stone": "赤腳於地中海石地",
    "barefoot on hotel balcony": "赤腳於飯店陽台",
    "barefoot on hotel carpet": "赤腳於飯店地毯",
    "barefoot on hotel room floor": "赤腳於飯店房內",
    "barefoot on hotel suite": "赤腳於飯店套房",
    "barefoot on stone steps": "赤腳於石階",
    "barefoot on study floor": "赤腳於書房地板",
    "barefoot on temple stone": "赤腳於寺廟石地",
    "barefoot with chipped black nail polish": "赤腳剝落黑色指甲油",
    "barefoot with subtle nail polish": "赤腳淡色指甲油",
    "barefoot or cotton socks": "赤腳或棉襪",
    "barefoot or embroidered slippers": "赤腳或刺繡拖鞋",
    "crew socks bunched at ankle": "腳踝堆疊船型襪",
    "thick cotton ankle socks": "厚棉短襪",
    "thick wool socks": "厚羊毛襪",
    "plain white socks": "素色白襪",
    "plain socks": "素色襪",
    "cropped fitted athletic top": "短版合身運動上衣",
    "cropped denim jacket": "短版牛仔外套",
    "vintage cropped graphic tee": "復古短版印花T",
    "baby blue cropped hoodie": "淺藍短版連帽衫",
    "vintage band tee oversized": "寬鬆復古樂團T",
    "oversized cream cashmere sweater": "寬鬆奶白喀什米爾毛衣",
    "oversized cashmere wrap": "寬鬆喀什米爾披肩",
    "oversized linen blazer": "寬鬆亞麻西裝外套",
    "oversized blazer draped over shoulders": "西裝外套披肩",
    "oversized boyfriend blazer": "寬鬆男友西裝外套",
    "oversized boyfriend hoodie": "寬鬆男友連帽衫",
    "oversized soft pink hoodie": "寬鬆粉色連帽衫",
    "oversized soft cotton hoodie": "寬鬆柔軟棉質連帽衫",
    "oversized half-zip pullover": "寬鬆半拉鍊套頭衫",
    "oversized waterproof shell jacket": "寬鬆防水機能外套",
    "oversized white men's tee": "寬鬆白色男友T",
    "oversized cotton tee": "寬鬆棉質T",
    "oversized graphic tee": "寬鬆印花T",
    "oversized white knit sweater": "寬鬆白色針織毛衣",
    "oversized hoodie": "寬鬆連帽衫",
    "oversized oatmeal cardigan": "寬鬆燕麥色開襟衫",
    "long oversized black coat": "寬鬆黑色長大衣",
    "long oversized cotton drape from behind": "後身寬鬆棉質垂墜",
    "long open kimono-style robe": "和服風敞開長袍",
    "long unstructured charcoal coat": "寬鬆炭灰長大衣",
    "long beige trench coat": "米色長風衣",
    "long beige overshirt": "米色長外搭襯衫",
    "long beige cardigan": "米色長開襟衫",
    "long beige trench": "米色長風衣",
    "long bomber jacket": "長版飛行外套",
    "long camel hair coat": "駝色長大衣",
    "long cardigan-style robe": "長版開襟風袍",
    "long dark coat draped": "深色長大衣垂墜",
    "long silk slip dress": "絲質長吊帶裙",
    "casual blazer": "休閒西裝外套",
    "navy bomber jacket": "海軍藍飛行外套",
    "navy unstructured blazer": "海軍藍寬鬆西裝外套",
    "unstructured beige blazer": "寬鬆米色西裝外套",
    "unstructured navy blazer": "寬鬆海軍藍西裝外套",
    "unstructured oat blazer": "寬鬆燕麥西裝外套",
    "unstructured taupe cardigan": "寬鬆灰褐開襟衫",
    "tweed blazer": "呢料西裝外套",
    "tweed three-piece vest": "三件式呢料背心",
    "loose-fit suit vest": "寬鬆西裝背心",
    "suit blazer slung over shoulder": "西裝外套單肩披掛",
    "midi A-line skirt in cream": "奶白A字中長裙",
    "plisse mini skirt": "百褶迷你裙",
    "qipao knee-length": "及膝旗袍",
    "kaftan floor-length": "及地長罩衫",
    "dress floor-length": "及地長裙",
    "trench is outer": "風衣為外層",
    "thin denim jacket": "薄牛仔外套",
    "thin tank": "薄背心",
    "thin cashmere V-neck sweater": "薄喀什米爾V領毛衣",
    "cream cashmere turtleneck": "奶白喀什米爾高領",
    "camel wool wrap coat": "駝色羊毛綁帶大衣",
    "beige knit cardigan": "米色針織開襟衫",
    "pastel yellow knit cardigan over white tank": "淡黃針織開襟衫搭白背心",
    "pastel pink soft cotton blouse with peter pan collar": "粉色棉質彼得潘領上衣",
    "floral print sundress short sleeves": "短袖印花太陽裙",
    "flowy cream blouse": "飄逸奶白上衣",
    "silk blouse with elegant V-neckline": "絲質V領上衣",
    "crisp ivory silk shell top": "象牙白絲質背心上衣",
    "crisp white cotton button-up shirt": "潔白棉質排扣襯衫",
    "crisp white linen button-up": "潔白亞麻排扣襯衫",
    "crisp white button-up shirt": "潔白排扣襯衫",
    "crisp blue linen button-up": "潔淨藍亞麻排扣襯衫",
    "plain ivory cotton button-up": "素色象牙棉排扣衫",
    "plain navy henley": "素色海軍藍亨利衫",
    "plain navy polo": "素色海軍藍Polo",
    "plain athletic tee": "素色運動T",
    "plain black cotton tee fitted": "合身素色黑棉T",
    "plain black cotton tee": "素色黑棉T",
    "plain heather grey cotton tee": "素色雜灰棉T",
    "plain heather grey tee": "素色雜灰T",
    "plain cream organic cotton tee": "素色奶白有機棉T",
    "plain oatmeal organic cotton oversized tee": "素色燕麥色寬鬆有機棉T",
    "plain oatmeal organic cotton tee": "素色燕麥色有機棉T",
    "plain white cotton tee": "素色白棉T",
    "plain white tee": "素色白T",
    "flannel button-down": "法蘭絨排扣衫",
    "flannel plaid shirt": "格紋法蘭絨襯衫",
    "workwear leather jacket": "工作風皮外套",
    "work-wear chore jacket": "工作風工裝外套",
    "waterproof shell jacket": "防水機能外套",
    "silk pajama-style shirt button-down": "絲質排扣睡衣襯衫",
    "silk dressing gown": "絲質晨袍",
    "silk dressing robe": "絲質晨袍",
    "silk camisole": "絲質吊帶背心",
    "silk shirt dress doubles": "絲質襯衫裙兼下裝",
    "silk slip doubles": "絲質吊帶裙兼下裝",
    "silk robe doubles": "絲袍兼下裝",
    "slip dress doubles as bottom": "吊帶裙兼下裝",
    "slip dress doubles": "吊帶裙兼下裝",
    "sundress doubles": "太陽裙兼下裝",
    "wrap dress doubles": "綁帶裙兼下裝",
    "draped sheet doubles": "垂墜布兼下裝",
    "dress doubles": "連身裙兼下裝",
    "cotton drape doubles": "棉布垂墜兼下裝",
    "bathrobe doubles or grey sweatpants": "浴袍兼下裝或灰運動褲",
    "slip dress": "吊帶裙",
    "sports bra": "運動內衣",
    "black sports bra": "黑色運動內衣",
    "black silk wide-leg trousers": "黑色絲質寬褲",
    "black mesh top": "黑色網眼上衣",
    "black thermal": "黑色保暖內搭",
    "khaki shorts": "卡其短褲",
    "distressed black skinny jeans": "做舊黑色緊身牛仔褲",
    
    // ==== wear_state ====
    "well_loved": "穿過",
    "worn_in": "略舊"
};

const STYLE_ARCHETYPE_MAP: Record<string, string> = {
    'feminine_sweet': '甜美少女風格 // SWEET',
    'feminine_mature': '成熟御姐風格 // MATURE',
    'korean_chic': '韓系時髦風格 // KOREAN CHIC',
    'street_edgy': '街頭辣妹風格 // STREET',
    'sporty_active': '運動元氣風格 // SPORTY',
    'vintage_retro': '復古懷舊風格 // VINTAGE',
    'minimalist': '極簡清爽風格 // MINIMAL',
    'tomboy': '率性中性風格 // TOMBOY',
    'masculine_clean': '清爽男友風格 // CLEAN',
    'masculine_rugged': '硬朗戶外風格 // RUGGED',
    'masculine_formal': '都會正裝風格 // FORMAL',
    'feminine_office': '職場精英風格 // OFFICE',
    'dandy_refined': '雅痞紳士風格 // DANDY',
    'cultural_traditional': '文化深蘊風格 // CULTURAL',
    'street_techwear': '街頭機能風格 // TECHWEAR'
};

const WEAR_STATE_MAP: Record<string, { label: string, width: string }> = {
    'barely_worn': { label: '近全新', width: '90%' },
    'styled_daily': { label: '精心日常', width: '70%' },
    'well_loved': { label: '常穿自然', width: '55%' },
    'worn_in': { label: '明顯磨損', width: '20%' }
};

const getOutfitDisplayText = (value: string | null | undefined): string => {
    if (!value) return "---";
    
    // 1. 完全匹配字典
    if (TERM_DICT[value]) return TERM_DICT[value];
    
    // 2. 處理長句拼裝
    let result = value.toLowerCase();
    
    // 依字長排序，先翻長詞
    const sortedKeys = Object.keys(TERM_DICT).sort((a, b) => b.length - a.length);
    const usedTerms: string[] = [];

    for (const key of sortedKeys) {
        if (result.includes(key)) {
            usedTerms.push(TERM_DICT[key]);
            result = result.replace(key, ""); // 移除已匹配部分
        }
    }

    if (usedTerms.length > 0) {
        return usedTerms.join("");
    }
    
    return value;
};

const translateOutfitTerm = (text: string | null | undefined): string => {
    if (!text) return "";
    let result = text;
    // 依字長排序，先翻長詞才不會被短詞先吃掉
    const sortedKeys = Object.keys(TERM_DICT).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        result = result.replace(regex, TERM_DICT[key]);
    }
    return result;
};

interface WardrobeManagerProps {
    model: Model;
    onUpdate: (updates: Partial<Model>) => void;
}

export const WardrobeManager: React.FC<WardrobeManagerProps> = ({ model, onUpdate }) => {
    const { userOutfits, addCustomOutfit, removeCustomOutfit } = useWardrobe();
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState<'all' | 'user' | 'seeds'>('all');
    
    const allOutfits = [...OUTFIT_SEEDS_V2, ...userOutfits].filter(o => 
        o.gender === model.gender?.charAt(0).toUpperCase() || o.gender === 'U'
    );

    const filteredOutfits = viewMode === 'all' ? allOutfits : 
                           viewMode === 'user' ? userOutfits : 
                           OUTFIT_SEEDS_V2.filter(o => o.gender === model.gender?.charAt(0).toUpperCase() || o.gender === 'U');
    
    const [newOutfit, setNewOutfit] = useState<Partial<OutfitV2>>({
        gender: model.gender?.charAt(0).toUpperCase() as any || 'F',
        style_archetype: 'feminine_sweet',
        context_id: 'urban_street',
        aesthetic_tier: 1,
        pillars: {
            layer_inner: '',
            top: '',
            layer_outer: '',
            bottom: '',
            shoes: '',
            accessories: [],
            props: []
        },
        fabric_difficulty: 'safe',
        wear_state: 'well_loved',
        layering_count: 1,
        compatible_contexts: ['urban_street'],
        hand_occupation: {
            left_hand: 'natural',
            right_hand: 'natural',
            both_busy: false
        },
        prompt_skeleton: ''
    });

    const handleSave = () => {
        if (!newOutfit.outfit_id) {
            alert('請輸入穿搭 ID');
            return;
        }
        addCustomOutfit(newOutfit as OutfitV2);
        setShowForm(false);
    };

    const handleSelectOutfit = (outfitId: string) => {
        const currentActive = model.preferences?.active_outfit_id;
        onUpdate({
            preferences: {
                ...model.preferences,
                active_outfit_id: currentActive === outfitId ? null : outfitId
            }
        });
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 bg-[var(--color-gold)] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
                            <h3 className="text-2xl font-black text-[var(--color-text-title)] tracking-[0.3em] uppercase">
                                角色劇組衣櫃 <span className="opacity-30 ml-2 font-light">WARDROBE</span>
                            </h3>
                        </div>
                        <p className="text-[10px] text-[var(--color-gold)] font-bold uppercase tracking-[0.5em] ml-5 italic opacity-70">
                            角色數位資產矩陣 // ENTITY VISUAL ASSETS
                        </p>
                    </div>

                    {/* View Filters */}
                    <div className="flex bg-[var(--color-bg-input)] p-1 rounded-xl w-fit ml-5">
                        {[
                            { id: 'all', label: '全部' },
                            { id: 'seeds', label: '內建資源' },
                            { id: 'user', label: '自定義' }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setViewMode(mode.id as any)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                    viewMode === mode.id 
                                    ? 'bg-[var(--color-gold)] text-black shadow-lg shadow-[var(--color-gold)]/20' 
                                    : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => setShowForm(true)}
                    className="group relative px-8 py-3 overflow-hidden rounded-2xl bg-[var(--color-bg-card)] text-[var(--color-text-main)] border border-[var(--color-border)] font-black text-xs transition-all hover:bg-[var(--color-gold)] hover:text-black hover:border-[var(--color-gold)] active:scale-95 shadow-xl"
                >
                    <span className="relative z-10 uppercase tracking-widest">+ 新增穿搭資產</span>
                </button>
            </motion.div>

            {/* 使用提示橫幅 // USAGE TIPS BANNER */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-5 px-6 py-4 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded-2xl flex items-center gap-4 text-[var(--color-text-main)]"
            >
                <div className="flex-shrink-0 w-6 h-6 rounded-full border border-[var(--color-gold)]/40 flex items-center justify-center text-[10px] font-bold text-[var(--color-gold)]">
                    i
                </div>
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-bold tracking-wide">
                        點擊任一服裝卡片以鎖定為當前生圖目標，再次點擊解除鎖定
                    </p>
                    <p className="text-[9px] opacity-60 font-medium uppercase tracking-wider">
                        Click any outfit card to lock as current generation target. Click again to unlock.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredOutfits.map((outfit, index) => {
                        const isActive = model.preferences?.active_outfit_id === outfit.outfit_id;
                        const isSeed = OUTFIT_SEEDS_V2.some(s => s.outfit_id === outfit.outfit_id);
                        const isCritical = outfit.wear_state === 'worn_in';
                        
                        return (
                            <motion.div
                                key={outfit.outfit_id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.05 }}
                className={`cursor-pointer transition-all duration-500 ${isCritical ? 'grayscale-[0.6] hover:grayscale-0' : ''}`}
                            >
                                <div 
                                    className={`group relative bg-[var(--color-bg-card)] border rounded-[2.5rem] p-8 transition-all shadow-2xl overflow-hidden h-full flex flex-col active:scale-[0.98] cursor-pointer select-none ${
                                        isActive 
                                        ? 'border-[var(--color-gold)] bg-[var(--color-bg-card)] shadow-[0_20px_50px_rgba(212,175,55,0.15)] ring-1 ring-[var(--color-gold)]/30 scale-[1.02]' 
                                        : 'border-[var(--color-border)] hover:border-[var(--color-gold)]/30'
                                    }`}
                                    onClick={() => handleSelectOutfit(outfit.outfit_id)}
                                >
                                    {/* Selection Glow */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 to-transparent pointer-events-none"></div>
                                    )}

                                    {/* Hover Hint: Click to Lock */}
                                    {!isActive && (
                                        <div className="absolute top-6 right-8 opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none">
                                            <span className="text-[9px] font-bold tracking-widest uppercase text-gray-500 leading-none">
                                                點擊鎖定 // CLICK TO LOCK
                                            </span>
                                        </div>
                                    )}
                                    
                                    {!isSeed && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeCustomOutfit(outfit.outfit_id); }}
                                            className="absolute top-6 right-6 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 z-20"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}

                                    <div className="space-y-6 relative z-10 flex-1 pointer-events-none">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--color-gold)] animate-pulse shadow-[0_0_8px_rgba(212,175,55,1)]' : 'bg-[var(--color-bg-input)]'}`}></div>
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{outfit.outfit_id}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`px-3 py-1 bg-[var(--color-bg-input)] border border-[var(--color-border)] text-[9px] font-black rounded-full uppercase tracking-tighter ${isActive ? 'text-[var(--color-gold)]' : 'text-gray-500'}`}>美學階層 // TIER {outfit.aesthetic_tier}</span>
                                                {isSeed && <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold rounded-md uppercase tracking-tighter">系統核心 // CORE</span>}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className={`font-display font-black text-lg tracking-tight leading-none uppercase italic transition-colors ${isActive ? 'text-[var(--color-gold)]' : 'text-[var(--color-text-title)]'}`}>
                                                {STYLE_ARCHETYPE_MAP[outfit.style_archetype] || outfit.style_archetype.replace('_', ' ')}
                                            </h4>
                                            <div className={`h-0.5 w-8 rounded-full transition-all duration-500 ${isActive ? 'bg-[var(--color-gold)] w-16' : 'bg-[var(--color-border)]'}`}></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">上裝 // TOP</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{getOutfitDisplayText(outfit.pillars.top)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">鞋履 // SHOES</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{getOutfitDisplayText(outfit.pillars.shoes)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[8px] tracking-widest">下裝 // BOTTOM</p>
                                                    <p className="text-gray-800 dark:text-white font-medium line-clamp-1">{getOutfitDisplayText(outfit.pillars.bottom)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-gray-600 font-bold uppercase text-[8px] tracking-widest">物理磨損狀態 // CONDITION</p>
                                                        <span className={`text-[8px] font-black uppercase ${
                                                        outfit.wear_state === 'worn_in' ? 'text-red-500' : 'text-[var(--color-gold)]'
                                                        }`}>
                                                            {WEAR_STATE_MAP[outfit.wear_state]?.label || '未知狀態'}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-[var(--color-bg-input)] rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ 
                                                                width: WEAR_STATE_MAP[outfit.wear_state]?.width || '50%'
                                                            }}
                                                            className={`h-full rounded-full ${
                                                                outfit.wear_state === 'worn_in' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-[var(--color-gold)] shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-4 border-t border-[var(--color-border)] flex items-center justify-between pointer-events-none">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                                                isActive 
                                                ? 'bg-[var(--color-gold)] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-pulse' 
                                                : 'bg-[var(--color-bg-input)] text-gray-500'
                                            }`}>
                                                {isActive ? '當前著裝方案 // ACTIVE SCHEME' : '庫存保管中 // IN STORAGE'}
                                            </div>
                                        </div>
                                        <span className="text-[8px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.3em]">
                                            {outfit.gender === 'F' ? '女性模組 // FEMALE' : outfit.gender === 'M' ? '男性模組 // MALE' : '全性別適用 // UNISEX'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-[var(--color-bg-deep)]/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 40 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }} 
                        className="w-full max-w-4xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[3rem] p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    >
                        {/* Background Accents */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/5 blur-[100px] -mr-32 -mt-32"></div>
                        
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-[var(--color-text-title)] tracking-widest uppercase italic">新增矩陣穿搭 <span className="text-[var(--color-gold)]">// Asset Creation</span></h3>
                                <p className="text-[10px] text-gray-500 font-bold tracking-[0.4em] uppercase">配置您的 AI 數位模組視覺組件 // CONFIG COMPONENTS</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 relative z-10 custom-scrollbar max-h-[70vh] overflow-y-auto pr-4">
                            <div className="md:col-span-8 space-y-10">
                                {/* Basic Config Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-3 bg-white/20 rounded-full"></div>
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">基礎識別 (IDENTITY)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="group space-y-2">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest group-focus-within:text-[var(--color-gold)] transition-colors">穿搭編碼 (Outfit UID)</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl px-5 py-3 text-xs text-[var(--color-text-main)] focus:border-[var(--color-gold)]/50 transition-all outline-none"
                                                placeholder="UID_STREET_001"
                                                value={newOutfit.outfit_id || ''}
                                                onChange={e => setNewOutfit({ ...newOutfit, outfit_id: e.target.value })}
                                            />
                                        </div>
                                        <div className="group space-y-2">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">風格原型 (Archetype)</label>
                                            <select 
                                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-2xl px-5 py-3 text-xs text-[var(--color-text-main)] focus:border-[var(--color-gold)]/50 outline-none appearance-none cursor-pointer"
                                                value={newOutfit.style_archetype}
                                                onChange={e => setNewOutfit({ ...newOutfit, style_archetype: e.target.value })}
                                            >
                                                <option value="feminine_sweet">甜美少女風格 // FEMININE SWEET</option>
                                                <option value="feminine_mature">成熟御姐風格 // FEMININE MATURE</option>
                                                <option value="masculine_clean">清爽簡約風格 // MASCULINE CLEAN</option>
                                                <option value="masculine_rugged">硬朗粗獷風格 // MASCULINE RUGGED</option>
                                                <option value="masculine_formal">商務正裝風格 // MASCULINE FORMAL</option>
                                                <option value="tomboy">率性中性風格 // TOMBOY</option>
                                                <option value="minimalist">極簡主義風格 // MINIMALIST</option>
                                                <option value="vintage_retro">復古懷舊風格 // VINTAGE</option>
                                                <option value="street_techwear">街頭機能風格 // TECHWEAR</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Pillars Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-3 bg-white/20 rounded-full"></div>
                                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">穿搭四大支柱 (COMPONENTS)</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { label: '上身單品 (TOP)', key: 'top', placeholder: '例如：寬鬆奶油色針織衫...' },
                                            { label: '下身單品 (BOTTOM)', key: 'bottom', placeholder: '例如：高腰亞麻寬褲...' },
                                            { label: '鞋履配備 (SHOES)', key: 'shoes', placeholder: '例如：極簡皮革涼鞋...' },
                                            { label: '外層疊穿 (OUTER)', key: 'layer_outer', placeholder: '例如：長版絲質長袍...' }
                                        ].map((pillar) => (
                                            <div key={pillar.label} className="group space-y-2">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{pillar.label}</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 text-xs text-white focus:border-[var(--color-gold)]/50 transition-all outline-none"
                                                    placeholder={pillar.placeholder}
                                                    value={(newOutfit.pillars as any)[pillar.key] || ''}
                                                    onChange={e => setNewOutfit({ ...newOutfit, pillars: { ...newOutfit.pillars!, [pillar.key]: e.target.value } })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Physics & Wear Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-3 bg-white/20 rounded-full"></div>
                                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">物理細節：磨損與質地 (PHYSICS)</h4>
                                        </div>
                                        <span className="text-[8px] text-[var(--color-gold)] font-mono animate-pulse tracking-widest">寫實渲染引擎已啟動 // REALISM ENGINE ON</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'barely_worn', label: '幾乎全新・極致平整', desc: '極致正式 // PRISTINE' },
                                            { id: 'well_loved', label: '穿過・自然褶皺', desc: '寫實主義 // WELL LOVED' },
                                            { id: 'worn_in', label: '略舊・明顯磨損', desc: '明顯磨損 // WORN IN' }
                                        ].map(state => (
                                            <motion.button
                                                key={state.id}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={() => setNewOutfit({ ...newOutfit, wear_state: state.id })}
                                                className={`p-5 rounded-[2rem] text-left transition-all border flex flex-col gap-2 ${
                                                    newOutfit.wear_state === state.id 
                                                    ? 'bg-[var(--color-gold)]/[0.08] border-[var(--color-gold)]/40 shadow-[0_10px_25px_rgba(212,175,55,0.1)]' 
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-black tracking-wider ${newOutfit.wear_state === state.id ? 'text-[var(--color-gold)]' : 'text-white'}`}>{state.label}</span>
                                                <span className="text-[8px] text-gray-500 font-bold tracking-widest uppercase">{state.desc}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-4 space-y-10 border-l border-white/5 pl-10">
                                {/* Aesthetic Tier Selector */}
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">美學階層 // AESTHETIC TIER</h4>
                                    <div className="space-y-4">
                                        {[
                                            { id: 1, label: '階層 1：日常 // DAILY', desc: '日常寫實' },
                                            { id: 2, label: '階層 2：流行 // POP', desc: '精緻流行' },
                                            { id: 3, label: '階層 3：攝影 // STUDIO', desc: '商業棚拍' },
                                            { id: 4, label: '階層 4：奢華 // LUXE', desc: '奢華美學' },
                                            { id: 5, label: '階層 5：雜誌 // VOGUE', desc: '雜誌封面' }
                                        ].map(tier => (
                                            <button
                                                key={tier.id}
                                                type="button"
                                                onClick={() => setNewOutfit({ ...newOutfit, aesthetic_tier: tier.id })}
                                                className={`w-full p-4 rounded-2xl text-left transition-all border flex flex-col gap-1 relative overflow-hidden group ${
                                                    newOutfit.aesthetic_tier === tier.id 
                                                    ? 'bg-white/10 border-white/30' 
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-black tracking-widest ${newOutfit.aesthetic_tier === tier.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>{tier.label}</span>
                                                <span className="text-[8px] text-gray-600 font-bold uppercase">{tier.desc}</span>
                                                {newOutfit.aesthetic_tier === tier.id && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full shadow-[0_0_10px_rgba(212,175,55,1)]"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary / Tips */}
                                <div className="p-6 bg-[var(--color-gold)]/[0.03] border border-[var(--color-gold)]/10 rounded-[2rem] space-y-4">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="text-[10px] text-[var(--color-gold)] font-black uppercase tracking-widest">矩陣建議 // TIPS</span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 leading-relaxed font-medium">
                                        {newOutfit.aesthetic_tier && newOutfit.aesthetic_tier >= 4 
                                            ? "高階層穿搭將自動啟動鏡頭光斑與次表面散射模擬，適合正式場合。" 
                                            : "基礎層次將強化自然環境光交互與微小瑕疵，提升角色真實感。"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/5 flex gap-6 relative z-10">
                            <button 
                                onClick={() => setShowForm(false)} 
                                className="flex-1 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all rounded-2xl font-black text-[10px] tracking-widest uppercase border border-white/5 italic"
                            >
                                取消變更 // CANCEL
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="flex-[2] py-4 bg-[var(--color-gold)] hover:bg-[var(--color-gold)]/90 text-black transition-all rounded-2xl font-black text-xs tracking-[0.3em] uppercase shadow-[0_20px_50px_rgba(212,175,55,0.3)] active:scale-[0.98] italic"
                            >
                                儲存衣櫃資產 // SAVE ASSET
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

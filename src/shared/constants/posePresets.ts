export const POSE_PRESETS = [
    { 
        category: '通用 (Universal)', 
        items: [
            { id: 'u_01', name: '自然漫步 (Mid-Stride)', genderTag: '通用', keyword: 'Dynamic walking mid-stride, weight forward, natural arm swing, cinematic movement.' },
            { id: 'u_02', name: '三分之二側身 (3/4 Turn)', genderTag: '通用', keyword: '3/4 body turn, looking at camera, shoulders relaxed, balanced weight distribution.' },
            { id: 'u_03', name: '倚靠立柱 (Column Lean)', genderTag: '通用', keyword: 'Leaning shoulder against a vertical structure, legs crossed at ankles, relaxed hands.' },
            { id: 'u_04', name: '低視角坐姿 (Low Seated)', genderTag: '通用', keyword: 'Sitting on low step, knees apart, elbows resting on thighs, forward leaning torso.' },
            { id: 'u_05', name: '手插口袋 (Hands in Pockets)', genderTag: '通用', keyword: 'Both hands naturally in pockets, straight spine, direct confident gaze.' },
            { id: 'u_06', name: '對角線構圖 (Diagonal Line)', genderTag: '通用', keyword: 'Body angled diagonally, one arm raised touching a surface, creating linear tension.' },
            { id: 'u_07', name: '背對回眸 (Over Shoulder)', genderTag: '通用', keyword: 'Back to camera, head turned 90 degrees over shoulder, expressive eyes.' },
            { id: 'u_08', name: '極簡站姿 (Minimalist Stand)', genderTag: '通用', keyword: 'Symmetrical standing, hands at sides, chin slightly down, stoic expression.' },
            { id: 'u_09', name: '階梯高低腳 (Stair Step)', genderTag: '通用', keyword: 'One foot up on a higher step, hand on knee, creating multi-level geometry.' },
            { id: 'u_10', name: '沉思坐姿 (Contemplative)', genderTag: '通用', keyword: 'Seated on a stool, chin resting on hand, eyes looking away from camera.' },
            { id: 'u_11', name: '向後仰望 (Lean Back)', genderTag: '通用', keyword: 'Weight shifted to back leg, upper body tilted slightly back, open chest posture.' },
            { id: 'u_12', name: '遮陽遠眺 (Sun Shield)', genderTag: '通用', keyword: 'One hand shielding eyes, looking at horizon, profile view, narrative light.' },
            { id: 'u_13', name: '雙臂交叉 (Arms Crossed)', genderTag: '通用', keyword: 'Strong arms crossed over chest, firm stance, steady focus, high presence.' },
            { id: 'u_14', name: '蹲姿抓拍 (Action Crouch)', genderTag: '通用', keyword: 'Low crouch on one knee, fingers grazing the floor, ready to move action.' },
            { id: 'u_15', name: '整理領口 (Adjusting Collar)', genderTag: '通用', keyword: 'Both hands adjusting shirt collar, eyes downcast, focus on hand interaction.' },
            { id: 'u_16', name: '旋轉瞬間 (The Spin)', genderTag: '通用', keyword: 'Captured mid-rotation, fabric showing movement, dynamic torso twist.' },
            { id: 'u_17', name: '天台邊緣 (Ledge Sit)', genderTag: '通用', keyword: 'Sitting on a high ledge, legs dangling, leaning back on palms, airy atmosphere.' },
            { id: 'u_18', name: '手扶後腦 (Head Cradle)', genderTag: '通用', keyword: 'One hand behind head, elbow pointed out, creating triangular composition.' },
            { id: 'u_19', name: '行走回眸 (Walking Turn)', genderTag: '通用', keyword: 'Walking away and suddenly turning head back to camera, spontaneous candid.' },
            { id: 'u_20', name: '禪意盤腿 (Zen Floor)', genderTag: '通用', keyword: 'Sitting cross-legged on floor, straight back, hands resting on knees, serene.' }
        ] 
    },
    { 
        category: '女性 (Female)', 
        items: [
            { id: 'f_01', name: 'Vogue 弧線 (Vogue S-Curve)', genderTag: '女性', keyword: 'Extreme S-curve silhouette, hip popped to side, elegant elongated neck.' },
            { id: 'f_02', name: '指尖輕觸 (Soft Face Touch)', genderTag: '女性', keyword: 'Fingertips lightly grazing the jawline, soft feminine hands, dreamy gaze.' },
            { id: 'f_03', name: '芭蕾延伸 (Balletic Extension)', genderTag: '女性', keyword: 'Full body extension, standing on tiptoes, arms gracefully raised, light as air.' },
            { id: 'f_04', name: '側坐弓背 (Arched Seated)', genderTag: '女性', keyword: 'Sitting sideways, back arched elegantly, knees pulled toward chest.' },
            { id: 'f_05', name: '撥弄長髮 (Hair Play)', genderTag: '女性', keyword: 'One hand running through hair, head tilted, capturing texture and motion.' },
            { id: 'f_06', name: '時尚蹲姿 (Editorial Crouch)', genderTag: '女性', keyword: 'Low crouch with one leg extended to the side, high-fashion tension.' },
            { id: 'f_07', name: '雙手合十 (Prayer Hands)', genderTag: '女性', keyword: 'Hands together near chin, eyes closed, ethereal and spiritual fashion pose.' },
            { id: 'f_08', name: '肩膀微抬 (Shoulder Pop)', genderTag: '女性', keyword: 'One shoulder raised toward ear, playful expression, head tilted opposite.' },
            { id: 'f_09', name: '垂眸凝視 (Downcast Allure)', genderTag: '女性', keyword: 'Body turned away, head looking back and down, long eyelashes emphasized.' },
            { id: 'f_10', name: '優雅跨步 (Elegant Stride)', genderTag: '女性', keyword: 'Wide fashionable step, long leg line, flowing garment physical reaction.' },
            { id: 'f_11', name: '花海漫步 (Field Walk)', genderTag: '女性', keyword: 'Walking through tall grass, hands grazing imaginary flowers, soft lighting.' },
            { id: 'f_12', name: '幾何手架 (Frame Face)', genderTag: '女性', keyword: 'Hands framing the face with elbows out, creating complex upper body shapes.' },
            { id: 'f_13', name: '提裙擺 (Fabric Lift)', genderTag: '女性', keyword: 'Gently lifting the edge of the skirt or coat, showcasing fabric weight.' },
            { id: 'f_14', name: '仰臥伸展 (Reclining Grace)', genderTag: '女性', keyword: 'Lying on a lounge chair, body elongated, arm over head, relaxed elegance.' },
            { id: 'f_15', name: '手扶腰際 (Hands on Waist)', genderTag: '女性', keyword: 'Fingers splayed on high waist, elbows back, emphasizing hour-glass shape.' },
            { id: 'f_16', name: '折骨美學 (Avant-Garde)', genderTag: '女性', keyword: 'Limbs at sharp unusual angles, high-fashion discomfort, striking silhouette.' },
            { id: 'f_17', name: '雨中撐傘 (Umbrella Lean)', genderTag: '女性', keyword: 'Holding an umbrella, leaning head against handle, moody atmospheric pose.' },
            { id: 'f_18', name: '提鞋漫步 (Barefoot Walk)', genderTag: '女性', keyword: 'Holding shoes in one hand, walking barefoot, free-spirited summer vibe.' },
            { id: 'f_19', name: '窗邊凝望 (Window Gaze)', genderTag: '女性', keyword: 'Standing by a window, silhouette lighting, hand on glass, poetic mood.' },
            { id: 'f_20', name: '鏡像對視 (Mirror Reflection)', genderTag: '女性', keyword: 'Looking at reflection, profile and front view visible, symmetrical beauty.' }
        ] 
    },
    { 
        category: '男性 (Male)', 
        items: [
            { id: 'm_01', name: '權力站姿 (Power Stance)', genderTag: '男性', keyword: 'Wide leg stance, hands on hips, broad shoulders, authoritative presence.' },
            { id: 'm_02', name: '整理手錶 (Watch Adjust)', genderTag: '男性', keyword: 'One hand adjusting watch on opposite wrist, focus on cuffs and hands.' },
            { id: 'm_03', name: '下巴輪廓 (Jawline Focus)', genderTag: '男性', keyword: 'Profile view, chin raised, hand touching neck, emphasizing sharp jawline.' },
            { id: 'm_04', name: '背影闊肩 (Back V-Taper)', genderTag: '男性', keyword: 'Facing away, hands in back pockets, emphasizing V-taper back and shoulders.' },
            { id: 'm_05', name: '肩扛外套 (Jacket over Shoulder)', genderTag: '男性', keyword: 'Jacket tossed over one shoulder held by one finger, relaxed walking stride.' },
            { id: 'm_06', name: '沉穩坐姿 (Grounded Sit)', genderTag: '男性', keyword: 'Sitting on bench, legs wide, elbows on knees, hands clasped, solid gaze.' },
            { id: 'm_07', name: '跑酷瞬間 (Parkour Edge)', genderTag: '男性', keyword: 'One hand on a wall, body angled as if jumping, high energy athletic tension.' },
            { id: 'm_08', name: '整理領帶 (Tie Fix)', genderTag: '男性', keyword: 'Both hands at the neck adjusting a tie or collar, sharp focused expression.' },
            { id: 'm_09', name: '思考者 (The Thinker)', genderTag: '男性', keyword: 'Seated on a ledge, one hand on chin, focused intense eyes looking down.' },
            { id: 'm_10', name: '手插背部 (Hands Behind Back)', genderTag: '男性', keyword: 'Standing tall, hands clasced behind back, chest out, disciplined posture.' },
            { id: 'm_11', name: '大步登階 (Forceful Step)', genderTag: '男性', keyword: 'Forceful step up a staircase, muscle tension in legs, upward movement.' },
            { id: 'm_12', name: '拳擊防禦 (Boxer Guard)', genderTag: '男性', keyword: 'Subtle combat guard, fists near chin, intense eyes, athletic readiness.' },
            { id: 'm_13', name: '推眼鏡 (Glasses Adjust)', genderTag: '男性', keyword: 'One finger pushing up glasses, intellectual and sharp fashion look.' },
            { id: 'm_14', name: '慵懶倚牆 (Moody Lean)', genderTag: '男性', keyword: 'Full body lean against wall, one leg bent, looking down, mysterious.' },
            { id: 'm_15', name: '拉開夾克 (Open Jacket)', genderTag: '男性', keyword: 'Hands pulling the lapels of a jacket open, displaying inner garment.' },
            { id: 'm_16', name: '雨傘格擋 (Umbrella Shield)', genderTag: '男性', keyword: 'Holding umbrella low, walking through rain, face partially hidden, film noir.' },
            { id: 'm_17', name: '地面撐手 (Floor Support)', genderTag: '男性', keyword: 'Sitting on ground, one leg flat, one leg bent, leaning back on one arm.' },
            { id: 'm_18', name: '展示袖扣 (Cufflink Check)', genderTag: '男性', keyword: 'Looking down at sleeves, hands interacting, refined gentleman detail.' },
            { id: 'm_19', name: '英式漫步 (London Stride)', genderTag: '男性', keyword: 'Walking with an umbrella as a cane, upright posture, sophisticated urban.' },
            { id: 'm_20', name: '狂放怒吼 (The Shout)', genderTag: '男性', keyword: 'Head back, mouth open, expressive raw emotion, dynamic neck muscles.' }
        ] 
    },
    {
        category: '穿搭展示 (Apparel Focus)',
        items: [
            { id: 'a_01', name: '整理袖口 (Cuff Adjust)', genderTag: '通用', keyword: 'One hand adjusting the cuff of the other sleeve, looking down, focus on hands and wrists.' },
            { id: 'a_02', name: '拉開夾克 (Open Jacket)', genderTag: '通用', keyword: 'Hands pulling the lapels of a jacket open, displaying inner garment and layering.' },
            { id: 'a_03', name: '大幅度跨步 (Wide Stride)', genderTag: '通用', keyword: 'Dynamic wide step forward, showcasing fabric movement and drape of trousers or skirts.' },
            { id: 'a_04', name: '背影回眸 (Back Detail)', genderTag: '通用', keyword: 'Back to camera, head turned back, focusing on back design and silhouette.' },
            { id: 'a_05', name: '整理領口 (Collar Fix)', genderTag: '通用', keyword: 'Both hands adjusting the collar or scarf, looking at camera, focus on neckline.' },
            { id: 'a_06', name: '手插口袋 (Pocket Lean)', genderTag: '通用', keyword: 'One hand in pocket, body slightly angled, emphasizing garment fit and pockets.' },
            { id: 'a_07', name: '展示內裡 (The Reveal)', genderTag: '通用', keyword: 'Gently holding open one side of the coat to show lining and inner texture.' },
            { id: 'a_08', name: '都會通勤 (Urban Commute)', genderTag: '通用', keyword: 'Walking while holding a bag and looking at a watch, showing utility and style.' }
        ]
    },
    {
        category: '社群自拍 (Social Selfie)',
        items: [
            { id: 's_01', name: '單手持機 (One-hand Grip)', genderTag: '通用', keyword: 'Holding smartphone with one hand, arm extended, slight head tilt, natural lifestyle vibe.' },
            { id: 's_02', name: '雙手持機 (Two-hand Grip)', genderTag: '通用', keyword: 'Holding smartphone with both hands, body slightly angled, playful and engaged.' },
            { id: 's_03', name: '鏡面遮臉 (Phone-over-face)', genderTag: '通用', keyword: 'Holding smartphone in front of face while looking at a mirror, focusing on outfit silhouette.' },
            { id: 's_04', name: '撥弄頭髮 (Hair Flip)', genderTag: '通用', keyword: 'One hand running through hair while taking a selfie, dynamic and casual.' },
            { id: 's_05', name: '手比愛心 (Finger Heart)', genderTag: '通用', keyword: 'One hand making a finger heart gesture toward the camera, cute and interactive.' },
            { id: 's_06', name: '輕觸臉頰 (Cheek Touch)', genderTag: '通用', keyword: 'One hand lightly touching the cheek, soft and approachable selfie pose.' },
            { id: 's_07', name: '側身對鏡 (Mirror Side-view)', genderTag: '通用', keyword: 'Standing sideways to a mirror, holding phone, showing side profile of the outfit.' },
            { id: 's_08', name: '坐姿自拍 (Seated Selfie)', genderTag: '通用', keyword: 'Sitting on a couch or chair, holding phone, relaxed and cozy lifestyle shot.' }
        ]
    }
];

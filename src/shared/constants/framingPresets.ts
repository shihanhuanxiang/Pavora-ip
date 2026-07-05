export const FRAMING_PRESETS = [
    {
        category: '標準構圖 (Standard)',
        items: [
            { id: 'f_full', name: '全身遠景 (Full Body)', keyword: 'Full body fashion shot, showing entire silhouette from head to toe, wide angle framing.' },
            { id: 'f_medium', name: '中景半身 (Medium Shot)', keyword: 'Medium shot, waist-up framing, camera cropped at the waist, focusing on upper body and face. The lower body is NOT visible.' },
            { id: 'f_mcu', name: '胸上特寫 (Medium Close-up)', keyword: 'Medium close-up shot, chest-up framing, camera cropped at the chest, focusing on face and neckline details.' },
            { id: 'f_american', name: '牛仔景 (American Shot)', keyword: 'Medium-long shot, from knees up, cinematic framing cropped at the mid-thigh.' },
        ]
    },
    {
        category: '局部特寫 (Close-up)',
        items: [
            { id: 'f_cu_neck', name: '領口肩線 (Neckline)', keyword: 'Close-up on neckline and shoulders, emphasizing tailoring and collar detail.' },
            { id: 'f_cu_cuff', name: '袖口細節 (Cuff Detail)', keyword: 'Close-up on sleeve cuffs and hands, focusing on fabric finish and buttons.' },
            { id: 'f_cu_waist', name: '腰部口袋 (Waist & Pockets)', keyword: 'Close-up on waistline and pockets, showing garment drape and belt details.' },
            { id: 'f_cu_face', name: '臉部特寫 (Face Focus)', keyword: 'Tight portrait shot, focusing on facial expression and makeup.' },
        ]
    },
    {
        category: '極致細節 (Macro)',
        items: [
            { id: 'f_macro_tex', name: '材質微距 (Macro Texture)', keyword: 'Extreme macro shot of fabric texture, showing weave, embroidery, or material grain.' },
            { id: 'f_macro_acc', name: '配件微距 (Accessories)', keyword: 'Macro focus on hardware, zippers, buttons, or jewelry details.' },
        ]
    },
    {
        category: '社群自拍 (Social Selfie)',
        items: [
            { id: 'f_selfie_cu', name: '手持近距離 (Handheld CU)', keyword: 'Handheld smartphone selfie, close-up, high angle, focus on face and neckline, arm extension visible.' },
            { id: 'f_selfie_ms', name: '手持中景 (Handheld MS)', keyword: 'Handheld smartphone selfie, medium shot, waist-up, showing upper body garment, natural arm extension.' },
            { id: 'f_selfie_wide', name: '自拍棒廣角 (Selfie Stick)', keyword: 'Selfie stick wide angle shot. MANDATORY: Show the selfie stick extending from the bottom corner of the frame. POV is from the camera mounted on the stick looking back at the subject. Wide-angle perspective.' },
            { id: 'f_selfie_mirror', name: '全身鏡面 (Mirror Selfie)', keyword: 'Full-body mirror selfie, holding smartphone, phone visible in shot, showing entire outfit in a lifestyle interior.' },
        ]
    }
];

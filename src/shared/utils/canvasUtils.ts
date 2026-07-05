
import { CardAsset, ModelData, FashionItem, FashionLayoutAnalysis, FashionArchitectLayout, FashionArchitectRatio } from '../types/types';
import { imageUrlToimageData } from '../services/geminiService';

// --- A4 300DPI 物理規格 (單位: 像素) ---
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`無法載入圖片: ${src}`));
        img.src = src;
    });
};

/**
 * 物理渲染核心：將 UI 上的邏輯座標按比例轉化為 A4 的物理座標
 */
const drawTransformedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    asset: CardAsset,
    slotX: number, // A4 物理 X
    slotY: number, // A4 物理 Y
    slotW: number, // A4 物理寬
    slotH: number, // A4 物理高
    previewWidth: number // UI 當前預覽區的邏輯寬度 (用於計算 k)
) => {
    ctx.save();
    
    // 1. 設定 A4 物理剪裁區域 (Mask)
    ctx.beginPath();
    ctx.rect(slotX, slotY, slotW, slotH);
    ctx.clip();

    // 2. 計算比例因子 k = 物理像素 / 邏輯像素
    const k = A4_WIDTH / previewWidth;

    // 3. 移動原點至格子的物理中心 (與 CSS transform-origin 同步)
    const centerX = slotX + slotW / 2;
    const centerY = slotY + slotH / 2;
    ctx.translate(centerX, centerY);

    // 4. 套用旋轉
    if (asset.rotation) {
        ctx.rotate((asset.rotation * Math.PI) / 180);
    }

    // 5. 套用位移 (位移量必須乘以 k 才能對齊物理畫布)
    const offsetX = (asset.position?.x || 0) * k;
    const offsetY = (asset.position?.y || 0) * k;
    ctx.translate(offsetX, offsetY);

    // 6. 套用縮放
    // 先計算物體在格子內的基礎 Cover 比例 (背景覆蓋)
    const scaleX = slotW / img.naturalWidth;
    const scaleY = slotH / img.naturalHeight;
    const coverScale = Math.max(scaleX, scaleY);
    
    // 最終縮放 = 基礎 Cover 比例 * 使用者手動縮放值
    const finalScale = coverScale * (asset.scale || 1);
    ctx.scale(finalScale, finalScale);

    // 7. 執行繪製 (以圖片中心為軸心)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
        img, 
        -img.naturalWidth / 2, 
        -img.naturalHeight / 2, 
        img.naturalWidth, 
        img.naturalHeight
    );

    ctx.restore();
};

const getContrastColor = (hexcolor: string) => {
    const hex = hexcolor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 150) ? '#000000' : '#FFFFFF';
};

export const generateCompositeCardImage = async (
    layoutId: string,
    assets: CardAsset[],
    modelData: ModelData,
    options: { themeColor: string; fontTheme: string; orientation: 'portrait' | 'landscape'; previewWidth: number }
): Promise<string> => {
    const canvas = document.createElement('canvas');
    const isPortrait = options.orientation === 'portrait';
    
    canvas.width = isPortrait ? A4_WIDTH : A4_HEIGHT;
    canvas.height = isPortrait ? A4_HEIGHT : A4_WIDTH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("畫布建立失敗");

    // 背景渲染
    ctx.fillStyle = options.themeColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const textColor = getContrastColor(options.themeColor);
    const displayFont = options.fontTheme.includes('Playfair') ? "bold 160px 'Playfair Display', serif" : "bold 160px 'Inter', sans-serif";
    const dataFont = "44px 'Inter', sans-serif";
    
    // 預載入圖片
    const loadedImages = await Promise.all(assets.map(async (asset) => {
        let src = asset.src;
        if (src.startsWith('idb://')) {
            const data = await imageUrlToimageData(src);
            src = `data:${data.mimeType};base64,${data.data}`;
        }
        try {
            const img = await loadImage(src);
            return { ...asset, imgObj: img };
        } catch (e) { return null; }
    }));

    const W = canvas.width;
    const H = canvas.height;
    const P = 80; // A4 物理邊距
    const G = 40; // 格子間隙

    const drawSlot = (index: number, sx: number, sy: number, sw: number, sh: number) => {
        const asset = loadedImages[index];
        if (asset && asset.imgObj) {
            drawTransformedImage(ctx, asset.imgObj, asset, sx, sy, sw, sh, options.previewWidth);
        } else {
            ctx.fillStyle = textColor === '#000000' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
            ctx.fillRect(sx, sy, sw, sh);
        }
    };

    const drawModelStats = (sx: number, sy: number, width: number) => {
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.font = displayFont;
        ctx.fillText(modelData.name.toUpperCase(), sx, sy);

        ctx.font = dataFont;
        const infoStartY = sy + 100;
        const lineH = 70;
        const colW = width / 2;

        ctx.fillText(`身高: ${modelData.stats.height}CM`, sx, infoStartY);
        ctx.fillText(`胸圍: ${modelData.stats.bust}`, sx, infoStartY + lineH);
        ctx.fillText(`腰圍: ${modelData.stats.waist}`, sx, infoStartY + lineH * 2);
        ctx.fillText(`臀圍: ${modelData.stats.hip}`, sx, infoStartY + lineH * 3);

        ctx.fillText(`髮色: ${modelData.stats.hair.toUpperCase()}`, sx + colW, infoStartY);
        ctx.fillText(`眼色: ${modelData.stats.eyes.toUpperCase()}`, sx + colW, infoStartY + lineH);
        
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(sx, infoStartY + lineH * 4 + 30, 160, 12);
    };

    // --- 佈局繪製 ---
    if (layoutId === 'pro-a4-hero') {
        const colW = (W - 2 * P - 3 * G) / 4;
        const rowH = (H - 2 * P - 5 * G) / 6;
        drawSlot(0, P, P, colW * 3 + 2 * G, rowH * 5 + 4 * G);
        drawSlot(1, P + colW * 3 + 3 * G, P, colW, rowH * 2 + G);
        drawSlot(2, P + colW * 3 + 3 * G, P + rowH * 2 + 2 * G, colW, rowH * 2 + G);
        drawSlot(3, P + colW * 3 + 3 * G, P + rowH * 4 + 4 * G, colW, rowH + G);
        drawModelStats(P + 20, H - P - 240, colW * 3);
    } else if (layoutId === 'pro-a4-classic') {
        const colW = (W - 2 * P - G) / 2;
        const rowH = (H - 2 * P - 3 * G) / 4;
        drawSlot(0, P, P, colW, rowH * 3 + G * 2);
        drawSlot(1, P + colW + G, P, colW, rowH);
        drawSlot(2, P + colW + G, P + rowH + G, colW, rowH);
        drawSlot(3, P + colW + G, P + (rowH + G) * 2, colW, rowH);
        drawModelStats(P + 20, H - P - 280, W - 2 * P);
    } else if (layoutId === 'pro-a4-casting') {
        const sideW = (W - 2 * P - G) * 0.35;
        const mainW = (W - 2 * P - G) * 0.65;
        for(let i=0; i<6; i++) {
            const cy = P + i * (H * 0.13);
            drawSlot(i + 1, P, cy, sideW, H * 0.12);
        }
        drawSlot(0, P + sideW + G, P, mainW, H * 0.7);
        drawModelStats(P + sideW + G + 20, H - P - 280, mainW);
    } else if (layoutId === 'pro-a4-avant-garde') {
        const splitW = (W - 2 * P - G) / 2;
        drawSlot(0, P, P, splitW, H - 2 * P);
        drawSlot(1, P + splitW + G, P, splitW, H - 2 * P);
        drawModelStats(P + splitW + G + 60, H - 480, splitW - 120);
    } else if (layoutId === 'pro-a4-minimal') {
        const topH = H * 0.65;
        drawSlot(0, P, P, (W - 2 * P - G) / 2, topH);
        drawSlot(1, P + (W - 2 * P - G) / 2 + G, P, (W - 2 * P - G) / 2, topH);
        drawModelStats(P + 20, topH + P + 180, W - 2 * P);
        const subW = (W - 2 * P - 2 * G) / 3;
        const subY = topH + P + 420;
        const subH = H - subY - P;
        for(let i=0; i<3; i++) { drawSlot(i + 2, P + i*(subW+G), subY, subW, subH); }
    } else {
        const mainW = (W - 2 * P - G) * 0.618;
        const sideW = (W - 2 * P - G) * 0.382;
        drawSlot(0, P, P, mainW, mainW * 1.4);
        drawSlot(1, P + mainW + G, P, sideW, sideW * 1.2);
        drawSlot(2, P + mainW + G, P + sideW * 1.2 + G, sideW, sideW * 1.2);
        drawModelStats(P + 20, P + mainW * 1.4 + G + 150, mainW);
        drawSlot(3, P + mainW + G, P + (sideW * 1.2 + G) * 2, sideW, H - 2 * P - (sideW * 1.2 + G) * 2);
    }

    return canvas.toDataURL('image/jpeg', 0.98);
};

export const generateFashionArchitectImage = async (
    personImage: string,
    items: FashionItem[],
    layout: FashionLayoutAnalysis | null,
    title: string,
    notes: string,
    resolution: 'HD' | '2K' | '4K',
    mood: 'AUTO' | 'MINIMAL' | 'CYBER' | 'ORGANIC' = 'AUTO',
    layoutType: FashionArchitectLayout = 'CLASSIC',
    ratio: FashionArchitectRatio = 'A4'
): Promise<string> => {
    const canvas = document.createElement('canvas');
    
    // 根據解析度設定畫布大小
    let scaleFactor = 1;
    if (resolution === '2K') scaleFactor = 1.5;
    if (resolution === '4K') scaleFactor = 2;

    const baseW = 1200;
    let baseH = 1697; // A4 default
    if (ratio === '9:16') baseH = 2133;
    if (ratio === '4:5') baseH = 1500;
    if (ratio === '1:1') baseH = 1200;

    const W = baseW * scaleFactor;
    const H = baseH * scaleFactor;
    const P = 60 * scaleFactor; // Padding
    const G = 40 * scaleFactor; // Gap
    const headerH = 180 * scaleFactor;
    const footerH = 200 * scaleFactor;
    
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("畫布建立失敗");

    // 顏色與字體設定
    const MOOD_CONFIGS = {
        AUTO: { bg: layout?.backgroundColor || '#ffffff', text: layout?.fontColor || '#000000', accent: layout?.accentColor || '#888888', font: "'Playfair Display', serif" },
        MINIMAL: { bg: '#FDFCF8', text: '#1A1A1A', accent: '#A68B5B', font: "'Playfair Display', serif" },
        CYBER: { bg: '#050505', text: '#FFFFFF', accent: '#00FF00', font: "'Inter', sans-serif" },
        ORGANIC: { bg: '#F5F2E9', text: '#5A5A40', accent: '#8B7E66', font: "'Playfair Display', serif" }
    };

    const currentMood = MOOD_CONFIGS[mood];
    const themeBg = currentMood.bg;
    const themeText = currentMood.text;
    const themeAccent = currentMood.accent;
    const themeFont = currentMood.font;

    // 1. 背景
    ctx.fillStyle = themeBg;
    ctx.fillRect(0, 0, W, H);

    // 2. 預載入圖片
    const bodyImg = await loadImage(personImage);
    const itemImgs = await Promise.all(items.map(async (item) => {
        if (!item.processedUrl) return null;
        return { img: await loadImage(item.processedUrl), name: item.name };
    }));
    const macroImgs = await Promise.all(items.slice(0, 6).map(async (item) => {
        if (!item.macroUrl) return null;
        return { img: await loadImage(item.macroUrl), name: item.name };
    }));

    // 3. Vertical Rails
    ctx.save();
    ctx.fillStyle = themeText;
    ctx.globalAlpha = 0.3;
    ctx.font = `${10 * scaleFactor}px 'Inter', sans-serif`;
    ctx.letterSpacing = `${5 * scaleFactor}px`;
    
    // Left Rail
    ctx.translate(25 * scaleFactor, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`PAVORA ARCHITECT ENGINE // SYSTEM ACTIVE // ${new Date().toISOString().split('T')[0]}`, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = themeText;
    ctx.globalAlpha = 0.3;
    ctx.font = `${10 * scaleFactor}px 'Inter', sans-serif`;
    ctx.letterSpacing = `${5 * scaleFactor}px`;
    ctx.textAlign = 'right';
    
    // Right Rail
    ctx.translate(W - 25 * scaleFactor, H / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(`SUBJECT: ${title.toUpperCase()} // LAYOUT: ${layoutType} // RATIO: ${ratio}`, 0, 0);
    ctx.restore();

    // 4. Header
    ctx.fillStyle = themeText;
    ctx.font = `900 ${60 * scaleFactor}px ${themeFont}`;
    ctx.fillText(title.toUpperCase(), P, P + 60 * scaleFactor);
    
    ctx.fillStyle = themeAccent;
    ctx.font = `300 ${20 * scaleFactor}px ${themeFont}`;
    ctx.fillText("Wardrobe Deconstruction & Style Profile".toUpperCase(), P, P + 100 * scaleFactor);

    ctx.strokeStyle = themeText;
    ctx.lineWidth = 2 * scaleFactor;
    ctx.beginPath();
    ctx.moveTo(P, P + 130 * scaleFactor);
    ctx.lineTo(W - P, P + 130 * scaleFactor);
    ctx.stroke();

    const contentStartY = P + 180 * scaleFactor;
    const contentAreaH = H - contentStartY - footerH - 100 * scaleFactor;

    const drawImageInRect = (img: HTMLImageElement, x: number, y: number, w: number, h: number, fit: 'cover' | 'contain' = 'cover', shadow: boolean = false) => {
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const areaRatio = w / h;
        let dw, dh, dx, dy;
        
        if (fit === 'cover') {
            if (imgRatio > areaRatio) {
                dh = h; dw = h * imgRatio; dx = (w - dw) / 2; dy = 0;
            } else {
                dw = w; dh = w / imgRatio; dx = 0; dy = (h - dh) / 2;
            }
        } else {
            if (imgRatio > areaRatio) {
                dw = w; dh = w / imgRatio; dx = 0; dy = (h - dh) / 2;
            } else {
                dh = h; dw = h * imgRatio; dx = (w - dw) / 2; dy = 0;
            }
        }
        
        ctx.save();
        
        // Apply Ambient Tone Sync if layout info exists
        if (layout?.lighting?.temperature) {
            const temp = layout.lighting.temperature.toLowerCase();
            if (temp.includes('warm')) {
                ctx.filter = 'sepia(0.2) saturate(1.1)';
            } else if (temp.includes('cool') || temp.includes('blue')) {
                ctx.filter = 'hue-rotate(10deg) saturate(0.9) brightness(1.05)';
            }
        }

        if (shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 15 * scaleFactor;
            ctx.shadowOffsetX = 5 * scaleFactor;
            ctx.shadowOffsetY = 10 * scaleFactor;
        }

        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        ctx.drawImage(img, x + dx, y + dy, dw, dh);
        ctx.restore();
    };

    // 5. Main Content Layouts
    const drawGuideline = (startX: number, startY: number, endX: number, endY: number) => {
        ctx.save();
        ctx.strokeStyle = themeAccent;
        ctx.setLineDash([5 * scaleFactor, 5 * scaleFactor]);
        ctx.lineWidth = 1 * scaleFactor;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw small dot at anchor
        ctx.beginPath();
        ctx.arc(endX, endY, 3 * scaleFactor, 0, Math.PI * 2);
        ctx.fillStyle = themeAccent;
        ctx.fill();
        ctx.restore();
    };

    const getAnchorPos = (anchorIdx: number, mainX: number, mainY: number, mainW: number, mainH: number) => {
        if (!layout?.itemAnchors || !layout.itemAnchors[anchorIdx]) return null;
        const anchor = layout.itemAnchors[anchorIdx];
        return {
            x: mainX + (anchor.x / 100) * mainW,
            y: mainY + (anchor.y / 100) * mainH
        };
    };

    if (layoutType === 'AVANT_GARDE') {
        const mainW = W - 2 * P;
        const mainH = contentAreaH * 0.6;
        drawImageInRect(bodyImg, P, contentStartY, mainW, mainH);
        
        const gridY = contentStartY + mainH + G;
        const gridW = (W - 2 * P - 2 * G) / 3;
        const gridH = (contentAreaH - mainH - G);
        
        itemImgs.forEach((item, i) => {
            if (!item || i >= 3) return;
            const ix = P + i * (gridW + G);
            drawImageInRect(item.img, ix, gridY, gridW, gridH, 'contain', true);
            
            // Guideline
            const anchor = getAnchorPos(i, P, contentStartY, mainW, mainH);
            if (anchor) {
                drawGuideline(ix + gridW / 2, gridY, anchor.x, anchor.y);
            }

            ctx.fillStyle = themeText;
            ctx.font = `bold ${14 * scaleFactor}px 'Inter', sans-serif`;
            ctx.fillText(item.name.toUpperCase(), ix, gridY + gridH + 20 * scaleFactor);
        });
    } else if (layoutType === 'TRIPTYCH') {
        const sideW = (W - 2 * P - 2 * G) / 4;
        const mainW = (W - 2 * P - 2 * G) / 2;
        const mainX = P + sideW + G;
        
        // Center Main
        drawImageInRect(bodyImg, mainX, contentStartY, mainW, contentAreaH);

        // Left items
        const leftItems = itemImgs.slice(0, Math.ceil(itemImgs.length / 2));
        const itemH = (contentAreaH - (leftItems.length - 1) * G) / leftItems.length;
        leftItems.forEach((item, i) => {
            if (!item) return;
            const ix = P;
            const iy = contentStartY + i * (itemH + G);
            drawImageInRect(item.img, ix, iy, sideW, itemH, 'contain', true);
            
            const anchor = getAnchorPos(i, mainX, contentStartY, mainW, contentAreaH);
            if (anchor) drawGuideline(ix + sideW, iy + itemH / 2, anchor.x, anchor.y);
        });

        // Right items
        const rightItems = itemImgs.slice(Math.ceil(itemImgs.length / 2));
        const rItemH = (contentAreaH - (rightItems.length - 1) * G) / rightItems.length;
        rightItems.forEach((item, i) => {
            if (!item) return;
            const ix = P + sideW + mainW + 2 * G;
            const iy = contentStartY + i * (rItemH + G);
            drawImageInRect(item.img, ix, iy, sideW, rItemH, 'contain', true);
            
            const anchor = getAnchorPos(i + leftItems.length, mainX, contentStartY, mainW, contentAreaH);
            if (anchor) drawGuideline(ix, iy + rItemH / 2, anchor.x, anchor.y);
        });
    } else if (layoutType === 'L_FRAME') {
        const mainW = (W - 2 * P - G) * 0.66;
        const mainH = contentAreaH * 0.66;
        drawImageInRect(bodyImg, P, contentStartY, mainW, mainH);

        // Right column
        const rightW = W - 2 * P - G - mainW;
        const rItems = itemImgs.slice(0, 2);
        const rItemH = (mainH - G) / 2;
        rItems.forEach((item, i) => {
            if (!item) return;
            const ix = P + mainW + G;
            const iy = contentStartY + i * (rItemH + G);
            drawImageInRect(item.img, ix, iy, rightW, rItemH, 'contain', true);
            
            const anchor = getAnchorPos(i, P, contentStartY, mainW, mainH);
            if (anchor) drawGuideline(ix, iy + rItemH / 2, anchor.x, anchor.y);
        });

        // Bottom row
        const bItems = itemImgs.slice(2, 6);
        const bW = (W - 2 * P - (bItems.length - 1) * G) / bItems.length;
        const bH = contentAreaH - mainH - G;
        bItems.forEach((item, i) => {
            if (!item) return;
            const ix = P + i * (bW + G);
            const iy = contentStartY + mainH + G;
            drawImageInRect(item.img, ix, iy, bW, bH, 'contain', true);
            
            const anchor = getAnchorPos(i + 2, P, contentStartY, mainW, mainH);
            if (anchor) drawGuideline(ix + bW / 2, iy, anchor.x, anchor.y);
        });
    } else if (layoutType === 'STEPPED') {
        const mainW = (W - 2 * P - G) * 0.6;
        drawImageInRect(bodyImg, P, contentStartY, mainW, contentAreaH);

        const sideW = W - 2 * P - G - mainW;
        const sItems = itemImgs.slice(0, 4);
        const sItemH = (contentAreaH - 3 * G) / 4;
        sItems.forEach((item, i) => {
            if (!item) return;
            const offset = i % 2 === 0 ? 0 : 20 * scaleFactor;
            const ix = P + mainW + G + offset;
            const iy = contentStartY + i * (sItemH + G);
            drawImageInRect(item.img, ix, iy, sideW - offset, sItemH, 'contain', true);
            
            const anchor = getAnchorPos(i, P, contentStartY, mainW, contentAreaH);
            if (anchor) drawGuideline(ix, iy + sItemH / 2, anchor.x, anchor.y);
        });
    } else {
        // CLASSIC or MODERN
        const mainAreaW = (W - 2 * P - G) * 0.6;
        const sideAreaW = (W - 2 * P - G) * 0.4;
        const isModern = layoutType === 'MODERN';
        
        const mainX = isModern ? P + sideAreaW + G : P;
        const sideX = isModern ? P : P + mainAreaW + G;

        drawImageInRect(bodyImg, mainX, contentStartY, mainAreaW, contentAreaH);

        const sItems = itemImgs.slice(0, 3);
        const sItemH = (contentAreaH - 2 * G) / 3;
        sItems.forEach((item, i) => {
            if (!item) return;
            const iy = contentStartY + i * (sItemH + G);
            drawImageInRect(item.img, sideX, iy, sideAreaW, sItemH, 'contain', true);
            
            const anchor = getAnchorPos(i, mainX, contentStartY, mainAreaW, contentAreaH);
            if (anchor) {
                const startX = isModern ? sideX + sideAreaW : sideX;
                drawGuideline(startX, iy + sItemH / 2, anchor.x, anchor.y);
            }
        });
    }

    // 6. Macro Gallery & Color Palette
    const macroAreaY = H - footerH - 100 * scaleFactor;
    ctx.strokeStyle = themeText;
    ctx.lineWidth = 2 * scaleFactor;
    ctx.beginPath(); ctx.moveTo(P, macroAreaY); ctx.lineTo(W - P, macroAreaY); ctx.stroke();

    // Metadata Tags (Left side of footer)
    ctx.fillStyle = themeAccent;
    ctx.font = `bold ${14 * scaleFactor}px 'Inter', sans-serif`;
    ctx.fillText("02 // MATERIAL & TEXTURE STUDY", P, macroAreaY + 40 * scaleFactor);

    // Color Palette (Right side of footer)
    if (layout?.colorPalette) {
        const paletteX = W - P;
        const swatchSize = 24 * scaleFactor;
        const swatchGap = 8 * scaleFactor;
        ctx.textAlign = 'right';
        ctx.font = `bold ${10 * scaleFactor}px 'Inter', sans-serif`;
        ctx.fillText("COLOR PALETTE", paletteX, macroAreaY + 30 * scaleFactor);
        
        layout.colorPalette.forEach((color, i) => {
            const cx = paletteX - (layout.colorPalette!.length - i) * (swatchSize + swatchGap);
            const cy = macroAreaY + 45 * scaleFactor;
            ctx.fillStyle = color.hex;
            ctx.beginPath();
            ctx.arc(cx + swatchSize/2, cy + swatchSize/2, swatchSize/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = themeText;
            ctx.lineWidth = 1 * scaleFactor;
            ctx.stroke();
        });
        ctx.textAlign = 'left'; // Reset
    }

    const macroW = (W - 2 * P - 5 * G) / 6;
    const macroH = 120 * scaleFactor;
    macroImgs.forEach((item, i) => {
        if (!item) return;
        const mx = P + i * (macroW + G);
        const my = macroAreaY + 80 * scaleFactor;
        drawImageInRect(item.img, mx, my, macroW, macroH, 'cover', true);
        
        ctx.fillStyle = themeText;
        ctx.font = `bold ${8 * scaleFactor}px 'Inter', sans-serif`;
        ctx.fillText(item.name.toUpperCase(), mx, my + macroH + 15 * scaleFactor);
    });

    // 7. Final Branding & Metadata
    const finalY = H - 40 * scaleFactor;
    
    // Technical Metadata (Left)
    ctx.fillStyle = themeAccent;
    ctx.font = `500 ${10 * scaleFactor}px 'Inter', sans-serif`;
    const lightingInfo = layout?.lighting ? `LIGHT: ${layout.lighting.direction.toUpperCase()} / ${layout.lighting.temperature.toUpperCase()}` : "LIGHT: NATURAL / NEUTRAL";
    ctx.fillText(`${lightingInfo} // ISO: 100 // LENS: 35MM F1.4`, P, finalY);

    ctx.textAlign = 'right';
    ctx.fillStyle = themeText;
    ctx.font = `bold ${14 * scaleFactor}px ${themeFont}`;
    ctx.fillText("PAVORA AI STUDIO", W - P, finalY);
    ctx.fillStyle = themeAccent;
    ctx.font = `${10 * scaleFactor}px ${themeFont}`;
    ctx.fillText("Fashion Visual Architect Engine // System Online", W - P, finalY + 20 * scaleFactor);

    // 8. Style Transfer: Film Grain Overlay
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.05;
    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = 128;
    grainCanvas.height = 128;
    const gCtx = grainCanvas.getContext('2d')!;
    const gData = gCtx.createImageData(128, 128);
    for (let i = 0; i < gData.data.length; i += 4) {
        const val = Math.random() * 255;
        gData.data[i] = val;
        gData.data[i+1] = val;
        gData.data[i+2] = val;
        gData.data[i+3] = 255;
    }
    gCtx.putImageData(gData, 0, 0);
    const pattern = ctx.createPattern(grainCanvas, 'repeat');
    if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
};

// Helper for dynamic height
const footerSectionH = (sf: number, macroH: number) => {
    return 120 * sf + 40 * sf + 70 * sf + macroH + 150 * sf;
};

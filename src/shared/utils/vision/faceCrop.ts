import { getGeminiClient } from "../../services/core/geminiClient";

/**
 * 輔助函數：從 AI 回傳的字串中提取純 JSON 內容
 */
function extractJson(text: string) {
    try {
        // 移除 Markdown 的程式碼塊標籤
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        // 尋找第一個 { 和最後一個 } 之間的內容
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            return JSON.parse(cleanText.substring(start, end + 1));
        }
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Extraction failed for:", text);
        throw e;
    }
}

/**
 * 使用 Gemini AI 進行臉部偵測並裁剪
 * 回傳裁剪後的臉部 Base64 數據
 */
export async function autoFaceCrop(imageData: { data: string, mimeType: string }): Promise<{ data: string, mimeType: string }> {
    const client = await getGeminiClient(false);
    
    // 步驟 1: 詢問 AI 臉部的邊界框 (Bounding Box)
    const prompt = `Analyze this fashion model image. Find the bounding box of the person's face. 
    Return strictly a JSON object ONLY: { "ymin": number, "xmin": number, "ymax": number, "xmax": number }. 
    Coordinates should be 0-1000. Give some padding around the head. Do not include any other text or explanation.`;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ inlineData: imageData }, { text: prompt }] },
            config: { 
                temperature: 0,
                responseMimeType: 'application/json' 
            }
        });

        const box = extractJson(response.text || '{"ymin":0,"xmin":0,"ymax":1000,"xmax":1000}');

        // 步驟 2: 在畫布上執行裁剪
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Canvas context failed"));

                const w = img.naturalWidth;
                const h = img.naturalHeight;

                // 轉換 0-1000 坐標到實際像素
                let left = (box.xmin / 1000) * w;
                let top = (box.ymin / 1000) * h;
                let width = ((box.xmax - box.xmin) / 1000) * w;
                let height = ((box.ymax - box.ymin) / 1000) * h;

                // 確保數值合法
                width = Math.max(width, 10);
                height = Math.max(height, 10);

                // 裁剪為正方形以適配臉部錨點
                const size = Math.max(width, height);
                canvas.width = size;
                canvas.height = size;

                // 居中繪製（考慮到 padding 補償）
                ctx.fillStyle = "#FFFFFF"; // 如果超出邊界用白色填充
                ctx.fillRect(0, 0, size, size);
                
                ctx.drawImage(
                    img, 
                    left - (size - width) / 2, 
                    top - (size - height) / 2, 
                    size, size, 
                    0, 0, size, size
                );

                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                resolve({
                    data: dataUrl.split(',')[1],
                    mimeType: 'image/jpeg'
                });
            };
            img.onerror = () => reject(new Error("Image load failed"));
            img.src = `data:${imageData.mimeType};base64,${imageData.data}`;
        });
    } catch (err) {
        console.error("AI Face Crop Service Error:", err);
        // 如果失敗，回傳一個最小預設值以防止 UI 崩潰
        return imageData;
    }
}
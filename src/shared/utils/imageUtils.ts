
import { imageDB } from '../services/imageDB';
import { savePortfolioItem } from '../services/storageService';

// Helper: File to Base64
export const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const match = result.match(/^data:(.+);base64,(.*)$/);
      if (match) {
        resolve({ mimeType: match[1], data: match[2] });
      } else {
        reject(new Error("Invalid file data"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * FIX: Added missing exported member getFriendlyErrorMessage
 * Converts technical AI errors into user-friendly localized messages.
 */
export const getFriendlyErrorMessage = (error: any): string => {
    const msg = String(error?.message || error || 'Unknown error');
    
    // Ignore environment noise
    if (msg.includes('websocket') || msg.includes('WebSocket') || msg.includes('HMR')) {
        console.warn("Filtered environment noise:", msg);
        return ''; 
    }
    
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) return 'API 配額已用盡，請稍後再試或更換金鑰。';
    if (msg.includes('safety')) return '生成的內容可能不符合安全規範，請嘗試修改提示詞。';
    if (msg.includes('API key')) return 'API 金鑰無效或未設定，請檢查設定。';
    return `發生錯誤：${msg}`;
};

// Helper: Image URL to ImageData (Smart handling for IDB, DataURL, and Http)
export const imageUrlToimageData = async (url: string): Promise<{ data: string; mimeType: string }> => {
  if (!url) throw new Error("Url is empty");

  // Case 1: IndexedDB URL
  if (url.startsWith('idb://')) {
      const blob = await imageDB.get(url);
      if (!blob) throw new Error(`Image not found in DB: ${url}`);
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64data = reader.result as string;
              const match = base64data.match(/^data:(.+);base64,(.*)$/);
              if (match) resolve({ mimeType: match[1], data: match[2] });
              else reject(new Error("Blob conversion failed"));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
  }

  // Case 2: Data URL
  if (url.startsWith('data:')) {
      const match = url.match(/^data:(.+);base64,(.*)$/);
      if (match) return { mimeType: match[1], data: match[2] };
  }

  // Case 3: Standard URL (Http/Https/Blob)
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
      // Fix: Declared reader before its usage in onloadend to avoid temporal dead zone error
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64data = reader.result as string;
          const match = base64data.match(/^data:(.+);base64,(.*)$/);
          if (match) resolve({ mimeType: match[1], data: match[2] });
          else reject(new Error("Conversion failed"));
      };
      reader.readAsDataURL(blob);
  });
};

// Helper: Download Image (Handles IDB urls and Gemini API urls)
export const downloadImage = async (url: string, filename: string, sourceModule?: string) => {
    try {
        // Auto-save to portfolio removed as per user request to decouple download and save
        let downloadUrl = url;
        let objectUrlToRevoke = null;

        // Case 1: IndexedDB URL
        if (url.startsWith('idb://')) {
            const blob = await imageDB.get(url);
            if (blob) {
                downloadUrl = URL.createObjectURL(blob);
                objectUrlToRevoke = downloadUrl;
            } else {
                console.error("Image not found in DB for download");
                return;
            }
        } 
        // Case 2: Gemini API Video URL (requires API Key header)
        else if (url.includes('generativelanguage.googleapis.com') && !url.includes('data:')) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'x-goog-api-key': process.env.API_KEY || ''
                    }
                });
                if (response.ok) {
                    const blob = await response.blob();
                    downloadUrl = URL.createObjectURL(blob);
                    objectUrlToRevoke = downloadUrl;
                } else {
                    const errorText = await response.text();
                    console.error("Gemini API download failed:", errorText);
                    // If it failed, we might still try the direct link, but it will likely fail with 403
                }
            } catch (fetchError) {
                console.error("Fetch error for Gemini API asset:", fetchError);
            }
        }

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (objectUrlToRevoke) {
            // Give it some time for the browser to start the download
            setTimeout(() => URL.revokeObjectURL(objectUrlToRevoke!), 1000);
        }
    } catch (e) {
        console.error("Download failed:", e);
    }
};

/**
 * Helper: Strictly fit image to Aspect Ratio with Padding (Letterbox/Pillarbox).
 * This prevents the Veo model from squashing/stretching non-standard aspect ratios.
 * 
 * Target Resolutions:
 * 16:9 -> 1280x720
 * 9:16 -> 720x1280
 */
export const fitImageToAspectRatio = async (
    imageData: { data: string; mimeType: string },
    targetRatio: '16:9' | '9:16' | '1:1',
    fillColor: string = '#000000'
): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            
            // Define strict target dimensions based on Veo requirements
            // 720p is the standard for Veo previews
            let targetW, targetH;
            
            if (targetRatio === '16:9') {
                targetW = 1280;
                targetH = 720;
            } else if (targetRatio === '9:16') {
                targetW = 720;
                targetH = 1280;
            } else {
                // 1:1
                targetW = 720;
                targetH = 720;
            }

            canvas.width = targetW;
            canvas.height = targetH;
            
            const ctx = canvas.getContext('2d');
            if(!ctx) { reject(new Error("Canvas error")); return; }

            // 1. Fill background (Padding)
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Calculate scaling to CONTAIN the image within target dimensions
            const imgAspect = img.naturalWidth / img.naturalHeight;
            const targetAspect = targetW / targetH;
            
            let drawW, drawH, drawX, drawY;

            if (imgAspect > targetAspect) {
                // Image is wider than target (e.g. Ultra-wide on 16:9)
                // Fit to Width
                drawW = targetW;
                drawH = targetW / imgAspect;
                drawX = 0;
                drawY = (targetH - drawH) / 2;
            } else {
                // Image is taller than target (e.g. 4:5 on 16:9)
                // Fit to Height
                drawH = targetH;
                drawW = targetH * imgAspect;
                drawY = 0;
                drawX = (targetW - drawW) / 2;
            }

            // 3. Draw image centered
            // Enable high quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            const dataUrl = canvas.toDataURL(imageData.mimeType === 'image/png' ? 'image/png' : 'image/jpeg', 0.95);
            const base64 = dataUrl.split(',')[1];
            resolve({ data: base64, mimeType: imageData.mimeType });
        };
        img.onerror = () => reject(new Error("Failed to load image for resizing"));
        img.src = `data:${imageData.mimeType};base64,${imageData.data}`;
    });
};

/**
 * Helper: Crop image based on normalized coordinates [ymin, xmin, ymax, xmax] (0-1000)
 */
export const cropImage = async (
    imageData: { data: string; mimeType: string },
    box: [number, number, number, number]
): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const [ymin, xmin, ymax, xmax] = box;
            
            const left = (xmin / 1000) * img.naturalWidth;
            const top = (ymin / 1000) * img.naturalHeight;
            const width = ((xmax - xmin) / 1000) * img.naturalWidth;
            const height = ((ymax - ymin) / 1000) * img.naturalHeight;

            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if(!ctx) { reject(new Error("Canvas error")); return; }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, left, top, width, height, 0, 0, width, height);

            const dataUrl = canvas.toDataURL(imageData.mimeType === 'image/png' ? 'image/png' : 'image/jpeg', 0.95);
            const base64 = dataUrl.split(',')[1];
            resolve({ data: base64, mimeType: imageData.mimeType });
        };
        img.onerror = () => reject(new Error("Failed to load image for cropping"));
        img.src = `data:${imageData.mimeType};base64,${imageData.data}`;
    });
};

/**
 * Helper: Stitch multiple images into a single matrix image
 */
export const stitchImages = async (
    imageUrls: string[],
    layout: '2x2' | '1x4',
    aspectRatio: '1:1' | '16:9'
): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const images = await Promise.all(imageUrls.map(url => {
                return new Promise<HTMLImageElement>((res, rej) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => res(img);
                    img.onerror = rej;
                    img.src = url.startsWith('idb://') ? '' : url; // We'll handle idb below
                    if (url.startsWith('idb://')) {
                        imageDB.get(url).then(blob => {
                            if (blob) img.src = URL.createObjectURL(blob);
                        });
                    }
                });
            }));

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Canvas context failed");

            let canvasW, canvasH;
            if (aspectRatio === '1:1') {
                canvasW = 2048;
                canvasH = 2048;
            } else {
                canvasW = 3840;
                canvasH = 2160;
            }

            canvas.width = canvasW;
            canvas.height = canvasH;

            // Background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvasW, canvasH);

            if (layout === '2x2') {
                const cellW = canvasW / 2;
                const cellH = canvasH / 2;
                images.forEach((img, i) => {
                    const x = (i % 2) * cellW;
                    const y = Math.floor(i / 2) * cellH;
                    
                    // Draw image centered in cell
                    const imgAspect = img.naturalWidth / img.naturalHeight;
                    const cellAspect = cellW / cellH;
                    let drawW, drawH, drawX, drawY;

                    if (imgAspect > cellAspect) {
                        drawW = cellW;
                        drawH = cellW / imgAspect;
                        drawX = x;
                        drawY = y + (cellH - drawH) / 2;
                    } else {
                        drawH = cellH;
                        drawW = cellH * imgAspect;
                        drawY = y;
                        drawX = x + (cellW - drawW) / 2;
                    }
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                });
            } else {
                // 1x4 horizontal
                const cellW = canvasW / 4;
                const cellH = canvasH;
                images.forEach((img, i) => {
                    const x = i * cellW;
                    const y = 0;
                    
                    const imgAspect = img.naturalWidth / img.naturalHeight;
                    const cellAspect = cellW / cellH;
                    let drawW, drawH, drawX, drawY;

                    if (imgAspect > cellAspect) {
                        drawW = cellW;
                        drawH = cellW / imgAspect;
                        drawX = x;
                        drawY = y + (cellH - drawH) / 2;
                    } else {
                        drawH = cellH;
                        drawW = cellH * imgAspect;
                        drawY = y;
                        drawX = x + (cellW - drawW) / 2;
                    }
                    ctx.drawImage(img, drawX, drawY, drawW, drawH);
                });
            }

            resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (e) {
            reject(e);
        }
    });
};

/**
 * Converts an image to JPEG format to remove transparency and ensure compatibility
 * with image editing models that may not handle alpha channels well.
 */
export const processImageForEditing = async (imageData: { data: string; mimeType: string }): Promise<{ data: string; mimeType: 'image/jpeg' }> => {
    // If it's already a JPEG, no conversion is needed.
    if (imageData.mimeType === 'image/jpeg' || imageData.mimeType === 'image/jpg') {
        return imageData as { data: string; mimeType: 'image/jpeg' };
    }

    const dataUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            // Draw a white background behind the image to handle transparency.
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95); // High quality
            const jpegData = jpegDataUrl.split(',')[1];
            resolve({ data: jpegData, mimeType: 'image/jpeg' });
        };
        img.onerror = (err) => {
            console.error("Image conversion failed:", err);
            reject(new Error("Failed to load image for conversion."));
        };
        img.src = dataUrl;
    });
};

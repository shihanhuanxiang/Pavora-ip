
/**
 * Utility to embed and extract hidden metadata in image files.
 * Uses a marker-based approach at the end of the file data.
 */

const MARKER_START = "##PM_META_S##";
const MARKER_END = "##PM_META_E##";

/**
 * Embeds JSON metadata into a base64 image string.
 * Appends the data after the end-of-file marker.
 */
export const embedMetadata = (base64Image: string, metadata: any): string => {
    try {
        const jsonStr = JSON.stringify(metadata);
        const encodedData = btoa(unescape(encodeURIComponent(jsonStr)));
        const payload = `${MARKER_START}${encodedData}${MARKER_END}`;
        
        // If it's a data URL, we append to the base64 part
        if (base64Image.startsWith('data:')) {
            const parts = base64Image.split(',');
            // Re-encode everything to ensure it's a valid single base64 string if needed,
            // but usually just appending to the string works if we handle it correctly on the other side.
            // A more solid way is to convert to binary, append, and back to base64.
            
            const binaryImg = atob(parts[1]);
            const newBinary = binaryImg + payload;
            return `${parts[0]},${btoa(newBinary)}`;
        }
        
        const binaryImg = atob(base64Image);
        return btoa(binaryImg + payload);
    } catch (e) {
        console.error("Failed to embed metadata:", e);
        return base64Image;
    }
};

/**
 * Deeply embeds a model's identity into a new image.
 * This is the "Output Hook" used by various modules (Dressing, Hair, Scene).
 */
export const wrapImageWithIdentity = (newBase64: string, sourceModel: any): string => {
    if (!sourceModel || !newBase64.startsWith('data:')) return newBase64;

    const metadata = {
        id: sourceModel.id, // Persistent Model ID
        name: sourceModel.name,
        gender: sourceModel.gender,
        age: sourceModel.age,
        persona: sourceModel.persona,
        lifeCircuit: sourceModel.lifeCircuit,
        stats: sourceModel.stats,
        advancedStats: sourceModel.advancedStats,
        type: sourceModel.type || 'pavora_model',
        inheritedAt: new Date().toISOString(),
        isDerivative: true
    };

    return embedMetadata(newBase64, metadata);
};

/**
 * Extracts JSON metadata from a base64 image string.
 */
export const extractMetadata = (base64Image: string): any | null => {
    try {
        let binaryData = '';
        if (base64Image.startsWith('data:')) {
            binaryData = atob(base64Image.split(',')[1]);
        } else {
            binaryData = atob(base64Image);
        }

        const startIndex = binaryData.lastIndexOf(MARKER_START);
        const endIndex = binaryData.lastIndexOf(MARKER_END);

        if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
            return null;
        }

        const encodedData = binaryData.substring(startIndex + MARKER_START.length, endIndex);
        const jsonStr = decodeURIComponent(escape(atob(encodedData)));
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to extract metadata:", e);
        return null;
    }
};

/**
 * Helper to check if a file has Pavora metadata
 */
export const hasPavoraMetadata = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.includes(MARKER_START) && result.includes(MARKER_END));
        };
        reader.onerror = () => resolve(false);
        reader.readAsBinaryString(file);
    });
};

/**
 * Extracts metadata directly from a File object
 */
export const extractMetadataFromFile = async (file: File): Promise<any | null> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const startIndex = result.lastIndexOf(MARKER_START);
            const endIndex = result.lastIndexOf(MARKER_END);

            if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
                resolve(null);
                return;
            }

            try {
                const encodedData = result.substring(startIndex + MARKER_START.length, endIndex);
                const jsonStr = decodeURIComponent(escape(atob(encodedData)));
                resolve(JSON.parse(jsonStr));
            } catch (e) {
                resolve(null);
            }
        };
        reader.onerror = () => resolve(null);
        reader.readAsBinaryString(file);
    });
};

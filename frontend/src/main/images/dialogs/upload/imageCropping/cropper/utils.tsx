// Mobile Safari refuses to allocate canvases beyond these bounds and silently yields a blank one.
const MAX_OUTPUT_SIDE = 1600;
const MAX_OUTPUT_AREA = 16 * 1024 * 1024;

export function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation)

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

const getOutputScale = (width: number, height: number): number => {
    const sideScale = MAX_OUTPUT_SIDE / Math.max(width, height);
    const areaScale = Math.sqrt(MAX_OUTPUT_AREA / (width * height));
    return Math.min(1, sideScale, areaScale);
}

export const getCroppedImg = (
    image: File,
    croppedAreaPixels: { width: number; height: number; x: number; y: number },
    rotation: number = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        if (croppedAreaPixels.width < 1 || croppedAreaPixels.height < 1) {
            reject(new Error('Der Zuschnitt ist noch nicht bereit. Bitte erneut versuchen.'));
            return;
        }

        const objectUrl = URL.createObjectURL(image);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const scale = getOutputScale(croppedAreaPixels.width, croppedAreaPixels.height);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(croppedAreaPixels.width * scale));
            canvas.height = Math.max(1, Math.round(croppedAreaPixels.height * scale));

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Das Foto ist zu groß zum Zuschneiden.'));
                return;
            }

            const rotRad = getRadianAngle(rotation)
            const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
                img.width,
                img.height,
                rotation
            )

            // Crop rect is expressed in the rotated bounding box, so undo its offset first.
            ctx.scale(scale, scale)
            ctx.translate(-croppedAreaPixels.x, -croppedAreaPixels.y)
            ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
            ctx.rotate(rotRad)
            ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
            ctx.translate(-img.width / 2, -img.height / 2)
            ctx.drawImage(img, 0, 0)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                },
                'image/jpeg',
                0.95
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        img.src = objectUrl;
    });
};

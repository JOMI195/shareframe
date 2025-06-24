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

export const getCroppedImg = (
    image: File,
    croppedAreaPixels: { width: number; height: number; x: number; y: number },
    rotation: number = 0,
    flip = { horizontal: false, vertical: false }
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.src = reader.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                const rotRad = getRadianAngle(rotation)

                // calculate bounding box of the rotated image
                const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
                    img.width,
                    img.height,
                    rotation
                )

                // set canvas size to match the bounding box
                canvas.width = bBoxWidth
                canvas.height = bBoxHeight

                // translate canvas context to a central location to allow rotating and flipping around the center
                ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
                ctx.rotate(rotRad)
                ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
                ctx.translate(-img.width / 2, -img.height / 2)

                // draw rotated image
                ctx.drawImage(img, 0, 0)

                const croppedCanvas = document.createElement('canvas')

                const croppedCtx = croppedCanvas.getContext('2d')

                if (!croppedCtx) {
                    return null
                }

                // Set the size of the cropped canvas
                croppedCanvas.width = croppedAreaPixels.width
                croppedCanvas.height = croppedAreaPixels.height

                // Draw the cropped image onto the new canvas
                croppedCtx.drawImage(
                    canvas,
                    croppedAreaPixels.x,
                    croppedAreaPixels.y,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height,
                    0,
                    0,
                    croppedAreaPixels.width,
                    croppedAreaPixels.height
                )

                // Convert to blob and resolve
                croppedCanvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create blob from canvas'));
                        }
                    },
                    'image/jpeg',
                    0.95 // quality parameter
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(image);
    });
};
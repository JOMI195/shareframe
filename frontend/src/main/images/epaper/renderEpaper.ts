import { EPAPER_HEIGHT, EPAPER_WIDTH, ditherToEpaper } from './dither';

export const renderEpaper = async (image: Blob): Promise<Blob> => {
    const bitmap = await createImageBitmap(image);
    const canvas = document.createElement('canvas');
    canvas.width = EPAPER_WIDTH;
    canvas.height = EPAPER_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
        bitmap.close();
        throw new Error('Canvas 2D context unavailable');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    // Stretched, not fitted: the board resizes to the panel without keeping the aspect ratio.
    context.drawImage(bitmap, 0, 0, EPAPER_WIDTH, EPAPER_HEIGHT);
    bitmap.close();

    const pixels = context.getImageData(0, 0, EPAPER_WIDTH, EPAPER_HEIGHT);
    pixels.data.set(ditherToEpaper(pixels.data, EPAPER_WIDTH, EPAPER_HEIGHT));
    context.putImageData(pixels, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))), 'image/png');
    });
};

export const EPAPER_WIDTH = 800;
export const EPAPER_HEIGHT = 480;

const THRESHOLD = 127.5;

// Mirrors the board's _prepareImageBuffer: luma, Floyd–Steinberg left to right, 1 bit per pixel.
export const ditherToEpaper = (rgba: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    const gray = new Float32Array(width * height);
    for (let i = 0; i < gray.length; i++) {
        gray[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
    }

    const distribute = (x: number, y: number, error: number, factor: number) => {
        if (x >= 0 && x < width && y < height) {
            gray[y * width + x] += error * factor;
        }
    };

    const out = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const value = gray[i] > THRESHOLD ? 255 : 0;
            const error = gray[i] - value;
            distribute(x + 1, y, error, 7 / 16);
            distribute(x - 1, y + 1, error, 3 / 16);
            distribute(x, y + 1, error, 5 / 16);
            distribute(x + 1, y + 1, error, 1 / 16);

            out[i * 4] = value;
            out[i * 4 + 1] = value;
            out[i * 4 + 2] = value;
            out[i * 4 + 3] = 255;
        }
    }
    return out;
};

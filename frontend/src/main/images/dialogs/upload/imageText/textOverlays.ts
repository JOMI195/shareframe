import { formatDateNumeric } from '@/common/utils/date/date';

export type TextColor = 'black' | 'white';
export type TextFont = 'sans' | 'serif' | 'handwritten';

export interface TextOverlay {
    id: string;
    text: string;
    // center of the text in cropped-image pixels
    x: number;
    y: number;
    rotation: number;
    fontSize: number;
    color: TextColor;
    // box behind the text in the opposite color
    background: boolean;
    font: TextFont;
    bold: boolean;
}

export const DEFAULT_TEXT = 'Text';

export const FONTS: Record<TextFont, { label: string; family: string }> = {
    sans: { label: 'Inter', family: 'Inter' },
    serif: { label: 'Merriweather', family: 'Merriweather' },
    handwritten: { label: 'Caveat', family: 'Caveat' },
};

const FONT_SIZE_RATIO = 1 / 8;
const MIN_FONT_SIZE = 8;
const BACKGROUND_PADDING_RATIO = 0.2;
const BACKGROUND_RADIUS_RATIO = 0.15;
const CASCADE_STEPS = 4;

let idCounter = 0;

// Each new text lands slightly offset so stacked ones stay distinguishable.
export const createTextOverlay = (
    imageWidth: number,
    imageHeight: number,
    existingCount: number,
    text = DEFAULT_TEXT
): TextOverlay => {
    const fontSize = Math.max(MIN_FONT_SIZE, Math.round(imageHeight * FONT_SIZE_RATIO));
    const offset = (existingCount % CASCADE_STEPS) * fontSize * 0.75;
    return {
        id: `text-${Date.now()}-${++idCounter}`,
        text,
        x: imageWidth / 2 + offset,
        y: imageHeight / 2 + offset,
        rotation: 0,
        fontSize,
        color: 'black',
        background: false,
        font: 'sans',
        bold: false,
    };
};

export const createDateOverlay = (imageWidth: number, imageHeight: number, existingCount: number, now = new Date()) =>
    createTextOverlay(imageWidth, imageHeight, existingCount, formatDateNumeric(now));

export const applyTransform = (
    overlay: TextOverlay,
    transform: { x: number; y: number; rotation: number; scale: number }
): TextOverlay => ({
    ...overlay,
    x: transform.x,
    y: transform.y,
    rotation: transform.rotation,
    fontSize: Math.max(MIN_FONT_SIZE, Math.round(overlay.fontSize * transform.scale)),
});

export const oppositeColor = (color: TextColor): TextColor => (color === 'black' ? 'white' : 'black');

export const backgroundPadding = (fontSize: number) => fontSize * BACKGROUND_PADDING_RATIO;

export const backgroundRadius = (fontSize: number) => fontSize * BACKGROUND_RADIUS_RATIO;

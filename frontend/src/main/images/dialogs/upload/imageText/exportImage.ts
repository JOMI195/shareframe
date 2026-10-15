import type Konva from 'konva';
import { PHOTO } from './textEditor';

export const exportStageToBlob = async (stage: Konva.Stage | null, outputWidth: number): Promise<Blob> => {
    if (!stage || stage.width() < 1) {
        throw new Error('Der Text-Editor ist noch nicht bereit. Bitte erneut versuchen.');
    }
    const editorOnly = stage.find('Transformer, .editor-only');
    const hiddenPhoto = stage.find(`.${PHOTO}`).filter((node) => !node.visible());
    editorOnly.forEach((node) => node.hide());
    hiddenPhoto.forEach((node) => node.show());
    try {
        return await stage.toBlob({
            mimeType: 'image/jpeg',
            quality: 0.95,
            pixelRatio: outputWidth / stage.width(),
        });
    } finally {
        editorOnly.forEach((node) => node.show());
        hiddenPhoto.forEach((node) => node.hide());
    }
};

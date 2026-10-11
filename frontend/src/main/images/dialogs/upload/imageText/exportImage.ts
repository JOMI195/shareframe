import type Konva from 'konva';

export const exportStageToBlob = async (stage: Konva.Stage | null, outputWidth: number): Promise<Blob> => {
    if (!stage || stage.width() < 1) {
        throw new Error('Der Text-Editor ist noch nicht bereit. Bitte erneut versuchen.');
    }
    const editorOnly = stage.find('Transformer, .editor-only');
    editorOnly.forEach((node) => node.hide());
    try {
        return await stage.toBlob({
            mimeType: 'image/jpeg',
            quality: 0.95,
            pixelRatio: outputWidth / stage.width(),
        });
    } finally {
        editorOnly.forEach((node) => node.show());
    }
};

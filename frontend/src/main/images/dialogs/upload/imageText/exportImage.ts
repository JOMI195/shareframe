import type React from 'react';
import type Konva from 'konva';
import { PHOTO } from './textEditor';

const STAGE_WAIT_FRAMES = 10;

// The stage mounts a frame after the editor has measured its width.
const mountedStage = async (stageRef: React.RefObject<Konva.Stage | null>) => {
    for (let frame = 0; frame < STAGE_WAIT_FRAMES && !(stageRef.current && stageRef.current.width() >= 1); frame++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return stageRef.current;
};

export const exportStageToBlob = async (stageRef: React.RefObject<Konva.Stage | null>, outputWidth: number): Promise<Blob> => {
    const stage = await mountedStage(stageRef);
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

import React, { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { openImagesAlertSnackbar } from '@/store/ui/images/images.slice';
import { getTextPresets } from '@/store/entities/images/images.slice';
import { createTextPreset, deleteTextPreset, fetchTextPresets } from '@/store/entities/images/images.actions';
import { BlobImage } from '../useBlobImage';
import FrameAspectBox from '../frameAspectBox';
import { FramedCanvas, ToolCanvas, ToolControls } from '../editorLayout';
import { useEpaperPreview } from '@/main/images/epaper/useEpaperPreview';
import TextEditor from './textEditor';
import TextToolbar from './textToolbar';
import { exportStageToBlob } from './exportImage';
import { MAX_OUTPUT_SIDE } from '../outputSize';
import { loadFonts } from './fonts';
import { useLoadedImage } from './useLoadedImage';
import { createDateOverlay, createTextOverlay, MIN_FONT_SIZE, overlayFromPreset, overlayToPreset, scaleOverlays, TextOverlay } from './textOverlays';

interface ImageTextProps {
    epaper: boolean;
    photo: BlobImage;
    fileName: string;
    overlays: TextOverlay[];
    setOverlays: React.Dispatch<React.SetStateAction<TextOverlay[]>>;
    // pixel width of the photo the overlays were placed on
    overlaysWidth: number | null;
    setOverlaysWidth: (width: number) => void;
    exportRequested: boolean;
    handleTextDone: (blob: Blob) => void;
    handleExportFailed: () => void;
}

const ImageText: React.FC<ImageTextProps> = ({
    epaper,
    photo,
    fileName,
    overlays,
    setOverlays,
    overlaysWidth,
    setOverlaysWidth,
    exportRequested,
    handleTextDone,
    handleExportFailed,
}) => {
    const dispatch = useAppDispatch();
    const stageRef = useRef<Konva.Stage>(null);
    const { image, error } = useLoadedImage(photo.url);
    const epaperUrl = useEpaperPreview(photo.blob, epaper);
    const [fontsReady, setFontsReady] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const exportingRef = useRef(false);
    const presets = useAppSelector(getTextPresets);

    useEffect(() => {
        if (!presets.loaded) dispatch(fetchTextPresets());
    }, [dispatch, presets.loaded]);

    useEffect(() => {
        let cancelled = false;
        loadFonts().then(() => {
            if (!cancelled) setFontsReady(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!image || overlaysWidth === image.width) return;
        if (overlaysWidth !== null) {
            setOverlays((prev) => scaleOverlays(prev, image.width / overlaysWidth));
        }
        setOverlaysWidth(image.width);
    }, [image, overlaysWidth, setOverlays, setOverlaysWidth]);

    const ready = image !== null && fontsReady && overlaysWidth === image.width;
    const selected = overlays.find((overlay) => overlay.id === selectedId) ?? null;

    const addOverlay = (overlay: TextOverlay) => {
        setOverlays((prev) => [...prev, overlay]);
        setSelectedId(overlay.id);
    };

    const updateOverlay = (next: TextOverlay) =>
        setOverlays((prev) => prev.map((overlay) => (overlay.id === next.id ? next : overlay)));

    const deleteOverlay = (id: string) => {
        setOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
        setSelectedId(null);
    };

    useEffect(() => {
        if (!exportRequested || !ready || exportingRef.current) return;
        exportingRef.current = true;
        // Texts are vectors, so a zoomed-in crop must not cap their resolution at the crop's pixels.
        exportStageToBlob(stageRef, Math.max(image.width, MAX_OUTPUT_SIDE))
            .then(handleTextDone)
            .catch((exportError) => {
                dispatch(openImagesAlertSnackbar({
                    message: exportError instanceof Error ? exportError.message : 'Text konnte nicht eingefügt werden',
                    severity: 'error',
                }));
                handleExportFailed();
            })
            .finally(() => {
                exportingRef.current = false;
            });
    }, [exportRequested, ready, image, dispatch, handleTextDone, handleExportFailed]);

    return (
        <>
            <ToolCanvas>
                {error && (
                    <Alert severity="error">Das zugeschnittene Foto konnte nicht geladen werden.</Alert>
                )}
                {!error && (
                    <FramedCanvas>
                        {ready ? (
                            <TextEditor
                                image={image}
                                backdrop={epaper && epaperUrl ? { url: epaperUrl, alt: `E-Paper-Vorschau von ${fileName}` } : null}
                                overlays={overlays}
                                selectedId={selectedId}
                                onSelect={setSelectedId}
                                onChange={updateOverlay}
                                onDelete={deleteOverlay}
                                stageRef={stageRef}
                            />
                        ) : (
                            <FrameAspectBox />
                        )}
                    </FramedCanvas>
                )}
            </ToolCanvas>
            <ToolControls>
                <TextToolbar
                    overlays={overlays}
                    maxFontSize={image ? Math.round(image.height / 2) : MIN_FONT_SIZE}
                    selected={selected}
                    disabled={!ready}
                    onAddText={() => image && addOverlay(createTextOverlay(image.width, image.height, overlays.length))}
                    onAddDate={() => image && addOverlay(createDateOverlay(image.width, image.height, overlays.length))}
                    onSelect={setSelectedId}
                    onChange={updateOverlay}
                    onDelete={deleteOverlay}
                    presets={presets.items}
                    savingPreset={presets.saving}
                    onAddPreset={(preset) => image && addOverlay(overlayFromPreset(preset, image.width, image.height))}
                    onSavePreset={(overlay) => image && dispatch(createTextPreset(overlayToPreset(overlay, image.width, image.height)))}
                    onDeletePreset={(preset) => dispatch(deleteTextPreset(preset.id))}
                />
            </ToolControls>
        </>
    );
};

export default ImageText;

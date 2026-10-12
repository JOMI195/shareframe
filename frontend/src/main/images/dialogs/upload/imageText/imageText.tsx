import React, { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { Alert, Box, Button, Grid, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { openImagesAlertSnackbar } from '@/store/ui/images/images.slice';
import { getTextPresets } from '@/store/entities/images/images.slice';
import { createTextPreset, deleteTextPreset, fetchTextPresets } from '@/store/entities/images/images.actions';
import { BlobImage } from '../useBlobImage';
import FrameAspectBox from '../frameAspectBox';
import PassepartoutHint from '../passepartoutHint';
import TextEditor from './textEditor';
import TextToolbar from './textToolbar';
import { exportStageToBlob } from './exportImage';
import { MAX_OUTPUT_SIDE } from '../outputSize';
import { loadFonts } from './fonts';
import { useLoadedImage } from './useLoadedImage';
import { createDateOverlay, createTextOverlay, overlayFromPreset, overlayToPreset, TextOverlay } from './textOverlays';

interface ImageTextProps {
    croppedImage: BlobImage;
    fileName: string;
    overlays: TextOverlay[];
    setOverlays: React.Dispatch<React.SetStateAction<TextOverlay[]>>;
    handleTextDone: (blob: Blob) => void;
    handleBackToCrop: () => void;
    handleDialogClose: () => void;
    showCloseButton: boolean;
}

const ImageText: React.FC<ImageTextProps> = ({
    croppedImage,
    fileName,
    overlays,
    setOverlays,
    handleTextDone,
    handleBackToCrop,
    handleDialogClose,
    showCloseButton,
}) => {
    const dispatch = useAppDispatch();
    const stageRef = useRef<Konva.Stage>(null);
    const { image, error } = useLoadedImage(croppedImage.url);
    const [fontsReady, setFontsReady] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
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

    const ready = image !== null && fontsReady;
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

    const onNext = async () => {
        if (!image) return;
        if (overlays.length === 0) {
            handleTextDone(croppedImage.blob);
            return;
        }
        setExporting(true);
        try {
            // Texts are vectors, so a zoomed-in crop must not cap their resolution at the crop's pixels.
            handleTextDone(await exportStageToBlob(stageRef.current, Math.max(image.width, MAX_OUTPUT_SIDE)));
        } catch (exportError) {
            dispatch(openImagesAlertSnackbar({
                message: exportError instanceof Error ? exportError.message : 'Text konnte nicht eingefügt werden',
                severity: 'error',
            }));
        } finally {
            setExporting(false);
        }
    };

    return (
        <Box sx={{ my: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
                {fileName}
            </Typography>
            {error && (
                <Alert severity="error">Das zugeschnittene Foto konnte nicht geladen werden.</Alert>
            )}
            {!error && !ready && <FrameAspectBox />}
            {ready && (
                <TextEditor
                    image={image}
                    overlays={overlays}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onChange={updateOverlay}
                    onDelete={deleteOverlay}
                    stageRef={stageRef}
                />
            )}
            <TextToolbar
                overlays={overlays}
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
            {ready && <PassepartoutHint withTextArea />}

            <Grid container spacing={2} sx={{ mt: { xs: 1, md: 3 }, alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 3 } }}>
                    <Button
                        variant="contained"
                        fullWidth
                        disabled={!ready || exporting}
                        onClick={onNext}
                    >
                        Weiter zur Vorschau
                    </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} sx={{ order: { xs: 2, md: 2 } }}>
                    <Button fullWidth variant="outlined" onClick={handleBackToCrop}>
                        Zurück zum Zuschneiden
                    </Button>
                </Grid>
                {showCloseButton && (
                    <Grid size={{ xs: 12, md: 3 }} sx={{ order: { xs: 3, md: 1 } }}>
                        <Button fullWidth variant="outlined" onClick={handleDialogClose}>
                            Dialog schließen
                        </Button>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default ImageText;

import React, { useState } from 'react';
import { Alert, Box, Button, Grid, Slider, Typography } from '@mui/material';
import { useAppDispatch } from '@/store';
import { openImagesAlertSnackbar } from '@/store/ui/images/images.slice';
import { EpaperView } from '@/main/images/epaper/epaperToggle';
import { BlobImage } from '../useBlobImage';
import FrameAspectBox from '../frameAspectBox';
import PassepartoutOverlay from '../passepartoutOverlay';
import StepHeader from '../stepHeader';
import { useLoadedImage } from '../imageText/useLoadedImage';
import AdjustPreview from './adjustPreview';
import { adjustImage } from './adjustImage';
import { ADJUST_RANGE, Adjustment, NEUTRAL_ADJUSTMENT, isNeutral } from './adjust';

const sliders: { key: keyof Adjustment; label: string }[] = [
    { key: 'brightness', label: 'Helligkeit' },
    { key: 'contrast', label: 'Kontrast' },
];

interface ImageAdjustProps {
    view: EpaperView;
    onViewChange: (view: EpaperView) => void;
    croppedImage: BlobImage;
    fileName: string;
    adjustment: Adjustment;
    setAdjustment: (adjustment: Adjustment) => void;
    handleAdjustDone: (blob: Blob) => void;
    handleBackToCrop: () => void;
    handleDialogClose: () => void;
    showCloseButton: boolean;
}

const ImageAdjust: React.FC<ImageAdjustProps> = ({
    view,
    onViewChange,
    croppedImage,
    fileName,
    adjustment,
    setAdjustment,
    handleAdjustDone,
    handleBackToCrop,
    handleDialogClose,
    showCloseButton,
}) => {
    const dispatch = useAppDispatch();
    const { image, error } = useLoadedImage(croppedImage.url);
    const [exporting, setExporting] = useState(false);

    const onNext = async () => {
        if (isNeutral(adjustment)) {
            handleAdjustDone(croppedImage.blob);
            return;
        }
        setExporting(true);
        try {
            handleAdjustDone(await adjustImage(croppedImage.blob, adjustment));
        } catch (adjustError) {
            dispatch(openImagesAlertSnackbar({
                message: adjustError instanceof Error ? adjustError.message : 'Anpassen fehlgeschlagen',
                severity: 'error',
            }));
        } finally {
            setExporting(false);
        }
    };

    return (
        <Box sx={{ my: 2 }}>
            <StepHeader fileName={fileName} view={view} onViewChange={onViewChange} />
            {error ? (
                <Alert severity="error">Das zugeschnittene Foto konnte nicht geladen werden.</Alert>
            ) : (
                <FrameAspectBox>
                    {image && (
                        <>
                            <AdjustPreview
                                image={image}
                                adjustment={adjustment}
                                epaper={view === 'epaper'}
                                alt={`Vorschau von ${fileName}`}
                            />
                            <PassepartoutOverlay />
                        </>
                    )}
                </FrameAspectBox>
            )}

            <Box sx={{ mt: 2 }}>
                {sliders.map(({ key, label }) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ width: 90, flexShrink: 0 }}>{label}</Typography>
                        <Slider
                            value={adjustment[key]}
                            min={-ADJUST_RANGE}
                            max={ADJUST_RANGE}
                            track={false}
                            marks={[{ value: 0 }]}
                            valueLabelDisplay="auto"
                            onChange={(_event, value) => setAdjustment({ ...adjustment, [key]: value as number })}
                            aria-label={label}
                        />
                    </Box>
                ))}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Mehr Kontrast macht das Foto auf dem Schwarz-Weiß-Rahmen klarer.
                    </Typography>
                    <Button
                        size="small"
                        disabled={isNeutral(adjustment)}
                        onClick={() => setAdjustment(NEUTRAL_ADJUSTMENT)}
                    >
                        Zurücksetzen
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={2} sx={{ mt: { xs: 1, md: 3 }, alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 3 } }}>
                    <Button variant="contained" fullWidth disabled={!image || exporting} onClick={onNext}>
                        Weiter zum Text
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

export default ImageAdjust;

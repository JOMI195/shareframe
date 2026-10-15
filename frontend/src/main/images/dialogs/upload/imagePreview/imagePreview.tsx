import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import AutoDeleteOption from '../autoDeleteOption';
import { BlobImage } from '../useBlobImage';
import FrameAspectBox from '../frameAspectBox';
import PassepartoutOverlay from '../passepartoutOverlay';
import PassepartoutHint from '../passepartoutHint';
import StepHeader from '../stepHeader';
import { EpaperView } from '@/main/images/epaper/epaperToggle';
import { useEpaperPreview } from '@/main/images/epaper/useEpaperPreview';

interface ImagePreviewProps {
    view: EpaperView;
    onViewChange: (view: EpaperView) => void;
    finalImage: BlobImage;
    fileName: string;
    handleUpload: (blob: Blob) => Promise<void>;
    handleBackToText: () => void;
    handleDialogClose: () => void;
    showCloseButton: boolean;
    sending: boolean;
    autoDeleteAfterPeriod: boolean;
    setAutoDeleteAfterPeriod: (value: boolean) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
    view,
    onViewChange,
    finalImage,
    fileName,
    handleUpload,
    handleBackToText,
    handleDialogClose,
    showCloseButton,
    sending,
    autoDeleteAfterPeriod,
    setAutoDeleteAfterPeriod,
}) => {
    const epaperUrl = useEpaperPreview(finalImage.blob, view === 'epaper');

    return (
        <Box sx={{ my: 2 }}>
            <StepHeader fileName={fileName} view={view} onViewChange={onViewChange} />
            <FrameAspectBox>
                <Box
                    component="img"
                    src={epaperUrl ?? finalImage.url}
                    alt={`Vorschau von ${fileName}`}
                    sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <PassepartoutOverlay />
            </FrameAspectBox>
            <PassepartoutHint />

            <AutoDeleteOption checked={autoDeleteAfterPeriod} onChange={setAutoDeleteAfterPeriod} />

            <Grid container spacing={2} sx={{ mt: { xs: 1, md: 3 }, alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 3 } }}>
                    <Button
                        variant="contained"
                        fullWidth
                        disabled={sending}
                        onClick={() => handleUpload(finalImage.blob)}
                    >
                        Hochladen
                    </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} sx={{ order: { xs: 2, md: 2 } }}>
                    <Button fullWidth variant="outlined" onClick={handleBackToText}>
                        Zurück zum Text
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

export default ImagePreview;

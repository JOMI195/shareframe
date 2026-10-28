import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import AutoDeleteOption from '../autoDeleteOption';
import { BlobImage } from '../useBlobImage';
import FrameAspectBox from '../frameAspectBox';
import PassepartoutOverlay from '../passepartoutOverlay';
import PassepartoutHint from '../passepartoutHint';
import { useEpaperPreview } from '@/main/images/epaper/useEpaperPreview';

interface ImagePreviewProps {
    epaper: boolean;
    finalImage: BlobImage;
    fileName: string;
    handleUpload: (blob: Blob) => Promise<void>;
    handleBackToEdit: () => void;
    sending: boolean;
    autoDeleteAfterPeriod: boolean;
    setAutoDeleteAfterPeriod: (value: boolean) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
    epaper,
    finalImage,
    fileName,
    handleUpload,
    handleBackToEdit,
    sending,
    autoDeleteAfterPeriod,
    setAutoDeleteAfterPeriod,
}) => {
    const epaperUrl = useEpaperPreview(finalImage.blob, epaper);

    return (
        <Box sx={{ my: 2 }}>
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
                <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 1, md: 2 } }}>
                    <Button
                        variant="contained"
                        fullWidth
                        disabled={sending}
                        onClick={() => handleUpload(finalImage.blob)}
                    >
                        Hochladen
                    </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: 2, md: 1 } }}>
                    <Button fullWidth variant="outlined" onClick={handleBackToEdit}>
                        Zurück zum Bearbeiten
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImagePreview;

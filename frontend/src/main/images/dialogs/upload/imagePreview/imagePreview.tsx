import React from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import AutoDeleteOption from '../autoDeleteOption';
import { BlobImage } from '../useBlobImage';
import FrameAspectBox from '../frameAspectBox';

interface ImagePreviewProps {
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
    return (
        <Box sx={{ my: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
                {fileName}
            </Typography>
            <FrameAspectBox>
                <Box
                    component="img"
                    src={finalImage.url}
                    alt={`Vorschau von ${fileName}`}
                    sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
                />
            </FrameAspectBox>

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

import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import ImageUploadForm from './form/imageUploadForm';
import { ImageStatus } from '../uploadDialog';

interface ImageUploadProps {
    imageStatuses: ImageStatus[];
    addImages: (images: File[]) => void;
    removeImage: (index: number) => void;
    handleNext: () => void;
    handleBack: () => void;
    imagePreviews: { [id: string]: string };
}

const ImageUpload: React.FC<ImageUploadProps> = ({ imageStatuses, addImages, removeImage, handleNext, handleBack, imagePreviews }) => {
    return (
        <Box sx={{ mt: 2 }}>
            <ImageUploadForm
                imageStatuses={imageStatuses}
                addImages={addImages}
                removeImage={removeImage}
                imagePreviews={imagePreviews}
            />
            <Grid container spacing={2} sx={{ mt: 1, alignItems: "center" }}>
                <Grid
                    size={{
                        xs: 12,
                        md: 6
                    }}
                    sx={{
                        order: { xs: 1, md: 2 },
                        mt: { xs: 1, md: 0 }
                    }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleNext}
                        disabled={imageStatuses.length === 0}
                    >
                        Weiter zum Zuschneiden
                    </Button>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        md: 6
                    }}
                    sx={{
                        order: { xs: 2, md: 1 }
                    }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleBack}
                    >
                        Abbrechen
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImageUpload;
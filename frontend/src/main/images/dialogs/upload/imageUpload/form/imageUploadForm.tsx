import React, { useState, useRef } from 'react';
import {
    Container,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Avatar
} from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import { validateImage } from '../../imageValidation';
import { getReadablyFileSize } from '@/common/utils/files/fileSize.helpers';
import { ImageStatus } from '../../uploadDialog';

interface IImageUploadFormProps {
    setImages: (images: File[]) => void;
    imageStatuses: ImageStatus[];
    imagePreviews: { [id: string]: string };
}

const ImageUploadForm: React.FC<IImageUploadFormProps> = ({ setImages, imageStatuses, imagePreviews }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const [isOver, setIsOver] = useState(false);

    const validFileExtensions = import.meta.env.VITE_APP_UPLOADED_FILES_FILE_FORMATS.split(" ");
    const maxFiles = import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES
        ? +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES
        : 5;

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsOver(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsOver(false);
        if (event.dataTransfer.files) {
            const filesArray = Array.from(event.dataTransfer.files);
            const validatedFiles = filesArray.map((file, index) => {
                const validation = validateImage(file, index, filesArray.length);
                return { file, validation };
            });

            const validFiles = validatedFiles.filter(item => item.validation.valid).map(item => item.file);
            const invalidFiles = validatedFiles.filter(item => !item.validation.valid);

            if (invalidFiles.length > 0) {
                const errorMessages = invalidFiles.map(item =>
                    `${item.file.name}: ${item.validation.errors.join(', ')}`
                ).join('\n');
                alert(`Einige Fotos konnten nicht hinzugefügen werden:\n${errorMessages}`);
            }
            setImages(validFiles);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filesArray = Array.from(event.target.files);
            const validatedFiles = filesArray.map((file, index) => {
                const validation = validateImage(file, index, filesArray.length);
                return { file, validation };
            });

            const validFiles = validatedFiles.filter(item => item.validation.valid).map(item => item.file);
            const invalidFiles = validatedFiles.filter(item => !item.validation.valid);

            if (invalidFiles.length > 0) {
                const errorMessages = invalidFiles.map(item =>
                    `${item.file.name}: ${item.validation.errors.join(', ')}`
                ).join('\n');
                alert(`Einige Fotos konnten nicht hinzugefügt werden:\n${errorMessages}`);
            }

            setImages(validFiles);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const removeImage = (indexToRemove: number) => {
        const updatedFiles = imageStatuses
            .filter((_, index) => index !== indexToRemove)
            .map(status => status.file);
        setImages(updatedFiles);
    };

    const handleButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <Container>
            <input
                type="file"
                multiple
                hidden
                ref={inputRef}
                onChange={handleFileChange}
                accept="image/*"
            />
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: isOver ? 'primary.main' : 'grey.400',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'border-color 0.3s ease-in-out',
                            bgcolor: isOver ? 'primary.light' : 'transparent'
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleButtonClick}
                    >
                        <Typography variant="h6" gutterBottom>
                            Fotos hierher ziehen
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            oder
                        </Typography>
                        <Button variant="contained">
                            Fotos auswählen
                        </Button>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Klicken Sie hier, um Dateien auszuwählen
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {`Nur Bilder mit Dateiendung ${validFileExtensions.map((ext: any) => ext)} werden akzeptiert`}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {`Maximal ${maxFiles} Fotos können gleichzeitig hochgeladen werden`}
                        </Typography>
                    </Box>
                </Grid>
                {
                    imageStatuses.length > 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Ausgewählte Fotos
                                </Typography>
                                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                                    {imageStatuses.map((imageStatus, index) => {
                                        const validation = validateImage(imageStatus.file, index, imageStatuses.length);
                                        return (
                                            <ListItem
                                                key={imageStatus.id}
                                                sx={{
                                                    bgcolor: validation.valid ? 'background.paper' : 'error.main',
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    boxShadow: 1
                                                }}
                                            >
                                                <Chip
                                                    label={index + 1}
                                                    size="small"
                                                    sx={{ mr: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                                                />
                                                {imagePreviews[imageStatus.id] && (
                                                    <Avatar
                                                        src={imagePreviews[imageStatus.id]}
                                                        variant="square"
                                                        sx={{ width: 40, height: 40, mr: 1, objectFit: 'cover' }}
                                                    />
                                                )}
                                                <ListItemText
                                                    primary={imageStatus.file.name}
                                                    secondary={
                                                        validation.valid ? getReadablyFileSize(imageStatus.file.size)
                                                            : <Typography style={{ color: '#f24444' }}>{validation.errors.join(" | ")}</Typography>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="delete"
                                                        onClick={() => removeImage(index)}
                                                        size="small"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Box>
                        </Grid>
                    )
                }
            </Grid>
        </Container>
    );
};

export default ImageUploadForm;
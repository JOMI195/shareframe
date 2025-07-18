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
    Avatar,
    Switch,
    Box,
    Typography,
    Button,
    useTheme,
    useMediaQuery
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { validateImage, validateImages } from '../validation/imageValidation';
import { getReadablyFileSize } from '@/common/utils/files/fileSize.helpers';
import { ImageStatus } from '../../uploadDialog';
import { useAppDispatch, useAppSelector } from '@/store';
import { getImagesPaginated } from '@/store/entities/images/images.slice';
import { openImagesAlertSnackbar } from '@/store/ui/images/images.slice';

interface IImageUploadFormProps {
    setImages: (images: File[]) => void;
    imageStatuses: ImageStatus[];
    imagePreviews: { [id: string]: string };
}

const ImageUploadForm: React.FC<IImageUploadFormProps> = ({ setImages, imageStatuses, imagePreviews }) => {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOver, setIsOver] = useState(false);
    const [useCamera, setUseCamera] = useState(false);

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Get existing files count for total validation
    const imagesPaginatedCount = useAppSelector(getImagesPaginated).count;

    const validFileExtensions = import.meta.env.VITE_APP_UPLOADED_FILES_FILE_FORMATS.split(" ");
    const maxFiles = import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES
        ? +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES
        : 5;

    // Updated file selection handler with total validation
    const handleFileSelection = (selectedFiles: File[]) => {
        const { validFiles, invalidFiles } = validateImages(selectedFiles, imagesPaginatedCount);

        // Show errors for invalid files
        if (invalidFiles.length > 0) {
            const errorMessages = invalidFiles.map(({ file, errors }) =>
                `${file.name}: ${errors.join(', ')}`
            ).join('\n');
            dispatch(openImagesAlertSnackbar({
                message: `Einige Fotos konnten nicht hinzugefügt werden:\n${errorMessages}`,
                severity: "warning"
            }));
        }

        // Only set the valid files
        if (validFiles.length > 0) {
            setImages(validFiles);
        }
    };

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
            handleFileSelection(filesArray);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (event.target.files) {
                const filesArray = Array.from(event.target.files);
                handleFileSelection(filesArray);

                // Reset input with longer delay for Android compatibility
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.value = '';
                    }
                }, 200);
            }
        } catch (error) {
            //console.error('Error handling file selection:', error);
            // Reset input on error
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
        if (inputRef.current) {
            // Remove any existing capture attribute
            inputRef.current.removeAttribute('capture');

            // Only set capture attribute if on mobile and useCamera is true
            if (isMobile && useCamera) {
                inputRef.current.setAttribute('capture', 'environment');
            }
            // For gallery mode (default or when useCamera is false), don't set capture attribute

            // Small delay can help with Android compatibility
            setTimeout(() => {
                inputRef.current?.click();
            }, 10);
        }
    };

    const handleCaptureToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUseCamera(event.target.checked);
    };

    return (
        <Container>
            <input
                type="file"
                multiple
                hidden
                ref={inputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
            />
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    {/* Drop Zone */}
                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: isOver ? 'primary.main' : 'grey.400',
                            borderRadius: 1,
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
                        <Button variant="contained" startIcon={(isMobile && useCamera) ? <CameraAltIcon /> : <PhotoLibraryIcon />}>
                            {(isMobile && useCamera) ? 'Foto aufnehmen' : 'Fotos auswählen'}
                        </Button>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {(isMobile && useCamera)
                                ? 'Klicken Sie hier, um die Kamera zu öffnen'
                                : 'Klicken Sie hier, um Dateien auszuwählen'
                            }
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {`Nur Bilder mit Dateiendung ${validFileExtensions.map((ext: any) => ext)} werden akzeptiert`}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {`Maximal ${maxFiles} Fotos können gleichzeitig hochgeladen werden`}
                        </Typography>
                    </Box>
                    {/* Camera/Gallery Toggle - Only show on mobile */}
                    {isMobile && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 2, maxWidth: "300px", justifySelf: "center" }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    minWidth: '280px',
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    borderRadius: 1,
                                    padding: '8px 16px',
                                    backgroundColor: 'action.hover',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleCaptureToggle({ target: { checked: !useCamera } } as React.ChangeEvent<HTMLInputElement>)}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        color: useCamera ? 'text.secondary' : 'primary.main',
                                        opacity: useCamera ? 0.5 : 1,
                                        fontWeight: useCamera ? 'normal' : 'bold',
                                        transition: 'opacity 0.3s, color 0.3s',
                                    }}
                                >
                                    <PhotoLibraryIcon />
                                    <Typography variant="body2">Galerie</Typography>
                                </Box>

                                <Switch
                                    checked={useCamera}
                                    onChange={handleCaptureToggle}
                                    color="primary"
                                    onClick={(e) => e.stopPropagation()}
                                />

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        color: useCamera ? 'primary.main' : 'text.secondary',
                                        opacity: useCamera ? 1 : 0.5,
                                        fontWeight: useCamera ? 'bold' : 'normal',
                                        transition: 'opacity 0.3s, color 0.3s',
                                    }}
                                >
                                    <CameraAltIcon />
                                    <Typography variant="body2">Kamera</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
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
                                        const validation = validateImage(imageStatus.file, index, imageStatuses.length, imagesPaginatedCount);
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
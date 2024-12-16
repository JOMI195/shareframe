import React, { useState } from 'react'
import { Container, Grid, List, ListItem, ListItemText } from '@mui/material'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { validateImage } from './validation'
import { IImageValidationResponse } from '@/types'
import { getReadablyFileSize } from '@/common/utils/files/fileSize.helpers'

interface IImageUploadFormProps {
    setImage: React.Dispatch<React.SetStateAction<File | null>>;
    image: File | null;
}

const ImageUploadForm: React.FC<IImageUploadFormProps> = ({ setImage, image }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [isOver, setIsOver] = useState(false);

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

        const droppedImage = event.dataTransfer.files[0];
        if (droppedImage) {
            validateAndSetImage(droppedImage);
        }
    };

    const validateAndSetImage = (fileToValidate: File) => {
        const validation: IImageValidationResponse = validateImage(fileToValidate, 0);
        if (validation.valid) {
            setImage(fileToValidate);
        } else {
            alert(validation.errors.join(" | "));
        }
    }

    const onChangeSelectImage = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            validateAndSetImage(event.target.files[0]);
        }
    }

    const ImageInfo = image ? (
        <ListItem>
            <ListItemText
                primary={image.name}
                secondary={
                    (() => {
                        const validation: IImageValidationResponse = validateImage(image, 0);
                        return validation.valid ? getReadablyFileSize(image.size)
                            : <Typography style={{ color: '#f24444' }}>{validation.errors.join(" | ")}</Typography>
                    })()
                }
            />
        </ListItem>
    ) : null;

    const onClick = () => {
        if (inputRef.current) {
            inputRef.current.click()
        }
    }

    const validFileExtensions = import.meta.env.VITE_APP_UPLOADED_FILES_FILE_FORMATS.split(" ");

    return (
        <Container disableGutters maxWidth='sm'>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box component="div"
                        sx={{
                            p: 2, border: '2px dashed grey',
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "200px"
                        }}
                    >
                        <Box className="dropzone"
                            component="div"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            sx={{
                                bgcolor: isOver ? 'primary.main' : 'inherit',
                            }}
                        >
                            <Typography sx={{ ml: 2, flex: 1, textAlign: "center" }} variant='h6' component='div'>
                                {"Foto per Drag und Drop hinzufügen oder Knopf 'Foto auswählen' drücken um es direkt im Dateiexplorer auswählen."}
                            </Typography>
                            <Typography sx={{ ml: 2, flex: 1, textAlign: "center" }} variant='subtitle2' component='div'>
                                {`Nur Bilder mit Dateiendung ${validFileExtensions.map((ext: any) => ext)} werden akzeptiert`}
                            </Typography>
                            <input
                                type="file"
                                onChange={onChangeSelectImage}
                                hidden
                                ref={inputRef}
                                accept={validFileExtensions.map((ext: any) => `.${ext}`).join(',')}
                            />
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Button variant="outlined" onClick={onClick}>
                        {'Foto auswählen'}
                    </Button>
                </Grid>
                {
                    image && (
                        <Grid item xs={12}>
                            <Box component="div">
                                <Typography sx={{ ml: 2, flex: 1, textAlign: "left" }} variant='h6' component='div'>
                                    {'Bereits ausgewähltes Foto:'}
                                </Typography>
                                <List disablePadding sx={{ width: '100%' }}>
                                    {ImageInfo}
                                </List>
                            </Box>
                        </Grid>
                    )
                }
            </Grid>
        </Container>
    )
}

export default ImageUploadForm
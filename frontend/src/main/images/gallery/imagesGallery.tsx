import React from "react";
import {
    Box,
    ImageList,
    ImageListItem,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { openPreviewImageDialog } from "@/store/ui/images/images.slice";
import { getImages } from "@/store/entities/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import { formatGermanDateTime } from "@/common/components/dateUtils";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const ImagesGallery: React.FC = () => {
    const dispatch = useAppDispatch();
    const images = useAppSelector(getImages);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isMediumUp = useMediaQuery(theme.breakpoints.up('md'));

    // Adjust the number of columns based on screen size
    let cols = 3;
    if (isSmallScreen) {
        cols = 2;
    } else if (isMediumUp) {
        cols = 4;
    }

    const handleImageClick = (image: any) => {
        dispatch(openPreviewImageDialog({
            id: image.id,
            name: image.name,
            url: image.url,
            created_at: formatGermanDateTime(new Date(image.created_at))
        }));
    };

    return (
        <>
            <ImageList cols={cols} gap={8}>
                {images.map((image) => (
                    <ImageListItem
                        key={image.id}
                        onClick={() => handleImageClick(image)}
                        style={{ cursor: "pointer" }}
                    >
                        <AuthenticatedImage
                            url={`${MEDIA_BASE_URL}${image.url}`}
                            alt={image.name}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 8
                            }}
                        />
                    </ImageListItem>
                ))}
            </ImageList>
            <Box
                sx={{ textAlign: "center" }}
            >
                <Typography
                    variant="subtitle2"
                    color="textSecondary"
                >
                    {images.length} Foto{images.length !== 1 ? "s" : ""}
                </Typography>
            </Box>
        </>
    );
};

export default ImagesGallery;

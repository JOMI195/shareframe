import React, { useState } from "react";
import {
    Box,
    ImageList,
    ImageListItem,
    Typography,
    useMediaQuery,
    useTheme,
    Pagination,
    Stack,
    Skeleton
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { openPreviewImageDialog } from "@/store/ui/images/images.slice";
import { getApi as imagesApi, getImages } from "@/store/entities/images/images.slice";
import { getApi as friendshipsApi } from "@/store/entities/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const ITEMS_PER_PAGE = 12;
const SKELETON_COLS = 3;

const ImagesGallery: React.FC = () => {
    const dispatch = useAppDispatch();
    const images = useAppSelector(getImages);
    const imagesLoading = useAppSelector(imagesApi).loading;
    const friendshipsLoading = useAppSelector(friendshipsApi).loading;
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isMediumUp = useMediaQuery(theme.breakpoints.up('md'));

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE);
    const currentImages = images.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Adjust the number of columns based on screen size
    let cols = 3;
    if (isSmallScreen) {
        cols = 2;
    } else if (isMediumUp) {
        cols = 4;
    }

    const handleImageClick = (image: any) => {
        dispatch(openPreviewImageDialog({ image: image }));
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const LoadingSkeleton = () => (
        <ImageList cols={cols} gap={8}>
            {[...Array(cols * SKELETON_COLS)].map((_, index) => (
                <ImageListItem key={index}>
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={100}
                        sx={{
                            borderRadius: 1,
                            backgroundColor: theme.palette.action.hover
                        }}
                    />
                </ImageListItem>
            ))}
        </ImageList>
    );

    return (
        <Stack spacing={2}>
            {(imagesLoading || friendshipsLoading) ? (
                <LoadingSkeleton />
            ) : (
                <ImageList cols={cols} gap={8}>
                    {currentImages.map((image) => (
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
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                {(imagesLoading && friendshipsLoading) ? (
                    <Skeleton width={200} height={40} />
                ) : (
                    <>
                        {totalPages > 1 && (
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                size={"large"}
                                showFirstButton
                                showLastButton
                            />
                        )}

                        <Typography
                            variant="subtitle2"
                            color="textSecondary"
                            textAlign={"center"}
                        >
                            {images.length} Foto{images.length !== 1 ? "s" : ""}
                        </Typography>
                    </>
                )}
            </Box>
        </Stack>
    );
};

export default ImagesGallery;
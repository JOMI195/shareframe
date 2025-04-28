import React from "react";
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
import {
    getApi as imagesApi,
    getImagesPaginated,
    getImagesPaginatedPageSize
} from "@/store/entities/images/images.slice";
import { getApi as friendshipsApi } from "@/store/entities/friendships/friendships.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import { IImage } from "@/types";
import { setImagesPaginatedPage } from "@/store/entities/images/images.actions";
import FilterControls from "./filters/filters";
import { getVariant } from "@/common/utils/images";
import DataNotFound from "@/common/components/dataNotFound";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const SKELETON_COLS = 3;

const ImagesGallery: React.FC = () => {
    const dispatch = useAppDispatch();
    const imagesPaginated = useAppSelector(getImagesPaginated);
    const pageSize = useAppSelector(getImagesPaginatedPageSize);
    const imagesLoading = useAppSelector(imagesApi).loading;
    const friendshipsLoading = useAppSelector(friendshipsApi).loading;
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

    const handleImageClick = (image: IImage) => {
        dispatch(openPreviewImageDialog({ image: image }));
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
        dispatch(setImagesPaginatedPage(page));
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

    // Calculate total pages from the count in the paginated response
    const totalPages = Math.ceil(imagesPaginated.count / pageSize);

    return (
        <Stack spacing={2}>
            <FilterControls />
            {(imagesLoading || friendshipsLoading) ? (
                <LoadingSkeleton />
            ) :
                imagesPaginated.results.length !== 0 ?
                    (
                        <ImageList cols={cols} gap={8}>
                            {imagesPaginated.results.map((image) => (
                                <ImageListItem
                                    key={image.id}
                                    onClick={() => handleImageClick(image)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <AuthenticatedImage
                                        url={`${MEDIA_BASE_URL}${getVariant(image, "thumbnail")?.url}`}
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
                    ) : (
                        <DataNotFound notFoundMessage={"Keine Fotos vorhanden"} />
                    )}

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                {(imagesLoading || friendshipsLoading) ? (
                    <Skeleton width={200} height={40} />
                ) : (
                    <>
                        {totalPages > 1 && (
                            <Pagination
                                count={totalPages}
                                page={imagesPaginated.page}
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
                            {imagesPaginated.count} Foto{imagesPaginated.count !== 1 ? "s" : ""}
                        </Typography>
                    </>
                )}
            </Box>
        </Stack>
    );
};

export default ImagesGallery;
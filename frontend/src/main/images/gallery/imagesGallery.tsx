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
import { getDialogs as imagesDialogs, openCreateImageDialog, openPreviewImageDialog, selectImage } from "@/store/ui/images/images.slice";
import {
    getApi as imagesApi,
    getImagesPaginated,
    getImagesPaginatedPageSize
} from "@/store/entities/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import { IImage } from "@/types";
import { fetchImages, setImagesPaginatedPage } from "@/store/entities/images/images.actions";
import FilterControls from "./filters/filters";
import { getVariantUrl } from "@/common/utils/images";
import DataNotFound from "@/common/components/dataNotFound";
import { onActivateKey } from "@/common/utils/keyboard";
import SelectableElement from "../../../common/components/selectableElement";
import { useMinimumLoading } from "@/hooks/loading/useMinimumLoading";
import SelectionBar from "./selectionBar";
import { scrollToTop } from "@/common/utils/scroll";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const SKELETON_COLS = 3;

const ImagesGallery: React.FC = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const imagesPaginated = useAppSelector(getImagesPaginated);
    const pageSize = useAppSelector(getImagesPaginatedPageSize);
    const imagesLoading = useAppSelector(imagesApi).loading;
    const imagesFailed = useAppSelector(imagesApi).imagesFailed;
    const imagesStale = useAppSelector(imagesApi).imagesStale;
    const showSkeleton = useMinimumLoading(imagesLoading && (imagesStale || imagesPaginated.results.length === 0));

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isMediumUp = useMediaQuery(theme.breakpoints.up('md'));

    const selectionDialog = useAppSelector(imagesDialogs).selection;
    const isSelectionDialogOpen = selectionDialog.open;
    const selectedImages = selectionDialog.selectedImages;

    // Adjust the number of columns based on screen size
    let cols = 3;
    if (isSmallScreen) {
        cols = 2;
    } else if (isMediumUp) {
        cols = 4;
    }

    const handleImageClick = (image: IImage) => {
        if (isSelectionDialogOpen) {
            // when clicked again on the image, deselect with keepImage: false
            dispatch(selectImage({ image: image, keepImageOnReSelect: false }));
            return;
        }
        dispatch(openPreviewImageDialog({ image: image }));
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
        dispatch(setImagesPaginatedPage(page));
        scrollToTop();
    };

    const renderLoadingSkeleton = () => (
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

    const renderPagination = (showCount = false) => {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                {showSkeleton ? (
                    <Skeleton width={200} height={40} />
                ) : (
                    <>
                        {totalPages > 1 && (
                            <Pagination
                                count={totalPages}
                                page={imagesPaginated.page}
                                onChange={handlePageChange}
                                color="primary"
                                size="medium"
                                showFirstButton={!isSmallScreen}
                                showLastButton={!isSmallScreen}
                            />
                        )}

                        {showCount && (
                            <Typography
                                variant="subtitle2"
                                color="textSecondary"
                                sx={{
                                    textAlign: "center"
                                }}
                            >
                                {imagesPaginated.count} Foto{imagesPaginated.count !== 1 ? "s" : ""}
                            </Typography>
                        )}
                    </>
                )}
            </Box>
        );
    }

    return (
        <Stack spacing={2}>
            <FilterControls />
            {isSelectionDialogOpen && <SelectionBar />}
            {isSmallScreen && imagesPaginated.page > 1 && renderPagination()}
            {showSkeleton ? renderLoadingSkeleton() :
                imagesPaginated.results.length !== 0 ?
                    (
                        <ImageList cols={cols} gap={8}>
                            {imagesPaginated.results.map((image) => (
                                <ImageListItem key={image.id}>
                                    {/* The button sits inside the li, so the list keeps its list semantics. */}
                                    <Box
                                        onClick={() => handleImageClick(image)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={image.display_name || image.name}
                                        aria-pressed={isSelectionDialogOpen ? selectedImages.some((selected) => selected.id === image.id) : undefined}
                                        onKeyDown={(event) => onActivateKey(event, () => handleImageClick(image))}
                                        sx={{ cursor: "pointer", height: "100%", borderRadius: 1, display: "flex", flexDirection: "column" }}
                                    >
                                    <SelectableElement
                                        elementToSelect={image}
                                        selectedElements={selectedImages}
                                        selectionEnabled={isSelectionDialogOpen}
                                    >
                                        <AuthenticatedImage
                                            url={`${MEDIA_BASE_URL}${getVariantUrl(image, "thumbnail")}`}
                                            alt={image.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                borderRadius: 8
                                            }}
                                        />
                                    </SelectableElement>
                                    </Box>
                                </ImageListItem>
                            ))}
                        </ImageList>
                    ) : (
                        imagesFailed ? (
                            <DataNotFound
                                notFoundMessage={"Fotos konnten nicht geladen werden"}
                                action={{ label: "Erneut versuchen", onClick: () => dispatch(fetchImages(imagesPaginated.page, pageSize)) }}
                            />
                        ) : (
                            <DataNotFound
                                notFoundMessage={"Keine Fotos vorhanden"}
                                action={{ label: "Foto hochladen", onClick: () => dispatch(openCreateImageDialog()) }}
                            />
                        )
                    )}

            {renderPagination(true)}
        </Stack>
    );
};

export default ImagesGallery;
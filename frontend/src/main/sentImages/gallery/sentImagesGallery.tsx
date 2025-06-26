import React from "react";
import {
    Box,
    ImageList,
    ImageListItem,
    Typography,
    useMediaQuery,
    useTheme,
    ImageListItemBar,
    Stack,
    Pagination,
    Skeleton
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    getApi as getImagesApi,
    getSentImagesPaginated,
    getSentImagesPaginatedPageSize,
} from "@/store/entities/images/images.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SendIcon from '@mui/icons-material/Send';
import PanoramaIcon from '@mui/icons-material/Panorama';
import { ISentImage, ISentImagesFilters } from "@/types";
import FilterControls from "./filters/filters";
import { getDialogs, openPreviewSentImageDialog } from "@/store/ui/sentImages/sentImages.slice";
import { getVariant } from "@/common/utils/images";
import { getApi as getFriendshipsApi } from "@/store/entities/friendships/friendships.slice";
import DataNotFound from "@/common/components/dataNotFound";
import { setSentImagesFilters, setSentImagesPaginatedPage } from "@/store/entities/images/images.actions";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const SKELETON_COLS = 3;

const SentImagesGallery = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getImagesApi).loading;
    const friendshipsLoading = useAppSelector(getFriendshipsApi).loading;
    const theme = useTheme();

    const sentImagesPaginated = useAppSelector(getSentImagesPaginated);
    const pageSize = useAppSelector(getSentImagesPaginatedPageSize);

    const { filter: filterDialog } = useAppSelector(getDialogs);
    const hideToYouFilter = filterDialog.hideToYouFilter;

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isMediumUp = useMediaQuery(theme.breakpoints.up('md'));

    // Adjust columns based on screen size
    let cols = 3;
    if (isSmallScreen) {
        cols = 1;
    } else if (isMediumUp) {
        cols = 3;
    }

    const currentPage = sentImagesPaginated.page;
    const totalPages = Math.ceil(sentImagesPaginated.count / pageSize);

    const handleImageClick = (sentImage: ISentImage) => {
        dispatch(openPreviewSentImageDialog({ sentImage: sentImage }));
    };

    const getStatusIcon = (isExpired: boolean) => {
        return isExpired ? (
            <VisibilityOffIcon sx={{ color: theme.palette.error.main, fontSize: '1rem' }} />
        ) : (
            <VisibilityIcon sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
        );
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
        dispatch(setSentImagesPaginatedPage(page));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFiltersChange = (newFilters: ISentImagesFilters) => {
        dispatch(setSentImagesFilters({
            status: newFilters.status,
            shipping: newFilters.shipping,
            sender: newFilters.sender,
            receiver: newFilters.receiver,
        }));

        dispatch(setSentImagesPaginatedPage(1));
    };

    const renderSenderReceiverInfo = (sentImage: ISentImage) => {
        const isSender = sentImage.sender === user.me.username;
        const isReceiver = sentImage.reciever === user.me.username;

        return (
            <Box sx={{
                display: 'flex',
                flexDirection: "column",
                alignItems: 'flex-start',
                justifyContent: "center",
                width: '100%',
                overflow: 'hidden'
            }}>
                <Box display={"flex"} alignItems={"center"}>
                    <SendIcon sx={{ fontSize: '1rem' }} />
                    <Typography
                        noWrap
                        component="span"
                        sx={{
                            ml: 1,
                            fontWeight: isSender ? 700 : "inherit",
                            color: isSender ? "secondary.main" : "inherit",
                        }}
                    >
                        {isSender ? 'Du' : sentImage.sender}
                    </Typography>
                </Box>
                <Box display={"flex"} alignItems={"center"}>
                    <PanoramaIcon sx={{ fontSize: '1rem' }} />
                    <Typography
                        noWrap
                        component="span"
                        sx={{
                            ml: 1,
                            fontWeight: isReceiver ? 700 : "inherit",
                            color: isReceiver ? "secondary.main" : "inherit",
                        }}
                    >
                        {isReceiver ? 'Du' : sentImage.reciever}
                    </Typography>
                </Box>
            </Box>
        );
    };

    const LoadingSkeleton = () => (
        <ImageList cols={cols} gap={8}>
            {[...Array(cols * SKELETON_COLS)].map((_, index) => (
                <ImageListItem key={index}>
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={200}
                        sx={{
                            borderRadius: 1,
                            backgroundColor: theme.palette.action.hover
                        }}
                    />
                </ImageListItem>
            ))}
        </ImageList>
    );

    interface PaginationComponentProps {
        showCount?: boolean;
    }

    const PaginationComponent: React.FC<PaginationComponentProps> = ({ showCount = false }) => {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                {loading ? (
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

                        {showCount && (
                            <>
                                <Typography textAlign={"center"} variant="subtitle2" color="textSecondary">
                                    {sentImagesPaginated.count} geteilte{sentImagesPaginated.count !== 1 ? " Fotos" : "s Foto"}
                                </Typography>
                                <Typography textAlign={"center"} variant="caption" color="textSecondary">
                                    (Abgelaufene Aktivität wird nach 14 Tagen gelöscht)
                                </Typography>
                            </>
                        )}
                    </>
                )}
            </Box>
        );
    }

    return (
        <Stack spacing={2}>
            <FilterControls
                onFiltersChange={handleFiltersChange}
                disabled={loading}
            />
            {isSmallScreen && currentPage > 1 && (
                <PaginationComponent />
            )}
            {(loading || friendshipsLoading) ? (
                <LoadingSkeleton />
            ) : sentImagesPaginated.results.length !== 0 ? (
                <ImageList cols={cols} gap={8}>
                    {sentImagesPaginated.results.map((sentImage) => {
                        const expiryDate = new Date(sentImage.expires_at);
                        const isExpired = expiryDate < new Date();

                        const shouldHide = hideToYouFilter &&
                            (sentImage.reciever === user.me.username && sentImage.sender !== user.me.username);

                        return (
                            <ImageListItem
                                key={sentImage.id}
                                onClick={() => handleImageClick(sentImage)}
                                style={{ cursor: "pointer" }}
                            >
                                <AuthenticatedImage
                                    url={`${MEDIA_BASE_URL}${getVariant(sentImage.image, "thumbnail")?.url}`}
                                    alt={sentImage.image.name}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: 8,
                                    }}
                                    hideToYouFilter={shouldHide}
                                />
                                <ImageListItemBar
                                    sx={{ borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }}
                                    title={
                                        renderSenderReceiverInfo(sentImage)
                                    }
                                    subtitle={
                                        <Box sx={{ display: 'flex', flexDirection: "column", justifyContent: 'center', mt: 2 }}>
                                            {formatGermanDateTime(new Date(sentImage.sent_at))}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getStatusIcon(isExpired)}
                                                <Typography variant="caption">
                                                    {isExpired ? 'Abgelaufen' : 'Aktiv'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ImageListItem>
                        );
                    })}
                </ImageList>
            ) : (
                <DataNotFound notFoundMessage={"Keine erhaltenen oder gesendeten Fotos gefunden oder vorhanden"} />
            )}

            <PaginationComponent showCount={true} />
        </Stack >
    );
};

export default SentImagesGallery;
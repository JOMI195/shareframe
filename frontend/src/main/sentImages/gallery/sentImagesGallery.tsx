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
    getSentImagesFilters,
} from "@/store/entities/images/images.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import SendIcon from '@mui/icons-material/Send';
import { ISentImage, ISentImagesFilters } from "@/types";
import FilterControls from "./filters/filters";
import { getDialogs, openPreviewSentImageDialog } from "@/store/ui/sentImages/sentImages.slice";
import { getVariantUrl } from "@/common/utils/images";
import DataNotFound from "@/common/components/dataNotFound";
import { onActivateKey } from "@/common/utils/keyboard";
import { fetchSentImagesPaginated, setSentImagesFilters, setSentImagesPaginatedPage } from "@/store/entities/images/images.actions";
import { useMinimumLoading } from "@/hooks/loading/useMinimumLoading";
import { getSentImageState } from "../sentImageStatus";
import SentImageStatusLabel from "../sentImageStatusLabel";
import UserAvatar from "@/common/components/userAvatar";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const SKELETON_COLS = 3;

const SentImagesGallery = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getImagesApi).loading;
    const sentImagesFailed = useAppSelector(getImagesApi).sentImagesFailed;
    const sentImagesStale = useAppSelector(getImagesApi).sentImagesStale;
    const appliedFilters = useAppSelector(getSentImagesFilters);
    const sentImagesPaginated = useAppSelector(getSentImagesPaginated);
    const showSkeleton = useMinimumLoading(loading && (sentImagesStale || sentImagesPaginated.results.length === 0));
    const theme = useTheme();

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
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center"
                    }}>
                    <SendIcon sx={{ fontSize: '1rem' }} />
                    <UserAvatar
                        username={sentImage.sender}
                        url={sentImage.sender_avatar}
                        size={28}
                        sx={{ ml: 1, flexShrink: 0 }}
                    />
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
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center"
                    }}>
                    {/* Takes the icon's width so the receiver stays aligned with the sender row. */}
                    <Box sx={{ width: '1rem', flexShrink: 0 }} />
                    <UserAvatar
                        username={sentImage.reciever}
                        url={sentImage.reciever_avatar}
                        size={28}
                        sx={{ ml: 1, flexShrink: 0 }}
                    />
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

    const renderLoadingSkeleton = () => (
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
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                size="medium"
                                showFirstButton={!isSmallScreen}
                                showLastButton={!isSmallScreen}
                            />
                        )}

                        {showCount && (
                            <>
                                <Typography variant="subtitle2" color="textSecondary" sx={{
                                    textAlign: "center"
                                }}>
                                    {sentImagesPaginated.count} geteilte{sentImagesPaginated.count !== 1 ? " Fotos" : "s Foto"}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{
                                    textAlign: "center"
                                }}>
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
                disabled={showSkeleton}
            />
            {isSmallScreen && currentPage > 1 && renderPagination()}
            {showSkeleton ? renderLoadingSkeleton() : sentImagesPaginated.results.length !== 0 ? (
                <ImageList cols={cols} gap={8}>
                    {sentImagesPaginated.results.map((sentImage) => {
                        const state = getSentImageState(sentImage);

                        const shouldHide = hideToYouFilter &&
                            (sentImage.reciever === user.me.username && sentImage.sender !== user.me.username);

                        return (
                            <ImageListItem
                                key={sentImage.id}
                                onClick={() => handleImageClick(sentImage)}
                                role="button"
                                tabIndex={0}
                                aria-label={`${sentImage.image.display_name || sentImage.image.name}, ${sentImage.sender === user.me.username ? `an ${sentImage.reciever === user.me.username ? "dich" : sentImage.reciever}` : `von ${sentImage.sender}`}`}
                                onKeyDown={(event) => onActivateKey(event, () => handleImageClick(sentImage))}
                                style={{ cursor: "pointer" }}
                            >
                                <AuthenticatedImage
                                    url={`${MEDIA_BASE_URL}${getVariantUrl(sentImage.image, "thumbnail")}`}
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
                                            {formatGermanDateTime(new Date(
                                                state === 'scheduled' && sentImage.scheduled_for ? sentImage.scheduled_for : sentImage.sent_at
                                            ))}
                                            <SentImageStatusLabel state={state} variant="caption" />
                                        </Box>
                                    }
                                />
                            </ImageListItem>
                        );
                    })}
                </ImageList>
            ) : (
                sentImagesFailed ? (
                    <DataNotFound
                        notFoundMessage={"Aktivitäten konnten nicht geladen werden"}
                        action={{ label: "Erneut versuchen", onClick: () => dispatch(fetchSentImagesPaginated(currentPage, pageSize, appliedFilters)) }}
                    />
                ) : (
                    <DataNotFound notFoundMessage={"Noch keine gesendeten oder erhaltenen Fotos"} />
                )
            )}

            {renderPagination(true)}
        </Stack >
    );
};

export default SentImagesGallery;
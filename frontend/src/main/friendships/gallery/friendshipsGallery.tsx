import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    useTheme,
    Pagination,
    Stack,
    Skeleton,
    Grid,
    CardActions,
    Tooltip,
    IconButton,
    useMediaQuery,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { openCreateFriendshipsDialog, openDeleteFriendshipsDialog } from "@/store/ui/friendships/friendships.slice";
import { IFriendship } from "@/types";
import DeleteIcon from '@mui/icons-material/Delete';
import DataNotFound from "@/common/components/dataNotFound";
import UserAvatar from "@/common/components/userAvatar";
import { useMinimumLoading } from "@/hooks/loading/useMinimumLoading";

const ITEMS_PER_PAGE = 6;

const FriendshipsGallery: React.FC = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const friendships = useAppSelector(getFriendships);
    const friendshipsApi = useAppSelector(getApi);
    const showSkeleton = useMinimumLoading(friendshipsApi.loading && friendshipsApi.lastFetch === null);
    const user = useAppSelector(getUser);

    const [currentPage, setCurrentPage] = useState(1);
    // Filtered before paging, so every page is full and the page count is right.
    const friends = friendships.filter((friendship) => friendship.status === "accepted");
    const totalPages = Math.ceil(friends.length / ITEMS_PER_PAGE);
    const currentFriendships = friends.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const deleteFriendButtonClickHandle = (friendship: IFriendship) => {
        dispatch(openDeleteFriendshipsDialog({ friendshipId: friendship.id }))
    }

    const handlePageChange = (
        _event: React.ChangeEvent<unknown>,
        page: number
    ) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const renderLoadingSkeletonCard = () => (
        <Card
            sx={{
                position: "relative",
                width: "100%",
                paddingTop: "100%",
                boxSizing: "border-box",
            }}
        >
            <Skeleton
                variant="rectangular"
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: 1,
                    backgroundColor: theme.palette.action.hover,
                }}
            />
        </Card>
    );

    const renderFriendCard = (friendship: IFriendship) => {
        const fromThem = friendship.sender !== user.me.username;
        const friend = fromThem ? friendship.sender : friendship.reciever;
        const friendAvatar = fromThem ? friendship.sender_avatar : friendship.reciever_avatar;

        return (
            <Card>
                <CardContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                    }}
                >
                    <UserAvatar username={friend} url={friendAvatar} size={80} />
                    <Typography variant="h6" sx={{ mt: 1 }}>
                        {friend}
                    </Typography>
                </CardContent>
                <CardActions>
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%"
                    }}>
                        <Stack direction="row">
                            <Tooltip title={"Freundschaft beenden"}>
                                <IconButton
                                    onClick={() => { deleteFriendButtonClickHandle(friendship) }}
                                    aria-label="Freundschaft beenden"
                                    color="error"
                                    sx={{ width: 44, height: 44 }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Box>
                </CardActions>
            </Card>
        );
    };

    const renderPagination = (showCount = false) => {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 2,
                }}
            >
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
                            <Typography variant="subtitle2" color="textSecondary" sx={{
                                textAlign: "center"
                            }}>
                                {friends.length} Freund{friends.length !== 1 ? "e" : ""}
                            </Typography>
                        )}
                    </>
                )}
            </Box>
        );
    }

    return (
        <Stack spacing={2}>
            {isSmallScreen && currentPage > 1 && renderPagination()}
            <Box sx={{ px: 2 }}>
                {showSkeleton ? (
                    <Grid container spacing={2}>
                        {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                            <Grid
                                key={index}
                                size={{
                                    xs: 6,
                                    sm: 4,
                                    md: 3
                                }}>
                                {renderLoadingSkeletonCard()}
                            </Grid>
                        ))}
                    </Grid>
                ) : currentFriendships.length !== 0 ? (
                    <Grid container spacing={2}>
                        {currentFriendships
                            .map((friendship) => (
                                <Grid
                                    key={friendship.id}
                                    size={{
                                        xs: 6,
                                        sm: 4,
                                        md: 3
                                    }}>
                                    {renderFriendCard(friendship)}
                                </Grid>
                            ))}
                    </Grid>
                ) : (
                    <DataNotFound
                        notFoundMessage={"Keine Freundschaften vorhanden"}
                        action={{ label: "Freund hinzufügen", onClick: () => dispatch(openCreateFriendshipsDialog()) }}
                    />
                )}
            </Box>

            {renderPagination(true)}
        </Stack>
    );
};

export default FriendshipsGallery;

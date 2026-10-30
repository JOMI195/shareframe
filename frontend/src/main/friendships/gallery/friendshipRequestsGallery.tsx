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
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    useMediaQuery,
} from "@mui/material";
import ConfirmDialog from "@/common/components/confirmDialog";
import { getIncomingPendingRequests } from "../pendingRequests";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { IFriendship } from "@/types";
import { acceptFrindshipRequest, fetchFriendships, rejectFrindshipRequest, withdrawFriendshipRequest } from "@/store/entities/friendships/friendships.actions";
import DataNotFound from "@/common/components/dataNotFound";
import UserAvatar from "@/common/components/userAvatar";
import { useMinimumLoading } from "@/hooks/loading/useMinimumLoading";

const ITEMS_PER_PAGE = 6;

const FriendshipRequestsGallery: React.FC = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const friendships = useAppSelector(getFriendships);
    const friendshipsLoading = useAppSelector(getApi).loading;
    const showSkeleton = useMinimumLoading(friendshipsLoading);
    const user = useAppSelector(getUser);

    const [currentPage, setCurrentPage] = useState(1);
    const [requestToReject, setRequestToReject] = useState<IFriendship | null>(null);
    const [acceptingId, setAcceptingId] = useState<number | null>(null);

    // Filtered before paging, so every page is full and the page count is right.
    const incomingRequests = getIncomingPendingRequests(friendships, user.me.username);
    const outgoingRequests = friendships.filter(
        (friendship) => friendship.status === "pending" && friendship.sender === user.me.username
    );
    const totalPages = Math.ceil(incomingRequests.length / ITEMS_PER_PAGE);
    const filteredRequests = incomingRequests.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleFriendshipReject = async (friendship: IFriendship) => {
        setRequestToReject(null);
        await dispatch(rejectFrindshipRequest(friendship.id));
        dispatch(fetchFriendships());
    }

    const handleFriendshipAcccept = async (friendship: IFriendship) => {
        setAcceptingId(friendship.id);
        await dispatch(acceptFrindshipRequest(friendship.id));
        setAcceptingId(null);
        dispatch(fetchFriendships());
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

    const renderFriendRequestCard = (friendship: IFriendship) => {
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
                    <Typography variant="h6" noWrap sx={{ mt: 1, maxWidth: "100%" }}>
                        {friend}
                    </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Stack spacing={1} sx={{ width: "100%" }}>
                        <Button
                            onClick={() => handleFriendshipAcccept(friendship)}
                            variant="contained"
                            loading={acceptingId === friendship.id}
                            fullWidth
                            aria-label="Anfrage annehmen"
                        >
                            Annehmen
                        </Button>
                        <Button
                            onClick={() => setRequestToReject(friendship)}
                            disabled={acceptingId === friendship.id}
                            color="error"
                            fullWidth
                            aria-label="Anfrage ablehnen"
                        >
                            Ablehnen
                        </Button>
                    </Stack>
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
                                {incomingRequests.length} Freundschaftsanfrage{incomingRequests.length !== 1 ? "n" : ""}
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
                ) : filteredRequests.length !== 0 ? (
                    <Grid container spacing={2}>
                        {filteredRequests
                            .map((friendship) => (
                                <Grid
                                    key={friendship.id}
                                    size={{
                                        xs: 6,
                                        sm: 4,
                                        md: 3
                                    }}>
                                    {renderFriendRequestCard(friendship)}
                                </Grid>
                            ))}
                    </Grid>

                ) : (
                    <DataNotFound notFoundMessage={"Keine Freundschaftsanfragen vorhanden"} />
                )}
            </Box>

            {renderPagination(true)}

            {!showSkeleton && outgoingRequests.length > 0 && (
                <Box sx={{ px: 2 }}>
                    <Typography variant="subtitle1">Gesendete Anfragen</Typography>
                    <List>
                        {outgoingRequests.map((friendship) => (
                            <ListItem
                                key={friendship.id}
                                disableGutters
                                secondaryAction={
                                    <Button onClick={() => dispatch(withdrawFriendshipRequest(friendship.id))}>
                                        Zurückziehen
                                    </Button>
                                }
                            >
                                <ListItemAvatar>
                                    <UserAvatar username={friendship.reciever} url={friendship.reciever_avatar} size={40} />
                                </ListItemAvatar>
                                <ListItemText primary={friendship.reciever} secondary="Wartet auf Antwort" />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            <ConfirmDialog
                open={requestToReject !== null}
                title={`Anfrage von ${requestToReject?.sender ?? ""} ablehnen?`}
                confirmLabel="Ablehnen"
                destructive
                onConfirm={() => requestToReject && handleFriendshipReject(requestToReject)}
                onCancel={() => setRequestToReject(null)}
            >
                Die Person kann dir später erneut eine Anfrage senden.
            </ConfirmDialog>
        </Stack>
    );
};

export default FriendshipRequestsGallery;

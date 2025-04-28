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
    Avatar,
    Grid,
    CardActions,
    Tooltip,
    IconButton,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { IFriendship } from "@/types";
import DeleteIcon from '@mui/icons-material/Delete';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { acceptFrindshipRequest, fetchFriendships, rejectFrindshipRequest } from "@/store/entities/friendships/friendships.actions";
import DataNotFound from "@/common/components/dataNotFound";

const ITEMS_PER_PAGE = 6;

const FriendshipRequestsGallery: React.FC = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const friendships = useAppSelector(getFriendships);
    const friendshipsLoading = useAppSelector(getApi).loading;
    const user = useAppSelector(getUser);

    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(friendships.length / ITEMS_PER_PAGE);
    const currentFriendships = friendships.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const filteredRequests = currentFriendships
        // Only consider pending or rejected requests
        .filter(
            (friendship) =>
                friendship.status === "pending"
        )
        // Only show friend requests received by the current user
        .filter((friendship) => friendship.reciever === user.me.username)
        // Exclude friend requests if an accepted friendship already exists between user and friend
        .filter((friendship) => {
            // For a friend request received by the user, the friend is the sender
            const friend = friendship.sender;
            // Check in the complete friendships array for an accepted friendship with that friend
            const acceptedExists = friendships.some(
                (f) =>
                    f.status === "accepted" &&
                    (
                        // Either the current user sent the accepted request...
                        (f.sender === user.me.username && f.reciever === friend) ||
                        // ...or the current user received the accepted request.
                        (f.reciever === user.me.username && f.sender === friend)
                    )
            );
            return !acceptedExists;
        })

    const handleFriendshipReject = async (friendship: IFriendship) => {
        await dispatch(rejectFrindshipRequest(friendship.id));
        dispatch(fetchFriendships());
    }

    const handleFriendshipAcccept = async (friendship: IFriendship) => {
        await dispatch(acceptFrindshipRequest(friendship.id));
        dispatch(fetchFriendships());
    }

    const handlePageChange = (
        _event: React.ChangeEvent<unknown>,
        page: number
    ) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const LoadingSkeletonCard = () => (
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

    const FriendRequestCard = ({ friendship }: { friendship: IFriendship }) => {
        const isMyRequest = friendship.sender === user.me.username;

        const friend =
            friendship.sender !== user.me.username
                ? friendship.sender
                : friendship.reciever;

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
                    <Avatar sx={{ width: 56, height: 56 }} alt={friend}>
                        {friend.charAt(0).toUpperCase()}
                    </Avatar>
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
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                        >
                            {!isMyRequest && friendship.status !== "rejected" && (
                                <Tooltip title="Freundschaftsanfrage ablehnen">
                                    <IconButton
                                        onClick={() => handleFriendshipReject(friendship)}
                                        color="error"
                                        aria-label="Anfrage ablehnen"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {!isMyRequest && friendship.status !== "rejected" && (
                                <Tooltip title="Freundschaftsanfrage annehmen">
                                    <IconButton
                                        onClick={() => handleFriendshipAcccept(friendship)}
                                        color="success"
                                        aria-label="Anfrage annehmen"
                                    >
                                        <HowToRegIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Box>
                </CardActions>
            </Card>
        );
    };


    return (
        <Stack spacing={2}>
            <Box sx={{ px: 2 }}>
                {friendshipsLoading ? (
                    <Grid container spacing={2}>
                        {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                            <Grid item key={index} xs={6} sm={4} md={3}>
                                <LoadingSkeletonCard />
                            </Grid>
                        ))}
                    </Grid>
                ) : filteredRequests.length !== 0 ? (
                    <Grid container spacing={2}>
                        {filteredRequests
                            .map((friendship) => (
                                <Grid item key={friendship.id} xs={6} sm={4} md={3}>
                                    <FriendRequestCard friendship={friendship} />
                                </Grid>
                            ))}
                    </Grid>

                ) : (
                    <DataNotFound notFoundMessage={"Keine Freundschaftsanfragen vorhanden"} />
                )}
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 2,
                }}
            >
                {friendshipsLoading ? (
                    <Skeleton width={200} height={40} />
                ) : (
                    <>
                        {totalPages > 1 && (
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                            />
                        )}

                        <Typography variant="subtitle2" color="textSecondary" textAlign="center">
                            {filteredRequests.length} Freundschaftsanfrage{filteredRequests.length !== 1 ? "n" : ""}
                        </Typography>
                    </>
                )}
            </Box>
        </Stack>
    );
};

export default FriendshipRequestsGallery;

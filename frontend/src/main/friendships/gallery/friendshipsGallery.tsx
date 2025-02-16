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
import { openDeleteFriendshipsDialog } from "@/store/ui/friendships/friendships.slice";
import { IFriendship } from "@/types";
import DeleteIcon from '@mui/icons-material/Delete';

const ITEMS_PER_PAGE = 6;

const FriendshipsGallery: React.FC = () => {
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

    const FriendCard = ({ friendship }: { friendship: IFriendship }) => {
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
                        <Stack direction="row">
                            <Tooltip title={"Freundschaft löschen"}>
                                <IconButton
                                    onClick={() => { deleteFriendButtonClickHandle(friendship) }}
                                    aria-label="delete"
                                    color="error"
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
                ) : (
                    <Grid container spacing={2}>
                        {currentFriendships
                            .filter((friendship) => friendship.status === "accepted")
                            .map((friendship) => (
                                <Grid item key={friendship.id} xs={6} sm={4} md={3}>
                                    <FriendCard friendship={friendship} />
                                </Grid>
                            ))}
                    </Grid>
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
                            {friendships.filter((friendship) => friendship.status === "accepted").length} Freund{friendships.filter((friendship) => friendship.status === "accepted").length !== 1 ? "e" : ""}
                        </Typography>
                    </>
                )}
            </Box>
        </Stack>
    );
};

export default FriendshipsGallery;

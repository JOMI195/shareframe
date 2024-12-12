import { Button, Dialog, DialogContent, Box, Grid, DialogTitle } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteFriendship } from "@/store/entities/friendships/friendships.actions";
import { closeDeleteFriendshipsDialog, getDialogs } from "@/store/ui/friendships/friendships.slice";
import { getApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { IFriendship } from "@/types";

const FriendshipDeleteDialog = () => {
    const dispatch = useAppDispatch();

    const { delete: deleteDialog } = useAppSelector(getDialogs);
    const friendships = useAppSelector(getFriendships);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).loading
    const friendshipToDelete = friendships.find((friendship => friendship.id === deleteDialog.friendshipId)) as IFriendship | undefined;
    const friendToDelete = friendshipToDelete ? (friendshipToDelete.sender === user.me.username ? friendshipToDelete.sender : friendshipToDelete.reciever) : undefined;

    const handleDialogClose = () => {
        dispatch(closeDeleteFriendshipsDialog());
    };

    const handleConfirmDelete = async () => {
        try {
            if (friendshipToDelete !== undefined) dispatch(deleteFriendship(friendshipToDelete.id))
        } catch (error) {
        } finally {
            handleDialogClose();
        }
    };

    return (
        <Dialog maxWidth="sm" fullWidth open={deleteDialog.open} onClose={handleDialogClose}>
            <Box
                sx={{ m: 2 }}
                component='form'
                id='delete-friendship-form'
                noValidate
            >
                <DialogTitle>{`Freundschaft mit ${friendToDelete} wirklich beenden`}</DialogTitle>
                <DialogContent>
                    <Grid
                        container
                        display={"flex"} justifyContent={"space-between"} alignItems={"center"}
                        spacing={2}
                    >
                        <Grid item xs={12} sm={6} sx={{ order: { xs: 4, md: 3 } }}>
                            <Button
                                onClick={handleDialogClose}
                                color="primary"
                                variant="outlined"
                                fullWidth
                            >
                                Abbrechen
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={6} sx={{ order: { xs: 3, md: 3 } }}>
                            <Button
                                type='submit'
                                onClick={handleConfirmDelete}
                                color="error"
                                disabled={loading}
                                variant="contained"
                                fullWidth
                            >
                                {"Löschen bestätigen"}
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Box>
        </Dialog>
    );
};

export default FriendshipDeleteDialog;

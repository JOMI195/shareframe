import { Button, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme } from "@mui/material";
import AppDialog from '@/common/components/appDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteFriendship } from "@/store/entities/friendships/friendships.actions";
import { closeDeleteFriendshipsDialog, getDialogs } from "@/store/ui/friendships/friendships.slice";
import { getApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { IFriendship } from "@/types";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";

const FriendshipDeleteDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { delete: deleteDialog } = useAppSelector(getDialogs);
    const friendships = useAppSelector(getFriendships);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).loading
    const friendshipToDelete = friendships.find((friendship => friendship.id === deleteDialog.friendshipId)) as IFriendship | undefined;
    const friendToDelete = friendshipToDelete ? (friendshipToDelete.sender === user.me.username ? friendshipToDelete.reciever : friendshipToDelete.sender) : undefined;

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const handleDialogClose = () => {
        dispatch(closeDeleteFriendshipsDialog());
    };

    const handleConfirmDelete = async () => {
        try {
            if (friendshipToDelete !== undefined) dispatch(deleteFriendship(friendshipToDelete.id))
        } catch {
            // cleanup happens in finally
        } finally {
            handleDialogClose();
        }
    };

    return (
        <AppDialog
            maxWidth="sm"
            fullWidth
            open={deleteDialog.open}
            onClose={handleDialogClose}
            aria-describedby='dialog-delete-friendship'
            slots={{
                transition: matches ? ZoomTransition : SlideTransition
            }}
        >
            <DialogTitle>{`Freundschaft mit ${friendToDelete} wirklich beenden?`}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>Die Freundschaft kann mit einer Freundschaftanfrage jederzeit wieder hergestellt werden.</Typography>
                <Grid
                    container
                    spacing={2}
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                    <Grid
                        sx={{ order: { xs: 4, md: 3 } }}
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <Button
                            onClick={handleDialogClose}
                            color="primary"
                            variant="outlined"
                            fullWidth
                        >
                            Abbrechen
                        </Button>
                    </Grid>
                    <Grid
                        sx={{ order: { xs: 3, md: 3 } }}
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <Button
                            type='submit'
                            onClick={handleConfirmDelete}
                            color="error"
                            disabled={loading}
                            variant="contained"
                            fullWidth
                        >
                            {"Beenden bestätigen"}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </AppDialog>
    );
};

export default FriendshipDeleteDialog;

import { Button, Dialog, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme, AppBar, Toolbar, IconButton } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteFriendship } from "@/store/entities/friendships/friendships.actions";
import { closeDeleteFriendshipsDialog, getDialogs } from "@/store/ui/friendships/friendships.slice";
import { getApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { IFriendship } from "@/types";
import CloseIcon from '@mui/icons-material/Close';
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
        } catch (error) {
        } finally {
            handleDialogClose();
        }
    };

    return (
        <Dialog
            fullScreen={matches ? false : true}
            maxWidth="sm"
            fullWidth
            TransitionComponent={matches ? ZoomTransition : SlideTransition}
            open={deleteDialog.open}
            onClose={handleDialogClose}
            aria-describedby='dialog-delete-friendship'
        >
            {!matches && (
                <AppBar sx={{ position: 'relative' }} color='inherit'>
                    <Toolbar>
                        <IconButton
                            edge='start'
                            color='inherit'
                            onClick={handleDialogClose}
                            aria-label='cancel'
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                            Freundschaft beenden
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}
            <DialogTitle>{`Freundschaft mit ${friendToDelete} wirklich beenden?`}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>Die Freundschaft kann mit einer Freundschaftanfrage jederzeit wieder hergestellt werden.</Typography>
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
                            {"Beenden bestätigen"}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default FriendshipDeleteDialog;

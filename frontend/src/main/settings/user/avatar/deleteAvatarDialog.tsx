import { Button, Dialog, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme, AppBar, Toolbar, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi } from "@/store/entities/authentication/authentication.slice";
import { deleteMyAvatar } from "@/store/entities/authentication/authentication.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";

interface DeleteAvatarDialogProps {
    open: boolean;
    onClose: () => void;
}

const DeleteAvatarDialog = ({ open, onClose }: DeleteAvatarDialogProps) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const loading = useAppSelector(getApi).loading;

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const handleConfirmDelete = () => {
        dispatch(deleteMyAvatar());
        onClose();
    };

    return (
        <Dialog
            fullScreen={matches ? false : true}
            maxWidth="sm"
            fullWidth
            open={open}
            onClose={onClose}
            aria-describedby='dialog-delete-avatar'
            slots={{
                transition: matches ? ZoomTransition : SlideTransition
            }}
        >
            {!matches && (
                <AppBar sx={{ position: 'relative' }} color='inherit'>
                    <Toolbar>
                        <IconButton
                            edge='start'
                            color='inherit'
                            onClick={onClose}
                            aria-label='cancel'
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                            Profilbild entfernen
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}
            <DialogTitle>Profilbild wirklich entfernen?</DialogTitle>
            <DialogContent>
                <Typography id='dialog-delete-avatar' sx={{ mb: 3 }}>
                    Statt deinem Bild wird wieder dein Anfangsbuchstabe angezeigt. Du kannst jederzeit ein neues Bild hochladen.
                </Typography>
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
                            onClick={onClose}
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
                            onClick={handleConfirmDelete}
                            color="error"
                            disabled={loading}
                            variant="contained"
                            fullWidth
                        >
                            {"Entfernen bestätigen"}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteAvatarDialog;

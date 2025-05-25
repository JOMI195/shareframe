import { Button, Dialog, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme, AppBar, Toolbar, IconButton } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { IFrame, isIFrameResponse } from "@/types";
import { getApi, getFrames } from "@/store/entities/frames/frames.slice";
import { closeUnregisterFrameDialog, getDialogs } from "@/store/ui/frames/frames.slice";
import { unregisterFrame } from "@/store/entities/frames/frames.actions";
import CloseIcon from '@mui/icons-material/Close';
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";

const UnregisterFrameDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { unregister: unregisterDialog } = useAppSelector(getDialogs);
    const frames = useAppSelector(getFrames);
    const loading = useAppSelector(getApi).loading
    const frameToUnregister = frames.find((frame => frame.id === unregisterDialog.frameId)) as IFrame | undefined;

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const handleDialogClose = () => {
        dispatch(closeUnregisterFrameDialog());
    };

    const handleConfirmUnregister = async () => {
        if (frameToUnregister !== undefined) {
            const unregisteredFrame = await dispatch(unregisterFrame(frameToUnregister.public_serial_number))
            if (isIFrameResponse(unregisteredFrame)) {
                handleDialogClose();
            }
        }
    };

    return (
        <Dialog
            fullScreen={matches ? false : true}
            open={unregisterDialog.open}
            TransitionComponent={matches ? ZoomTransition : SlideTransition}
            onDialogClose={handleDialogClose}
            aria-describedby='delete-frame-dialog'
            maxWidth="sm"
            fullWidth
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
                            Bilderrahmen löschen
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}
            <DialogTitle>{"Möchtest du den Bilderrahmen wirklich löschen?"}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>Du kannst den Bilderrahmen jederzeit wieder mit seiner Seriennummer hinzufügen</Typography>
                <Grid
                    container
                    display={"flex"} justifyContent={"space-between"} alignItems={"center"}
                    spacing={2}
                >
                    <Grid item xs={12} sm={6} sx={{ order: { xs: 4, sm: 3 } }}>
                        <Button
                            onClick={handleDialogClose}
                            color="primary"
                            variant="outlined"
                            fullWidth
                        >
                            Abbrechen
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ order: { xs: 3, sm: 3 } }}>
                        <Button
                            type='submit'
                            onClick={handleConfirmUnregister}
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
        </Dialog>
    );
};

export default UnregisterFrameDialog;

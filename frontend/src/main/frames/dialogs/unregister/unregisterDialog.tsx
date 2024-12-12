import { Button, Dialog, DialogContent, Box, Grid, DialogTitle, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { IFrame, isIFrameResponse } from "@/types";
import { getApi, getFrames } from "@/store/entities/frames/frames.slice";
import { closeUnregisterFrameDialog, getDialogs } from "@/store/ui/frames/frames.slice";
import { unregisterFrame } from "@/store/entities/frames/frames.actions";

const UnregisterFrameDialog = () => {
    const dispatch = useAppDispatch();

    const { unregister: unregisterDialog } = useAppSelector(getDialogs);
    const frames = useAppSelector(getFrames);
    const loading = useAppSelector(getApi).loading
    const frameToUnregister = frames.find((frame => frame.id === unregisterDialog.frameId)) as IFrame | undefined;

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
        <Dialog maxWidth="sm" fullWidth open={unregisterDialog.open} onClose={handleDialogClose}>
            <Box
                sx={{ m: 2 }}
                component='form'
                id='delete-friendship-form'
                noValidate
            >
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
            </Box>
        </Dialog>
    );
};

export default UnregisterFrameDialog;

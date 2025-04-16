import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    Grid,
    DialogTitle,
    Typography,
    useMediaQuery,
    useTheme,
    AppBar,
    Toolbar,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { IImage } from "@/types";
import { closeSendImageToUserFrameDialog, getDialogs } from "@/store/ui/images/images.slice";
import { getApi, getImagesPaginated } from "@/store/entities/images/images.slice";
import { sendImageToUserFrames } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import CloseIcon from '@mui/icons-material/Close';
import { getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from '@/store/entities/authentication/authentication.slice';
import ExpirationSelector from './expirationSelector';

const SendImageToUserFrameDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { sendToFrame: sendDialog } = useAppSelector(getDialogs);
    const imagesPaginated = useAppSelector(getImagesPaginated);
    const loading = useAppSelector(getApi).loading;
    const imageToSend = imagesPaginated.results.find((image => image.id === sendDialog.imageId)) as IImage | undefined;

    const user = useAppSelector(getUser);

    const friendships = useAppSelector(getFriendships);

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const [receiverUsername, setReceiverUsername] = useState('');
    const [expirationOption, setExpirationOption] = useState<number>(24);

    const handleDialogClose = () => {
        dispatch(closeSendImageToUserFrameDialog());
    };

    const handleConfirmSend = async () => {
        try {
            if (imageToSend !== undefined && receiverUsername) {
                const expirationTimestamp = Math.floor(
                    Date.now() / 1000 + (expirationOption * 3600)
                );

                await dispatch(sendImageToUserFrames(
                    receiverUsername,
                    imageToSend.id,
                    expirationTimestamp.toString()
                ));
            }
        } catch (error) {
            console.error('Error sending image:', error);
        } finally {
            handleDialogClose();
        }
    };

    return (
        <Dialog
            fullScreen={matches ? false : true}
            open={sendDialog.open}
            TransitionComponent={matches ? ZoomTransition : SlideTransition}
            onClose={handleDialogClose}
            aria-describedby='send-image-dialog'
            maxWidth="sm"
            fullWidth
        >
            {!matches && (
                <AppBar sx={{ position: 'relative' }} color='inherit'>
                    <Toolbar>
                        <Typography sx={{ flex: 1 }} variant='h6' component='div'>
                            Foto senden
                        </Typography>
                        <IconButton
                            edge='start'
                            color='inherit'
                            onClick={handleDialogClose}
                            aria-label='cancel'
                        >
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>
            )}
            <DialogTitle>{`Foto ${imageToSend?.display_name ?? imageToSend?.name} senden`}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>Wähle den Empfänger und die Ablaufzeit. Das Foto wird an alle Bilderrahmen des Empfängers geschickt und dort bis zu der angegebenen Ablaufzeit angezeigt.</Typography>

                <FormControl fullWidth sx={{ mb: 1 }}>
                    <InputLabel>Empfänger</InputLabel>
                    <Select
                        value={receiverUsername}
                        label="Empfänger"
                        onChange={(e) => setReceiverUsername(e.target.value as string)}
                    >
                        {friendships.filter(friendship => friendship.status === "accepted").map((friendship) => {
                            const reciever = friendship.sender !== user.me.username ? friendship.sender : friendship.reciever;
                            return (
                                <MenuItem
                                    key={reciever}
                                    value={reciever}
                                >
                                    {reciever}
                                </MenuItem>
                            );
                        }
                        )}
                        <MenuItem
                            key={user.me.username}
                            value={user.me.username}
                        >
                            {"deine eigenen Bilderrahmen"}
                        </MenuItem>
                    </Select>
                </FormControl>

                <ExpirationSelector
                    value={expirationOption}
                    onChange={setExpirationOption}
                />

                <Grid
                    container
                    display={"flex"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    spacing={2}
                    sx={{
                        mt: 3
                    }}
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
                            onClick={handleConfirmSend}
                            color="primary"
                            disabled={loading || !receiverUsername}
                            variant="contained"
                            fullWidth
                        >
                            Senden bestätigen
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default SendImageToUserFrameDialog;
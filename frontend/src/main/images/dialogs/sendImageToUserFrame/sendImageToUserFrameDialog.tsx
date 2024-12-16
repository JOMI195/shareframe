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
import { getApi, getImages } from "@/store/entities/images/images.slice";
import { sendImageToUserFrames } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import CloseIcon from '@mui/icons-material/Close';
import { getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from '@/store/entities/authentication/authentication.slice';

const EXPIRATION_OPTIONS = [
    { label: '24 Stunden', hours: 24 },
    { label: '10 Tage', hours: 240 },
    { label: '30 Tage', hours: 720 }
];

const SendImageToUserFrameDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { sendToFrame: sendDialog } = useAppSelector(getDialogs);
    const images = useAppSelector(getImages);
    const loading = useAppSelector(getApi).loading;
    const imageToSend = images.find((image => image.id === sendDialog.imageId)) as IImage | undefined;

    const user = useAppSelector(getUser);

    const friendships = useAppSelector(getFriendships);

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const [receiverUsername, setReceiverUsername] = useState('');
    const [expirationOption, setExpirationOption] = useState(EXPIRATION_OPTIONS[1].hours);

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
                        <IconButton
                            edge='start'
                            color='inherit'
                            onClick={handleDialogClose}
                            aria-label='cancel'
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                            Foto senden
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}
            <DialogTitle>{`Foto ${imageToSend?.name} senden`}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>Wähle den Empfänger und die Ablaufzeit. Das Foto wird an alle Bilderrahmen des Empfängers geschickt und dort bis zu der angegebenen Ablaufzeit angezeigt.</Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
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
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Ablaufzeit</InputLabel>
                    <Select
                        value={expirationOption}
                        label="Ablaufzeit"
                        onChange={(e) => setExpirationOption(Number(e.target.value))}
                    >
                        {EXPIRATION_OPTIONS.map((option) => (
                            <MenuItem
                                key={option.hours}
                                value={option.hours}
                            >
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Grid
                    container
                    display={"flex"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
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
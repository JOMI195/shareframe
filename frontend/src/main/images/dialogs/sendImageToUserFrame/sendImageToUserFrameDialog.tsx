import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    Grid,
    Typography,
    useMediaQuery,
    useTheme,
    AppBar,
    Toolbar,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Box,
    OutlinedInput,
    SelectChangeEvent
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closeSelectionDialog, closeSendImageToUserFrameDialog, getDialogs } from "@/store/ui/images/images.slice";
import { getApi } from "@/store/entities/images/images.slice";
import { sendImageToUserFrames } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import CloseIcon from '@mui/icons-material/Close';
import { getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from '@/store/entities/authentication/authentication.slice';
import ExpirationSelector from './expirationSelector';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const SendImageToUserFrameDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { sendToFrame: sendDialog } = useAppSelector(getDialogs);
    const loading = useAppSelector(getApi).loading;
    const imagesToSend = sendDialog.imagesToSend;

    const user = useAppSelector(getUser);
    const friendships = useAppSelector(getFriendships);

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const [receiverUsernames, setReceiverUsernames] = useState<string[]>([]);
    const [expirationOption, setExpirationOption] = useState<number>(24);
    const [sendingInProgress, setSendingInProgress] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);

    const availableReceivers = [
        ...friendships
            .filter(friendship => friendship.status === "accepted")
            .map(friendship => friendship.sender !== user.me.username ? friendship.sender : friendship.reciever),
        user.me.username
    ];

    const handleDialogClose = () => {
        if (!sendingInProgress) {
            dispatch(closeSendImageToUserFrameDialog());
            setReceiverUsernames([]);
        }
    };

    const handleReceiverChange = (event: SelectChangeEvent<typeof receiverUsernames>) => {
        const value = event.target.value;
        setReceiverUsernames(typeof value === 'string' ? value.split(',') : value);
        setTimeout(() => setSelectOpen(false), 100);
    };

    const handleConfirmSend = async () => {
        if (imagesToSend.length === 0 || receiverUsernames.length === 0) {
            return;
        }

        setSendingInProgress(true);

        try {
            const expirationTimestamp = Math.floor(
                Date.now() / 1000 + (expirationOption * 3600)
            );

            imagesToSend.forEach(async imageToSend => {
                const sendPromises = receiverUsernames.map(receiverUsername =>
                    dispatch(sendImageToUserFrames(
                        receiverUsername,
                        imageToSend.id,
                        expirationTimestamp.toString()
                    ))
                );

                await Promise.all(sendPromises);
            });
        } catch (error) {
        } finally {
            setSendingInProgress(false);
            handleDialogClose();
            dispatch(closeSelectionDialog());
        }
    };

    const getReceiverDisplayName = (username: string) => {
        return username === user.me.username ? "deine eigenen Bilderrahmen" : username;
    };

    return (
        <Dialog
            fullScreen={matches ? false : true}
            open={sendDialog.open}
            TransitionComponent={matches ? ZoomTransition : SlideTransition}
            onClose={handleDialogClose}
            aria-describedby='send-image-dialog'
            maxWidth="md"
            fullWidth
        >
            {!matches && (
                <AppBar sx={{ position: 'relative' }} color='inherit'>
                    <Toolbar>
                        <Typography sx={{ flex: 1 }} variant='h6' component='div'>
                            {`Ausgewählte${imagesToSend.length === 1 ? "s" : ""} Foto${imagesToSend.length > 1 ? "s" : ""} senden`}
                        </Typography>
                        <IconButton
                            edge='start'
                            color='inherit'
                            onClick={handleDialogClose}
                            aria-label='cancel'
                            disabled={sendingInProgress}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>
            )}
            <DialogContent>
                <Typography sx={{ mb: 3 }}>
                    {`Wähle die Empfänger und die Ablaufzeit. ${imagesToSend.length === 1 ? "Das" : "Die"} ${imagesToSend.length > 1 ? "ausgewählten" : "ausgewählte"} ${imagesToSend.length > 1 ? "Fotos" : "Foto"} ${imagesToSend.length === 1 ? "wird" : "werden"} an alle Bilderrahmen der ausgewählten Empfänger geschickt und dort bis zum Ender der angegebenen Ablaufzeit, bzw. bis der Empfänger ${imagesToSend.length === 1 ? "dieses" : "diese"} deaktiviert, angezeigt.`}
                </Typography>

                <FormControl fullWidth sx={{ mb: 1 }}>
                    <InputLabel>Empfänger</InputLabel>
                    <Select
                        multiple
                        value={receiverUsernames}
                        onChange={handleReceiverChange}
                        open={selectOpen}
                        onOpen={() => setSelectOpen(true)}
                        onClose={() => setSelectOpen(false)}
                        input={<OutlinedInput label="Empfänger" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip
                                        key={value}
                                        label={getReceiverDisplayName(value)}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        )}
                        MenuProps={MenuProps}
                        disabled={sendingInProgress}
                    >
                        {availableReceivers.map((receiver) => (
                            <MenuItem
                                key={receiver}
                                value={receiver}
                                style={{
                                    fontWeight: receiverUsernames.indexOf(receiver) === -1
                                        ? theme.typography.fontWeightRegular
                                        : theme.typography.fontWeightMedium,
                                }}
                            >
                                {getReceiverDisplayName(receiver)}
                            </MenuItem>
                        ))}
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
                            disabled={sendingInProgress}
                        >
                            Abbrechen
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ order: { xs: 3, md: 3 } }}>
                        <Button
                            onClick={handleConfirmSend}
                            color="primary"
                            disabled={loading || receiverUsernames.length === 0 || sendingInProgress}
                            variant="contained"
                            fullWidth
                        >
                            {sendingInProgress
                                ? `Sende ${imagesToSend.length} ${receiverUsernames.length === 1 ? "Foto" : "Fotos"} an ${receiverUsernames.length} Empfänger...`
                                : `${imagesToSend.length} ${receiverUsernames.length === 1 ? "Foto" : "Fotos"} an ${receiverUsernames.length} Empfänger senden`
                            }
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default SendImageToUserFrameDialog;
import { useEffect, useState } from 'react';
import AppDialog from '@/common/components/appDialog';
import {
    Button,
    DialogContent,
    Typography,
    useMediaQuery,
    useTheme,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Box,
    OutlinedInput,
    SelectChangeEvent,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closeSelectionDialog, closeSendImageToUserFrameDialog, getDialogs, sendToFramesFinished } from "@/store/ui/images/images.slice";
import { getApi } from "@/store/entities/images/images.slice";
import { sendImageToUserFrames } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import UserAvatar from "@/common/components/userAvatar";
import { getFriendAvatars } from "@/common/utils/avatar/friendAvatars";
import DialogHeader from '@/common/components/dialogHeader';
import FormActions from '@/common/components/settings/formActions';
import { getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from '@/store/entities/authentication/authentication.slice';
import ExpirationSelector from './expirationSelector';
import { DEFAULT_EXPIRATION_HOURS, expirationTimestamp } from './expiration';
import ScheduleSelector from './scheduleSelector';
import { defaultScheduleDate, scheduleError, toUnixSeconds } from './schedule';
import { sendSummary } from './sendSummary';
import { fetchFramesIfStale } from '@/store/entities/frames/frames.actions';
import { getApi as getFramesApi, getFrames } from '@/store/entities/frames/frames.slice';
import AuthenticatedImage from '@/common/components/authenticatedImage';
import { getVariantUrl } from '@/common/utils/images';
import { getActivityUrl } from '@/assets/endpoints/app/appEndpoints';

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MENU_PROPS = {
    slotProps: {
        paper: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    },
};
const SendImageToUserFrameDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { sendToFrame: sendDialog } = useAppSelector(getDialogs);
    const loading = useAppSelector(getApi).sending;
    const imagesToSend = sendDialog.imagesToSend;

    const user = useAppSelector(getUser);
    const friendships = useAppSelector(getFriendships);

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const [selectedReceiverUsernames, setSelectedReceiverUsernames] = useState<string[]>([]);
    const [expirationHours, setExpirationHours] = useState<number | null>(DEFAULT_EXPIRATION_HOURS);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
    const [scheduledError, setScheduledError] = useState<string | null>(null);
    const [isSendingInProgress, setIsSendingInProgress] = useState(false);
    const [isReceiverSelectOpen, setIsReceiverSelectOpen] = useState(false);

    const frames = useAppSelector(getFrames);
    const framesLoaded = useAppSelector(getFramesApi).lastFetch !== null;

    useEffect(() => {
        if (sendDialog.open) dispatch(fetchFramesIfStale());
    }, [dispatch, sendDialog.open]);

    const receiverAvatars = getFriendAvatars(friendships, user.me);
    // Sending to yourself needs a frame of your own.
    const availableReceivers = [...receiverAvatars.keys()].filter(
        (receiver) => receiver !== user.me.username || !framesLoaded || frames.length > 0
    );
    const photoWord = imagesToSend.length === 1 ? "Foto" : "Fotos";

    const handleDialogClose = () => {
        if (!isSendingInProgress) {
            dispatch(closeSendImageToUserFrameDialog());
            setSelectedReceiverUsernames([]);
            setExpirationHours(DEFAULT_EXPIRATION_HOURS);
            handleScheduleEnabledChange(false);
        }
    };

    const handleScheduleEnabledChange = (enabled: boolean) => {
        setIsScheduled(enabled);
        handleScheduledAtChange(enabled ? defaultScheduleDate() : null, enabled);
    };

    const handleScheduledAtChange = (value: Date | null, enabled: boolean = isScheduled) => {
        setScheduledAt(value);
        setScheduledError(enabled ? scheduleError(value) : null);
    };

    const handleReceiverSelectionChange = (event: SelectChangeEvent<typeof selectedReceiverUsernames>) => {
        const value = event.target.value;
        setSelectedReceiverUsernames(typeof value === 'string' ? value.split(',') : value);
    };

    const handleConfirmSend = async () => {
        if (imagesToSend.length === 0 || selectedReceiverUsernames.length === 0 || expirationHours === null) {
            return;
        }

        if (isScheduled) {
            const error = scheduleError(scheduledAt);
            if (error) {
                setScheduledError(error);
                return;
            }
        }
        const sendAt = isScheduled ? scheduledAt : null;

        setIsSendingInProgress(true);

        const expiresAt = expirationTimestamp(expirationHours, sendAt?.getTime());
        const results = await Promise.all(
            imagesToSend.flatMap(imageToSend =>
                selectedReceiverUsernames.map(receiverUsername =>
                    dispatch(sendImageToUserFrames(
                        receiverUsername,
                        imageToSend.id,
                        // TODO: sent as number
                        expiresAt.toString(),
                        sendAt ? toUnixSeconds(sendAt) : undefined
                    ))
                )
            )
        );

        // One summary instead of a snackbar per photo and receiver, where a late success hid a failure.
        const summary = sendSummary(results, imagesToSend.length, selectedReceiverUsernames.length, isScheduled);
        dispatch(sendToFramesFinished({
            message: summary.message,
            severity: summary.severity,
            ...(!summary.allFailed && { link: { label: "Ansehen", to: "/" + getActivityUrl() } }),
        }));
        setIsSendingInProgress(false);

        // Nothing went out, so the choices stay for another try.
        if (summary.allFailed) return;
        handleDialogClose();
        dispatch(closeSelectionDialog());
    };

    const getReceiverDisplayName = (username: string) => {
        return username === user.me.username ? "deine eigenen Bilderrahmen" : username;
    };

    return (
        <AppDialog
            fullScreen={matches ? false : true}
            open={sendDialog.open}
            onClose={handleDialogClose}
            aria-labelledby='send-image-title'
            maxWidth="md"
            fullWidth
            slots={{
                transition: matches ? ZoomTransition : SlideTransition
            }}
        >
            <DialogHeader
                title={`${photoWord} senden`}
                titleId="send-image-title"
                onClose={handleDialogClose}
                closeDisabled={isSendingInProgress}
            />
            <DialogContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
                    {imagesToSend.map((image) => (
                        <AuthenticatedImage
                            key={image.id}
                            url={`${MEDIA_BASE_URL}${getVariantUrl(image, "thumbnail")}`}
                            alt={image.display_name || image.name}
                            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                        />
                    ))}
                </Box>
                <Typography sx={{ mb: 3 }}>
                    {`Wähle die Empfänger. ${imagesToSend.length === 1 ? "Das Foto erscheint" : "Die Fotos erscheinen"} auf allen ihren Bilderrahmen, bis die Anzeigedauer endet oder der Empfänger ${imagesToSend.length === 1 ? "es" : "sie"} deaktiviert.`}
                </Typography>

                {availableReceivers.length === 0 && (
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Noch keine Empfänger: füge unter Freunde einen Freund hinzu oder registriere einen eigenen Bilderrahmen.
                    </Typography>
                )}

                <FormControl fullWidth sx={{ mb: 1 }}>
                    <InputLabel id="send-receivers-label">Empfänger</InputLabel>
                    <Select
                        labelId="send-receivers-label"
                        multiple
                        value={selectedReceiverUsernames}
                        onChange={handleReceiverSelectionChange}
                        open={isReceiverSelectOpen}
                        onOpen={() => setIsReceiverSelectOpen(true)}
                        onClose={() => setIsReceiverSelectOpen(false)}
                        input={<OutlinedInput label="Empfänger" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip
                                        key={value}
                                        avatar={<UserAvatar username={value} url={receiverAvatars.get(value)} size={18} />}
                                        label={getReceiverDisplayName(value)}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        )}
                        MenuProps={MENU_PROPS}
                        disabled={isSendingInProgress}
                    >
                        {availableReceivers.map((receiver) => (
                            <MenuItem
                                key={receiver}
                                value={receiver}
                                style={{
                                    fontWeight: selectedReceiverUsernames.indexOf(receiver) === -1
                                        ? theme.typography.fontWeightRegular
                                        : theme.typography.fontWeightMedium,
                                }}
                            >
                                <UserAvatar
                                    username={receiver}
                                    url={receiverAvatars.get(receiver)}
                                    size={24}
                                    sx={{ mr: 1.5 }}
                                />
                                {getReceiverDisplayName(receiver)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <ScheduleSelector
                    enabled={isScheduled}
                    value={scheduledAt}
                    error={scheduledError}
                    onEnabledChange={handleScheduleEnabledChange}
                    onChange={(value) => handleScheduledAtChange(value)}
                    disabled={isSendingInProgress}
                />

                {/* Remounted per opening, so its own mode and value start fresh with the parent's. */}
                <ExpirationSelector
                    key={String(sendDialog.open)}
                    expirationHours={expirationHours}
                    onExpirationHoursChange={setExpirationHours}
                    disabled={isSendingInProgress}
                />

                <Box sx={{ mt: 3 }}>
                    <FormActions>
                        <Button
                            onClick={handleConfirmSend}
                            color="primary"
                            disabled={loading || selectedReceiverUsernames.length === 0 || isSendingInProgress || scheduledError !== null || expirationHours === null}
                            variant="contained"
                        >
                            {isSendingInProgress
                                ? `Sende ${imagesToSend.length} ${photoWord} an ${selectedReceiverUsernames.length} Empfänger...`
                                : `${imagesToSend.length} ${photoWord} an ${selectedReceiverUsernames.length} Empfänger ${isScheduled ? "planen" : "senden"}`
                            }
                        </Button>
                    </FormActions>
                </Box>
            </DialogContent>
        </AppDialog>
    );
};

export default SendImageToUserFrameDialog;
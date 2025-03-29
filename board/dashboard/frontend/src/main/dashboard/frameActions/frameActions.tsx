import React, { useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    Chip,
    Button,
    Grid,
    Alert,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    PlayArrowOutlined,
    StopOutlined,
    DeleteOutlined,
    PhotoLibraryOutlined,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    selectSlideshowOperation,
    toggleSlideshowThunk,
    clearDisplayThunk
} from '@/store/slideshowOperation/slideshowOperation.Slice';
import { selectSlideshowStatus } from '@/store/slideshowStatus/slideshowStatus.Slice';
import { usePiConnection } from '@/context/piConnection/piConnectionContext';
import { useTimer } from '@/hooks/useTimer';
import { syncSpecificTimer } from '@/store/timers/timers.Slice';

const FrameActions: React.FC = () => {
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const { isConnected } = usePiConnection();
    const { isToggling, isClearingDisplay } = useAppSelector(selectSlideshowOperation);
    const { isActive, lastCheckedAt } = useAppSelector(selectSlideshowStatus);

    const {
        isActive: isAppIntialLoadTimerActive,
    } = useTimer({
        id: 'app-initial-load-timer',
    });

    const {
        isActive: isSlideshowActionsTimerActive,
        formattedTime: slideshowActionsTimerTime
    } = useTimer({
        id: 'slideshow-actions-timer',
    });

    useEffect(() => {
        dispatch(syncSpecificTimer('app-initial-load-timer'));
        dispatch(syncSpecificTimer('slideshow-actions-timer'));

        const syncInterval = setInterval(() => {
            if (isAppIntialLoadTimerActive || isSlideshowActionsTimerActive) {
                dispatch(syncSpecificTimer('app-initial-load-timer'));
                dispatch(syncSpecificTimer('slideshow-actions-timer'));
            }
        }, 1000);

        return () => clearInterval(syncInterval);
    }, [dispatch, isAppIntialLoadTimerActive, isSlideshowActionsTimerActive]);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const handleToggleSlideshow = () => {
        dispatch(toggleSlideshowThunk());
    };

    const handleClearDisplay = () => {
        dispatch(clearDisplayThunk());
    };

    const isTimerRunning = isSlideshowActionsTimerActive || isAppIntialLoadTimerActive;
    const isButtonsDisabled = isTimerRunning || isToggling || isClearingDisplay || !isConnected || lastCheckedAt === null

    return (
        <>
            <Grid container spacing={3} sx={{ pb: isSmallScreen ? 7 : 0 }}>
                {!isSlideshowActionsTimerActive && isAppIntialLoadTimerActive && (
                    <Grid item xs={12}>
                        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                            Bitte warte einen Augenblick bis der aktuelle Status der Bildwiedergabe ermittelt wurde
                        </Alert>
                    </Grid>
                )}

                {isSlideshowActionsTimerActive && (
                    <Grid item xs={12}>
                        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                            Um das Display zu schonen ist die nächste Aktion erst wieder in {slideshowActionsTimerTime} möglich
                        </Alert>
                    </Grid>
                )}

                {/* Rest of your component remains the same */}
                <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Stack spacing={2} sx={{ height: '100%' }}>
                                <Box display="flex" alignItems="center">
                                    <PhotoLibraryOutlined sx={{ mr: 1 }} />
                                    <Typography variant="h6">Bilderwiedergabe</Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Status:</Typography>
                                    <Chip
                                        label={(isConnected && lastCheckedAt !== null) ? isActive ? "Wird ausgeführt" : "Gestoppt" : "Unbekannt"}
                                        color={(isConnected && lastCheckedAt !== null) ? isActive ? "success" : "warning" : "error"}
                                        size="small"
                                    />
                                </Box>

                                <Typography variant="body2">
                                    Die Bildwiedergabe auf dem Bilderrahmen starten oder stoppen.
                                </Typography>
                                <Typography variant="body2">
                                    Das Stoppen der Bildwiedergabe leert zusätzlich den Bilderrahmen um das Display vor Schaden zu schützen.
                                </Typography>

                                <Box sx={{ flexGrow: 1 }} />

                                <Button
                                    variant="contained"
                                    color={isActive ? "error" : "primary"}
                                    startIcon={isActive ? <StopOutlined /> : <PlayArrowOutlined />}
                                    onClick={handleToggleSlideshow}
                                    fullWidth
                                    disabled={isButtonsDisabled}
                                >
                                    {isActive ? "Stoppen" : "Starten"}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Stack spacing={2} sx={{ height: '100%' }}>
                                <Box display="flex" alignItems="center">
                                    <DeleteOutlined sx={{ mr: 1 }} />
                                    <Typography variant="h6">Bildschirm leeren</Typography>
                                </Box>

                                <Typography variant="body2">
                                    Die aktuelle Anzeige löschen und einen leeren Bildschirm anzeigen.
                                </Typography>
                                <Typography variant="body2">
                                    Wenn der Bilderrahmen längere Zeit nicht benutzt wird, MUSS die Anzeige gelöscht werden, da der Bildschirm sonst Schaden nimmt.
                                </Typography>
                                <Typography variant="body2">
                                    Um den Bildschirm zu leeren, muss vorher die Bildwiedergabe gestoppt werden.
                                </Typography>

                                <Box sx={{ flexGrow: 1 }} />

                                <Button
                                    variant="outlined"
                                    startIcon={<DeleteOutlined />}
                                    onClick={handleClearDisplay}
                                    fullWidth
                                    disabled={isButtonsDisabled || isActive}
                                >
                                    Bildschirm leeren
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

export default FrameActions;
import { useState } from 'react';
import {
    Box,
    Typography,
    Stack,
    CardContent,
    Card,
    Divider,
    Grid,
    Button,
    CircularProgress,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectFrameInfoState } from '@/store/frameInfo/frameInfo.Slice';
import { fetchLatestRelease, performUpdate, selectUpdatesState } from '@/store/updates/updates.Slice';
import { isVersionNewer } from '@/common/utils/version';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpdateIcon from '@mui/icons-material/Update';
import RefreshIcon from '@mui/icons-material/Refresh';
import BuildIcon from '@mui/icons-material/Build';
import ShareframeDialog from '@/common/components/shareframeDialog';
import { addLoadingSnackbar, removeLoadingSnackbar } from '@/store/snackbars/snackbars.Slice';
import uuid from 'react-uuid';
import { usePiConnection } from '@/context/piConnection/piConnectionContext';

const Updates = () => {
    const dispatch = useAppDispatch();
    const { latest_release, loading } = useAppSelector(selectUpdatesState);
    const { frameInfo } = useAppSelector(selectFrameInfoState);
    const { isConnected } = usePiConnection();

    const [isUpdateConfirmDialogOpen, setIsUpdateConfirmDialogOpen] = useState(false);

    const handleConfirmUpdate = async () => {
        setIsUpdateConfirmDialogOpen(false);
        await dispatch(performUpdate());
    };

    const handleFetchLatestRelease = async () => {
        const snackbarId = uuid();
        dispatch(addLoadingSnackbar(snackbarId, "Suche nach Updates"));
        await dispatch(fetchLatestRelease());
        dispatch(removeLoadingSnackbar(snackbarId));
    }

    const isNewVersion = (latest_release && frameInfo && isVersionNewer(latest_release.version, frameInfo.version)) ?? false;

    return (
        <>
            <Stack spacing={3}>
                <Grid container spacing={1} display={{ xs: "none", sm: "flex" }} justifyContent={"flex-end"}>
                    {isNewVersion && (
                        <Grid item sm={5}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<BuildIcon />}
                                onClick={() => setIsUpdateConfirmDialogOpen(true)}
                                fullWidth
                                disabled={loading || !isConnected}
                            >
                                Jetzt installieren
                            </Button>
                        </Grid>
                    )}
                    {!isNewVersion && (
                        <Grid item sm={5}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<RefreshIcon />}
                                onClick={handleFetchLatestRelease}
                                disabled={loading || !isConnected}
                                fullWidth
                            >
                                Auf Updates prüfen
                            </Button>
                        </Grid>
                    )}
                </Grid>

                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent sx={{ minHeight: "150px", height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Übersicht
                        </Typography>
                        <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                            <Typography variant="body2">
                                Aktuelle Version
                            </Typography>
                            <Divider />
                            <Typography variant="body2" gutterBottom>
                                {frameInfo?.version ?? ""}
                            </Typography>
                        </Box>

                    </CardContent>
                </Card>

                {
                    loading ? (
                        <Card elevation={1} sx={{ height: '100%' }}>
                            <CardContent sx={{ minHeight: "150px", height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                                        <CircularProgress size={21} sx={{ mr: 1 }} />Suche nach Updates
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ) : (
                        isNewVersion ? (
                            <Card elevation={1} sx={{ height: '100%' }}>
                                <CardContent sx={{ minHeight: "150px", height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box width="100%">
                                        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                                            <UpdateIcon color='error' sx={{ mr: 1 }} />Neue Version verfügbar
                                        </Typography>
                                        <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                                            <Typography variant="body2">
                                                Neue Version
                                            </Typography>
                                            <Divider />
                                            <Typography variant="body2" gutterBottom>
                                                {latest_release?.version ?? ""}
                                            </Typography>
                                        </Box>
                                        <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                                            <Typography variant="body2">
                                                Umfang
                                            </Typography>
                                            <Divider />
                                            <Typography variant="body2" gutterBottom>
                                                {latest_release?.release_notes ?? ""}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card elevation={1} sx={{ height: '100%' }}>
                                <CardContent sx={{ minHeight: "150px", height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box width="100%" >
                                        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                                            <CheckCircleIcon color='success' sx={{ mr: 1 }} />Keine Updates verfügbar
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Bilderrahmen ist auf dem neusten Stand!
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        )
                    )
                }
            </Stack >

            <Grid sx={{ pt: 3 }} container spacing={2} display={{ xs: "flex", sm: "none" }}>
                {isNewVersion && (
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<BuildIcon />}
                            onClick={() => setIsUpdateConfirmDialogOpen(true)}
                            fullWidth
                            disabled={loading || !isConnected}
                        >
                            Jetzt installieren
                        </Button>
                    </Grid>
                )}
                {!isNewVersion && (
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<RefreshIcon />}
                            onClick={handleFetchLatestRelease}
                            disabled={loading || !isConnected}
                            fullWidth
                        >
                            Auf Updates prüfen
                        </Button>
                    </Grid>
                )}
            </Grid>

            <ShareframeDialog
                open={isUpdateConfirmDialogOpen}
                title="Neue Version installieren"
                onClose={() => setIsUpdateConfirmDialogOpen(false)}
                onConfirm={handleConfirmUpdate}
                confirmText="Installieren"
                cancelText="Abbrechen"
                confirmDisabled={!isConnected}
            >
                <Stack spacing={2}>
                    <Typography variant="body1" gutterBottom>
                        Möchtest du das neue Update wirklich installieren?
                    </Typography>
                    <Typography variant="body1">
                        Zum Start der Installation wirst du zunächst ausgeloggt. Anschließend wird die Bilderwiedergabe sowie dieses Dashboard kurzzeitig beendet und nicht zur Verfügung stehen.
                    </Typography>
                    <Typography variant="body1">
                        Nach erfolgreicher Installation startet die Bildwiedergabe erneut und diese Seite muss für den Zugang zum Dashboard neu geladen werden.
                    </Typography>
                </Stack>

            </ShareframeDialog>
        </>
    );
};

export default Updates;
import {
    Box,
    Typography,
    Stack,
    CardContent,
    Card,
    Divider,
    Grid,
    Button,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectFrameInfoState } from '@/store/frameInfo/frameInfo.Slice';
import { usePiConnection } from '@/context/piConnection/piConnectionContext';
import ShareframeDialog from '@/common/components/shareframeDialog';
import { useState } from 'react';
import { restartPi, shutdownPi } from '@/store/piPower/piPower.Slice';

const RESOLUTION = "800 x 480";

const General = () => {
    const dispatch = useAppDispatch();
    const { isConnected } = usePiConnection();
    const frameInfos = useAppSelector(selectFrameInfoState).frameInfo;

    const [isRestartConfirmDialogOpen, setIsRestartConfirmDialogOpen] = useState(false);
    const [isShutdownConfirmDialogOpen, setIsShutdownConfirmDialogOpen] = useState(false);

    const handleConfirmRestart = async () => {
        setIsRestartConfirmDialogOpen(false);
        await dispatch(restartPi());
    };

    const handleConfirmShutdown = async () => {
        setIsShutdownConfirmDialogOpen(false);
        await dispatch(shutdownPi());
    };


    return (
        <>
            <Stack spacing={3}>
                <Grid container spacing={1} display={{ xs: "none", sm: "flex" }} justifyContent={"flex-end"}>
                    <Grid item sm={5}>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<PowerSettingsNewIcon />}
                            onClick={() => setIsShutdownConfirmDialogOpen(true)}
                            fullWidth
                            disabled={!isConnected}
                        >
                            Herunterfahren
                        </Button>
                    </Grid>

                    <Grid item sm={5}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<RestartAltIcon />}
                            onClick={() => setIsRestartConfirmDialogOpen(true)}
                            fullWidth
                            disabled={!isConnected}
                        >
                            Neustarten
                        </Button>
                    </Grid>
                </Grid>

                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent sx={{ minHeight: "150px", height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Gerät
                        </Typography>
                        <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                            <Typography variant="body2">
                                Seriennummer
                            </Typography>
                            <Divider />
                            <Typography variant="body2" gutterBottom>
                                {frameInfos?.public_serial_number ?? ""}
                            </Typography>
                        </Box>

                    </CardContent>
                </Card>

                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent sx={{ minHeight: "150px", height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box width="100%">
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Hardwarespezifikation
                            </Typography>
                            <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                                <Typography variant="body2">
                                    Display-Größe
                                </Typography>
                                <Divider />
                                <Typography variant="body2" gutterBottom>
                                    {RESOLUTION}
                                </Typography>
                            </Box>
                            <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                                <Typography variant="body2">
                                    Aktualisierungsrate (Minuten)
                                </Typography>
                                <Divider />
                                <Typography variant="body2" gutterBottom>
                                    {frameInfos?.display_refresh_interval_mins ?? ""}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Stack >

            <Grid sx={{ pt: 3 }} container spacing={2} display={{ xs: "flex", sm: "none" }}>
                <Grid item xs={12}>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<PowerSettingsNewIcon />}
                        onClick={() => setIsShutdownConfirmDialogOpen(true)}
                        fullWidth
                        disabled={!isConnected}
                    >
                        Herunterfahren
                    </Button>
                </Grid>

                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<RestartAltIcon />}
                        onClick={() => setIsRestartConfirmDialogOpen(true)}
                        fullWidth
                        disabled={!isConnected}
                    >
                        Neustarten
                    </Button>
                </Grid>
            </Grid>

            <ShareframeDialog
                open={isRestartConfirmDialogOpen}
                title="Bilderrahmen neustarten"
                onClose={() => setIsRestartConfirmDialogOpen(false)}
                onConfirm={handleConfirmRestart}
                confirmText="Neustarten"
                cancelText="Abbrechen"
                confirmDisabled={!isConnected}
            >
                <Stack spacing={2}>
                    <Typography variant="body1" gutterBottom>
                        Möchtest du den Bilderrahmen wirklich neustarten?
                    </Typography>
                    <Typography variant="body1">
                        Während dem Neustart ist das Dashboard nicht verfügbar.
                    </Typography>
                </Stack>
            </ShareframeDialog>

            <ShareframeDialog
                open={isShutdownConfirmDialogOpen}
                title="Bilderrahmen herunterfahren"
                onClose={() => setIsShutdownConfirmDialogOpen(false)}
                onConfirm={handleConfirmShutdown}
                confirmText="Herunterfahren"
                cancelText="Abbrechen"
                confirmDisabled={!isConnected}
            >
                <Stack spacing={2}>
                    <Typography variant="body1" gutterBottom>
                        Möchtest du den Bilderrahmen wirklich herunterfahren?
                    </Typography>
                    <Typography variant="body1">
                        Nach dem Herunterfahren ist das Dashboard nicht mehr verfügbar und die Bildwiedergabe deaktiviert.
                    </Typography>
                    <Typography variant="body1">
                        Um ihn anschließend neu zu starten musst du die Stromzufuhr unterbrechen und wieder herstellen.
                    </Typography>
                </Stack>
            </ShareframeDialog>
        </>
    );
};

export default General;
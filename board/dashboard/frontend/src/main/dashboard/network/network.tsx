import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Divider, List, ListItem,
    ListItemText, TextField, IconButton, CircularProgress,
    InputAdornment, Card, CardContent, Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ShareframeDialog from '@/common/components/shareframeDialog';
import { usePiConnection } from '@/context/piConnection/piConnectionContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { addNetwork, fetchNetworkData, forgetNetwork, NetworkCredentials, selectNetworkState } from '@/store/network/network.Slice';

const Network = () => {
    const dispatch = useAppDispatch();
    const { isConnected } = usePiConnection();
    const { currentConnection, savedNetworks, loading } = useAppSelector(selectNetworkState);

    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [newNetwork, setNewNetwork] = useState<NetworkCredentials>({ ssid: '', password: '' });

    const [forgetDialogOpen, setForgetDialogOpen] = useState<boolean>(false);
    const [networkToForget, setNetworkToForget] = useState<string>('');

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);

    const isButtonsDisabled = submitting || loading || !isConnected;

    useEffect(() => {
        if (isConnected) {
            dispatch(fetchNetworkData());
        }
    }, [isConnected, dispatch]);

    const handleAddNetwork = (): void => {
        setNewNetwork({ ssid: '', password: '' });
        setDialogOpen(true);
    };

    const handleCloseDialog = (): void => {
        setDialogOpen(false);
    };

    const handleSubmitNetwork = async (): Promise<void> => {
        setSubmitting(true);
        try {
            await dispatch(addNetwork(newNetwork)).unwrap();
            setDialogOpen(false);
        } catch (error) {
            // Error handling is done in the thunk
        } finally {
            setSubmitting(false);
        }
    };

    const initiateForgetNetwork = (ssid: string): void => {
        setNetworkToForget(ssid);
        setForgetDialogOpen(true);
    };

    const handleForgetNetwork = async (): Promise<void> => {
        await dispatch(forgetNetwork(networkToForget));
        setForgetDialogOpen(false);
        setNetworkToForget('');
    };

    const handleCloseForgetDialog = (): void => {
        setForgetDialogOpen(false);
        setNetworkToForget('');
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
    };

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Action Buttons (Desktop) */}
                <Grid item justifyContent={"flex-end"} xs={12} display={{ xs: "none", md: "flex" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddNetwork}
                        disabled={isButtonsDisabled}
                        sx={{ mr: 1 }}
                    >
                        Netzwerk hinzufügen
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={() => dispatch(fetchNetworkData())}
                        disabled={isButtonsDisabled}
                    >
                        Aktualisieren
                    </Button>
                </Grid>

                {/* Current Network Card */}
                <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">
                                    Aktuelles WIFI-Netzwerk
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 1 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
                                <WifiIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2">
                                    {loading ? <CircularProgress size={12} /> : currentConnection}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Saved Networks Card */}
                <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ pr: 3 }}>
                                    Gespeicherte WIFI-Netzwerke
                                </Typography>
                            </Box>
                            <Divider sx={{ mb: 1 }} />

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <List sx={{ mb: 3 }}>
                                    {savedNetworks.length === 0 ? (
                                        <Typography variant="body2" gutterBottom sx={{ textAlign: 'left' }}>
                                            Keine gespeicherten Netzwerke gefunden.
                                        </Typography>
                                    ) : (
                                        savedNetworks.map((network) => (
                                            <ListItem
                                                key={network}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="delete"
                                                        onClick={() => initiateForgetNetwork(network)}
                                                        disabled={isButtonsDisabled}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText primary={<Typography variant="body2">{network}</Typography>} />
                                            </ListItem>
                                        ))
                                    )}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Action Buttons (Mobile) */}
                <Grid item xs={12} md={6} display={{ xs: "flex", md: "none" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddNetwork}
                        fullWidth
                        disabled={isButtonsDisabled}
                    >
                        Netzwerk hinzufügen
                    </Button>
                </Grid>
                <Grid item xs={12} md={6} display={{ xs: "flex", md: "none" }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={() => dispatch(fetchNetworkData())}
                        disabled={isButtonsDisabled}
                        fullWidth
                    >
                        Aktualisieren
                    </Button>
                </Grid>
            </Grid>

            {/* Add Network Dialog */}
            <ShareframeDialog
                open={dialogOpen}
                title={"Neues Netzwerk hinzufügen"}
                onClose={handleCloseDialog}
                onConfirm={handleSubmitNetwork}
                confirmDisabled={submitting || loading || !isConnected}
                confirmText="Hinzufügen"
                cancelText="Abbrechen"
                fullWidth={true}
                showActions={true}
            >
                <TextField
                    autoFocus
                    margin="dense"
                    id="ssid"
                    label="Netzwerkname (SSID)"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={newNetwork.ssid}
                    onChange={(e) => setNewNetwork({ ...newNetwork, ssid: e.target.value })}
                />
                <TextField
                    margin="dense"
                    id="password"
                    label="Passwort"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    variant="outlined"
                    value={newNetwork.password}
                    onChange={(e) => setNewNetwork({ ...newNetwork, password: e.target.value })}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle current password visibility"
                                    onClick={handleClickShowPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </ShareframeDialog>

            {/* Forget Network Dialog */}
            <ShareframeDialog
                open={forgetDialogOpen}
                title="Netzwerk entfernen"
                onClose={handleCloseForgetDialog}
                onConfirm={handleForgetNetwork}
                confirmText="Entfernen"
                cancelText="Abbrechen"
            >
                <Typography variant="body1" gutterBottom>
                    Möchtest du das Netzwerk <strong>{networkToForget}</strong> wirklich aus den gespeicherten Netzwerken entfernen?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Du kannst das Netzwerk jederzeit erneut hinzufügen.
                </Typography>
            </ShareframeDialog>
        </Box>
    );
}

export default Network;
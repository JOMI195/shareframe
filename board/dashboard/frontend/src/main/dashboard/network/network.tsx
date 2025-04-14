import React, { useState } from 'react';
import {
    Box, Typography, Button, Divider, List, ListItem,
    ListItemText, TextField, IconButton, CircularProgress,
    InputAdornment, Card, CardContent, Grid,
    Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import EditIcon from '@mui/icons-material/Edit';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ShareframeDialog from '@/common/components/shareframeDialog';
import { usePiConnection } from '@/context/piConnection/piConnectionContext';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    addNetwork,
    fetchNetworkData,
    forgetNetwork,
    renameNetwork,
    NetworkCredentials,
    selectNetworkState
} from '@/store/network/network.Slice';
import uuid from 'react-uuid';
import { addLoadingSnackbar, removeLoadingSnackbar } from '@/store/snackbars/snackbars.Slice';

const Network = () => {
    const dispatch = useAppDispatch();
    const { isConnected } = usePiConnection();
    const { currentConnection, savedNetworks, loading } = useAppSelector(selectNetworkState);

    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [newNetwork, setNewNetwork] = useState<NetworkCredentials>({ ssid: '', password: '' });

    const [forgetDialogOpen, setForgetDialogOpen] = useState<boolean>(false);
    const [networkToForget, setNetworkToForget] = useState<string>('');

    // Add states for rename functionality
    const [renameDialogOpen, setRenameDialogOpen] = useState<boolean>(false);
    const [networkToRename, setNetworkToRename] = useState<string>('');
    const [newNetworkName, setNewNetworkName] = useState<string>('');

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState(false);

    const isButtonsDisabled = submitting || loading || !isConnected;

    const loadnetworkData = async () => {
        if (isConnected) {
            const snackbarId = uuid();
            dispatch(addLoadingSnackbar(snackbarId, "Lade Netzwerke"));
            await dispatch(fetchNetworkData());
            dispatch(removeLoadingSnackbar(snackbarId));
        }
    }

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

    // Add handlers for rename functionality
    const initiateRenameNetwork = (ssid: string): void => {
        setNetworkToRename(ssid);
        setNewNetworkName(ssid);
        setRenameDialogOpen(true);
    };

    const handleRenameNetwork = async (): Promise<void> => {
        setSubmitting(true);
        try {
            await dispatch(renameNetwork({ oldName: networkToRename, newName: newNetworkName })).unwrap();
            setRenameDialogOpen(false);
        } catch (error) {
            // Error handling is done in the thunk
        } finally {
            setSubmitting(false);
            setNetworkToRename('');
            setNewNetworkName('');
        }
    };

    const handleCloseRenameDialog = (): void => {
        setRenameDialogOpen(false);
        setNetworkToRename('');
        setNewNetworkName('');
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
        <>
            <Stack spacing={3}>
                <Grid container spacing={1} display={{ xs: "none", sm: "flex" }} justifyContent={"flex-end"}>
                    <Grid item sm={5}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddNetwork}
                            disabled={isButtonsDisabled}
                            fullWidth
                        >
                            Netzwerk hinzufügen
                        </Button>
                    </Grid>

                    <Grid item sm={5}>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<RefreshIcon />}
                            onClick={loadnetworkData}
                            disabled={isButtonsDisabled}
                            fullWidth
                        >
                            Aktualisieren
                        </Button>
                    </Grid>
                </Grid>

                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent sx={{ minHeight: "150px", height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Übersicht (WIFI)
                        </Typography>

                        <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
                            <Typography variant="body2">
                                Aktuelles Netzwerk
                            </Typography>
                            <Divider />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <WifiIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="body2">
                                    {loading ? <CircularProgress size={12} /> : currentConnection}
                                </Typography>
                            </Box>
                        </Box>
                        <Box display={"flex"} flexDirection={"column"} justifyContent={"space-between"} sx={{ mt: 1 }}>
                            <Typography variant="body2">
                                Gespeicherte Netzwerke
                            </Typography>
                            <Divider />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {loading ? (
                                    <Typography variant="body2">
                                        <CircularProgress size={12} />
                                    </Typography>
                                ) : (
                                    savedNetworks.length === 0 ? (
                                        <Typography variant="body2" sx={{ textAlign: 'left' }}>
                                            Keine gespeicherten Netzwerke gefunden (Voreingestellte Netzwerke können nicht verändert werden).
                                        </Typography>
                                    ) : (
                                        <List sx={{ width: '100%' }}>
                                            {savedNetworks.map((network) => (
                                                <ListItem
                                                    key={network}
                                                    sx={{
                                                        pr: 16,
                                                        '& .MuiListItemText-root': {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }
                                                    }}
                                                    secondaryAction={
                                                        <Box sx={{ display: 'flex' }}>
                                                            <IconButton
                                                                edge="end"
                                                                aria-label="edit"
                                                                onClick={() => initiateRenameNetwork(network)}
                                                                disabled={isButtonsDisabled}
                                                                sx={{ mr: 1 }}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                edge="end"
                                                                aria-label="delete"
                                                                onClick={() => initiateForgetNetwork(network)}
                                                                disabled={isButtonsDisabled}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    }
                                                >
                                                    <ListItemText primary={<Typography variant="body2" noWrap>{network}</Typography>} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Stack >

            <Grid sx={{ pt: 3 }} container spacing={2} display={{ xs: "flex", sm: "none" }}>
                <Grid item xs={12}>
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
                <Grid item xs={12}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={loadnetworkData}
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
                confirmDisabled={submitting || loading || !isConnected}
            >
                <Typography variant="body1" gutterBottom>
                    Möchtest du das Netzwerk <Typography color='primary' component="b">{networkToForget}</Typography> wirklich aus den gespeicherten Netzwerken entfernen?
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Du kannst das Netzwerk jederzeit erneut hinzufügen.
                </Typography>
            </ShareframeDialog>

            {/* Rename Network Dialog */}
            <ShareframeDialog
                open={renameDialogOpen}
                title="Netzwerk umbenennen"
                onClose={handleCloseRenameDialog}
                onConfirm={handleRenameNetwork}
                confirmText="Umbenennen"
                cancelText="Abbrechen"
                confirmDisabled={submitting || loading || !isConnected || !newNetworkName.trim()}
                fullWidth={true}
                showActions={true}
            >
                <Typography variant="body2" gutterBottom>
                    Aktueller Name: <Typography color='primary' component="span">{networkToRename}</Typography>
                </Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    id="newName"
                    label="Neuer Netzwerkname"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={newNetworkName}
                    onChange={(e) => setNewNetworkName(e.target.value)}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Voreingestellte Netzwerke können nicht umbenannt werden.
                </Typography>
            </ShareframeDialog>
        </>
    );
}

export default Network;
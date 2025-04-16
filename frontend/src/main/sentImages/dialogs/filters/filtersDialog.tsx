import { Button, Dialog, DialogContent, Grid, Typography, useMediaQuery, useTheme, AppBar, Toolbar, IconButton, Box, FormControl, Select, MenuItem, InputLabel } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi as getImagesApi } from "@/store/entities/images/images.slice";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import CloseIcon from '@mui/icons-material/Close';
import { closeFilterDialog, getDialogs, resetFilters, setRecieverFilter, setSenderFilter } from "@/store/ui/sentImages/sentImages.slice";
import { useEffect, useState } from "react";
import { getApi as getFriendshipsApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";

const FiltersDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { filter: filterDialog } = useAppSelector(getDialogs);
    const loading = useAppSelector(getImagesApi).loading;
    const friendshipsLoading = useAppSelector(getFriendshipsApi).loading;

    const user = useAppSelector(getUser);
    const friendships = useAppSelector(getFriendships);

    const [senderFilterLocal, setSenderFilterLocal] = useState('');
    const [receiverFilterLocal, setReceiverFilterLocal] = useState('');

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    useEffect(() => {
        if (filterDialog.open) {
            setSenderFilterLocal(filterDialog.senderFilter || '');
            setReceiverFilterLocal(filterDialog.receiverFilter || '');
        }
    }, [filterDialog.open]);

    const handleDialogClose = () => {
        dispatch(closeFilterDialog());
    };

    const handleApplyFilters = () => {
        dispatch(setSenderFilter({ senderFilter: senderFilterLocal }));
        dispatch(setRecieverFilter({ receiverFilter: receiverFilterLocal }));
        handleDialogClose();
    };

    const handleClearFilters = () => {
        setSenderFilterLocal('');
        setReceiverFilterLocal('');

        dispatch(resetFilters());
        handleDialogClose();
    };

    return (
        <Dialog
            fullScreen={!matches}
            open={filterDialog.open}
            TransitionComponent={matches ? ZoomTransition : SlideTransition}
            onClose={handleDialogClose}
            aria-describedby="filter-dialog"
            maxWidth="sm"
            fullWidth
        >

            <AppBar sx={{ position: 'relative' }} color="inherit">
                <Toolbar>
                    <Typography sx={{ flex: 1 }} variant="h6" component="div">
                        Mehr Filter
                    </Typography>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={handleDialogClose}
                        aria-label="cancel"
                    >
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <DialogContent>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Verfeinerne deine Suche nach geteilten Fotos.
                    </Typography>
                    <Grid container spacing={1}>
                        <Grid item xs={12}>
                            <FormControl fullWidth sx={{ mb: 1 }}>
                                <InputLabel>Suche nach Sender</InputLabel>
                                <Select
                                    disabled={loading || friendshipsLoading}
                                    value={senderFilterLocal}
                                    label="Sender"
                                    onChange={(e) => setSenderFilterLocal(e.target.value as string)}
                                >
                                    {friendships
                                        .filter(friendship => friendship.status === "accepted")
                                        .map((friendship) => {
                                            const friendUsername = friendship.sender !== user.me.username
                                                ? friendship.sender
                                                : friendship.reciever;

                                            return (
                                                <MenuItem
                                                    key={friendUsername}
                                                    value={friendUsername}
                                                >
                                                    {friendUsername}
                                                </MenuItem>
                                            );
                                        })
                                    }
                                    <MenuItem
                                        key={user.me.username}
                                        value={"Du"}
                                    >
                                        {"Du"}
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth sx={{ mb: 1 }}>
                                <InputLabel>Suche nach Empfänger</InputLabel>
                                <Select
                                    disabled={loading || friendshipsLoading}
                                    value={receiverFilterLocal}
                                    label="Empfänger"
                                    onChange={(e) => setReceiverFilterLocal(e.target.value as string)}
                                >
                                    {friendships
                                        .filter(friendship => friendship.status === "accepted")
                                        .map((friendship) => {
                                            const friendUsername = friendship.sender !== user.me.username
                                                ? friendship.sender
                                                : friendship.reciever;

                                            return (
                                                <MenuItem
                                                    key={friendUsername}
                                                    value={friendUsername}
                                                >
                                                    {friendUsername}
                                                </MenuItem>
                                            );
                                        })
                                    }
                                    <MenuItem
                                        key={user.me.username}
                                        value={"Du"}
                                    >
                                        {"Du"}
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                <Grid
                    container
                    spacing={2}
                    sx={{ mt: 2 }}
                >
                    <Grid item xs={12} sm={4}>
                        <Button
                            onClick={handleDialogClose}
                            color="primary"
                            variant="outlined"
                            fullWidth
                        >
                            Abbrechen
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={4} >
                        <Button
                            onClick={handleClearFilters}
                            color="inherit"
                            variant="outlined"
                            fullWidth
                            disabled={loading}
                        >
                            Filter löschen
                        </Button>
                    </Grid>

                    <Grid item xs={12} sm={4} >
                        <Button
                            onClick={handleApplyFilters}
                            color="primary"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                        >
                            Filter anwenden
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default FiltersDialog;
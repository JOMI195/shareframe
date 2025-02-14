import { Button, Dialog, DialogContent, Grid, Typography, useMediaQuery, useTheme, AppBar, Toolbar, IconButton, TextField, Box } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi } from "@/store/entities/images/images.slice";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import CloseIcon from '@mui/icons-material/Close';
import { closeFilterDialog, getDialogs, resetFilters, setRecieverFilter, setSenderFilter } from "@/store/ui/sentImages/sentImages.slice";
import { useEffect, useState } from "react";

const FiltersDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { filter: filterDialog } = useAppSelector(getDialogs);
    const loading = useAppSelector(getApi).loading;

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
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Suche nach Sender"
                                value={senderFilterLocal}
                                onChange={(e) => setSenderFilterLocal(e.target.value)}
                                disabled={loading}
                                placeholder="Name des Senders eingeben"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Suche nach Empfänger"
                                value={receiverFilterLocal}
                                onChange={(e) => setReceiverFilterLocal(e.target.value)}
                                disabled={loading}
                                placeholder="Name des Empfängers eingeben"
                            />
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
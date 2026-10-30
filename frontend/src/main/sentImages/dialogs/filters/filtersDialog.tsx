import { Button, DialogContent, Grid, Typography, useMediaQuery, useTheme, Box, FormControl, Select, MenuItem, InputLabel } from "@mui/material";
import AppDialog from '@/common/components/appDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi as getImagesApi } from "@/store/entities/images/images.slice";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import DialogHeader from '@/common/components/dialogHeader';
import FormActions from '@/common/components/settings/formActions';
import { closeFilterDialog, getDialogs, resetFilters, setRecieverFilter, setSenderFilter, setShippingFilter, setStatusFilter } from "@/store/ui/sentImages/sentImages.slice";
import { ShippingFilter, StatusFilter } from "@/types";
import { useState } from "react";
import { getApi as getFriendshipsApi } from "@/store/entities/friendships/friendships.slice";
import { setSentImagesFilters, setSentImagesPaginatedPage } from "@/store/entities/images/images.actions";
import UserFilterSelect from "@/main/sentImages/gallery/filters/userFilterSelect";

const FiltersDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { filter: filterDialog } = useAppSelector(getDialogs);
    const loading = useAppSelector(getImagesApi).loading;
    const friendshipsLoading = useAppSelector(getFriendshipsApi).loading;


    const [statusFilterLocal, setStatusFilterLocal] = useState<StatusFilter>('all');
    const [shippingFilterLocal, setShippingFilterLocal] = useState<ShippingFilter>('all');
    const [senderFilterLocal, setSenderFilterLocal] = useState('');
    const [receiverFilterLocal, setReceiverFilterLocal] = useState('');

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const [syncedFilters, setSyncedFilters] = useState<string | null>(null);
    const dialogFilters = `${filterDialog.open}|${filterDialog.statusFilter}|${filterDialog.shippingFilter}|${filterDialog.senderFilter || ''}|${filterDialog.receiverFilter || ''}`;

    if (dialogFilters !== syncedFilters) {
        setSyncedFilters(dialogFilters);
        if (filterDialog.open) {
            setStatusFilterLocal(filterDialog.statusFilter);
            setShippingFilterLocal(filterDialog.shippingFilter);
            setSenderFilterLocal(filterDialog.senderFilter || '');
            setReceiverFilterLocal(filterDialog.receiverFilter || '');
        }
    }

    const handleDialogClose = () => {
        dispatch(closeFilterDialog());
    };

    const handleApplyFilters = () => {
        dispatch(setStatusFilter({ statusFilter: statusFilterLocal }));
        dispatch(setShippingFilter({ shippingFilter: shippingFilterLocal }));
        dispatch(setSenderFilter({ senderFilter: senderFilterLocal }));
        dispatch(setRecieverFilter({ receiverFilter: receiverFilterLocal }));

        dispatch(setSentImagesFilters({
            status: statusFilterLocal,
            shipping: shippingFilterLocal,
            sender: senderFilterLocal,
            receiver: receiverFilterLocal,
        }));

        dispatch(setSentImagesPaginatedPage(1));

        handleDialogClose();
    };

    const handleClearFilters = () => {
        setSenderFilterLocal('');
        setReceiverFilterLocal('');

        dispatch(resetFilters());

        dispatch(setSentImagesFilters({
            status: 'all',
            shipping: 'all',
            sender: '',
            receiver: '',
        }));

        dispatch(setSentImagesPaginatedPage(1));

        handleDialogClose();
    };

    return (
        <AppDialog
            fullScreen={!matches}
            open={filterDialog.open}
            onClose={handleDialogClose}
            aria-labelledby="filter-dialog-title"
            maxWidth="sm"
            fullWidth
            slots={{
                transition: matches ? ZoomTransition : SlideTransition
            }}
        >
            <DialogHeader title="Filter" titleId="filter-dialog-title" onClose={handleDialogClose} />
            <DialogContent>
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            mb: 3
                        }}>
                        Verfeinere deine Suche nach geteilten Fotos.
                    </Typography>
                    <Grid container spacing={2}>
                            <Grid size={12}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel id="filter-dialog-status-label">Status</InputLabel>
                                    <Select
                                        labelId="filter-dialog-status-label"
                                        value={statusFilterLocal}
                                        label="Status"
                                        onChange={(e) => setStatusFilterLocal(e.target.value as StatusFilter)}
                                    >
                                        <MenuItem value="all">Alle Fotos</MenuItem>
                                        <MenuItem value="active">Aktive</MenuItem>
                                        <MenuItem value="expired">Abgelaufene</MenuItem>
                                        <MenuItem value="scheduled">Geplante</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={12}>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel id="filter-dialog-shipping-label">Richtung</InputLabel>
                                    <Select
                                        labelId="filter-dialog-shipping-label"
                                        value={shippingFilterLocal}
                                        label="Richtung"
                                        onChange={(e) => setShippingFilterLocal(e.target.value as ShippingFilter)}
                                    >
                                        <MenuItem value="all">Alle Fotos</MenuItem>
                                        <MenuItem value="sentToYou">An dich gesendete</MenuItem>
                                        <MenuItem value="sentByYou">Von dir gesendete</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        <Grid size={12}>
                            <UserFilterSelect
                                label="Absender"
                                emptyLabel="Alle Absender"
                                value={senderFilterLocal}
                                onChange={setSenderFilterLocal}
                                disabled={loading || friendshipsLoading}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <UserFilterSelect
                                label="Empfänger"
                                emptyLabel="Alle Empfänger"
                                value={receiverFilterLocal}
                                onChange={setReceiverFilterLocal}
                                disabled={loading || friendshipsLoading}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                <FormActions>
                    <Button
                        onClick={handleClearFilters}
                        color="inherit"
                        variant="outlined"
                        disabled={loading}
                    >
                        Zurücksetzen
                    </Button>
                    <Button
                        onClick={handleApplyFilters}
                        color="primary"
                        variant="contained"
                        disabled={loading}
                    >
                        Filter anwenden
                    </Button>
                </FormActions>
            </DialogContent>
        </AppDialog>
    );
};

export default FiltersDialog;
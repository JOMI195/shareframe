import React from 'react';
import {
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    SelectChangeEvent,
    Switch,
    Typography,
    Badge,
    IconButton,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import { visuallyHidden } from '@mui/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    getDialogs,
    openFilterDialog,
    resetFilters,
    setHideToYouFilter,
    setRecieverFilter,
    setSenderFilter,
    setShippingFilter,
    setStatusFilter
} from '@/store/ui/sentImages/sentImages.slice';
import { ISentImagesFilters, ShippingFilter, StatusFilter } from '@/types';
import { getSentImagesFilters, getSentImagesPaginatedPageSize } from '@/store/entities/images/images.slice';
import { setSentImagesPaginatedPage, setSentImagesPaginatedPageSize } from '@/store/entities/images/images.actions';
import UserFilterSelect from './userFilterSelect';

export interface FilterControlsProps {
    onFiltersChange: (filters: ISentImagesFilters) => void;
    disabled?: boolean;
}

interface BlurToggleProps {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    height: number;
}

// Outlined like the selects next to it; the whole box toggles.
const BlurToggle: React.FC<BlurToggleProps> = ({ checked, onChange, disabled, height }) => (
    <Box
        component="label"
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            height,
            pl: 1.5,
            pr: 0.5,
            border: 1,
            borderColor: 'action.disabled',
            borderRadius: 1,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            '&:hover': { borderColor: disabled ? 'action.disabled' : 'text.primary' },
        }}
    >
        <BlurOnIcon color={checked ? 'primary' : 'action'} />
        <Typography variant="body2" sx={{ flex: 1 }}>
            Fotos an dich verbergen
        </Typography>
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </Box>
);

const FilterControls: React.FC<FilterControlsProps> = ({
    onFiltersChange,
    disabled = false
}) => {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const isCompact = useMediaQuery(theme.breakpoints.down('md'));
    const { filter: filterDialog } = useAppSelector(getDialogs);
    const appliedFilters = useAppSelector(getSentImagesFilters);
    const pageSize = useAppSelector(getSentImagesPaginatedPageSize);
    const activeFilterCount = [
        appliedFilters.status !== 'all',
        appliedFilters.shipping !== 'all',
        Boolean(appliedFilters.sender),
        Boolean(appliedFilters.receiver),
    ].filter(Boolean).length;

    const statusFilter = filterDialog.statusFilter;
    const shippingFilter = filterDialog.shippingFilter;
    const senderFilter = filterDialog.senderFilter;
    const receiverFilter = filterDialog.receiverFilter;
    const hideToYouFilter = filterDialog.hideToYouFilter;

    const handleStatusChange = (event: SelectChangeEvent) => {
        const newStatus = event.target.value as StatusFilter;
        dispatch(setStatusFilter({ statusFilter: newStatus }));

        // Use setTimeout to ensure Redux state is updated before calling the callback
        setTimeout(() => {
            onFiltersChange({
                status: newStatus,
                shipping: shippingFilter,
                sender: senderFilter,
                receiver: receiverFilter,
            });
        }, 0);
    };

    const handleHideToYouChange = () => {
        const newHideToYou = !hideToYouFilter;
        dispatch(setHideToYouFilter({ hideToYouFilter: newHideToYou }));
    };

    const handleShippingChange = (event: SelectChangeEvent) => {
        const newShipping = event.target.value as ShippingFilter;
        dispatch(setShippingFilter({ shippingFilter: newShipping }));

        // Use setTimeout to ensure Redux state is updated before calling the callback
        setTimeout(() => {
            onFiltersChange({
                status: statusFilter,
                shipping: newShipping,
                sender: senderFilter,
                receiver: receiverFilter,
            });
        }, 0);
    };

    const handleClearFilters = () => {
        dispatch(resetFilters());

        // Use setTimeout to ensure Redux state is updated before calling the callback
        setTimeout(() => {
            onFiltersChange({
                status: 'all',
                shipping: 'all',
                sender: '',
                receiver: '',
            });
        }, 0);
    };

    const applyUserFilter = (change: { sender?: string; receiver?: string }) => {
        const sender = change.sender ?? senderFilter;
        const receiver = change.receiver ?? receiverFilter;
        if (change.sender !== undefined) dispatch(setSenderFilter({ senderFilter: sender }));
        if (change.receiver !== undefined) dispatch(setRecieverFilter({ receiverFilter: receiver }));
        onFiltersChange({ status: statusFilter, shipping: shippingFilter, sender, receiver });
    };

    const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
        dispatch(setSentImagesPaginatedPageSize(Number(event.target.value)));
        dispatch(setSentImagesPaginatedPage(1));
    };

    const handleOpenExtendedFilters = () => {
        dispatch(openFilterDialog());
    };

    const pageSizeSelect = (
        <FormControl fullWidth disabled={disabled}>
            <InputLabel id="image-page-size-label">Fotos pro Seite</InputLabel>
            <Select
                labelId="image-page-size-label"
                id="image-page-size"
                value={pageSize}
                label="Fotos pro Seite"
                onChange={handlePageSizeChange}
            >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={30}>30</MenuItem>
            </Select>
        </FormControl>
    );

    // On phones the five controls would push the photos below the fold; they live in the dialog instead.
    if (isCompact) {
        return (
            <Box sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleOpenExtendedFilters}
                        disabled={disabled}
                        aria-label={activeFilterCount > 0 ? `Filter (${activeFilterCount} aktiv)` : 'Filter'}
                        startIcon={
                            <Badge badgeContent={activeFilterCount} color="primary">
                                <FilterListIcon />
                            </Badge>
                        }
                        sx={{ flex: 1, minHeight: 44 }}
                    >
                        Filter
                    </Button>
                    {activeFilterCount > 0 && (
                        <IconButton
                            onClick={handleClearFilters}
                            disabled={disabled}
                            aria-label="Filter zurücksetzen"
                            sx={{ width: 44, height: 44 }}
                        >
                            <FilterListOffIcon />
                        </IconButton>
                    )}
                    <FormControl size="small" disabled={disabled} sx={{ width: 120 }}>
                        <InputLabel id="image-page-size-compact-label" sx={visuallyHidden}>Fotos pro Seite</InputLabel>
                        <Select
                            labelId="image-page-size-compact-label"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            renderValue={(value) => `${value} / Seite`}
                            sx={{ height: 44 }}
                        >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={30}>30</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                {/* A display switch, not a filter: it acts at once and stays in reach. */}
                <Box sx={{ mt: 1 }}>
                    <BlurToggle checked={hideToYouFilter} onChange={handleHideToYouChange} disabled={disabled} height={44} />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Grid container spacing={2}>
                <Grid size={3}>
                    <FormControl fullWidth disabled={disabled}>
                        <InputLabel id="image-status-filter-label">Status</InputLabel>
                        <Select
                            labelId="image-status-filter-label"
                            id="image-status-filter"
                            value={statusFilter}
                            label="Status"
                            onChange={handleStatusChange}
                        >
                            <MenuItem value="all">Alle Fotos</MenuItem>
                            <MenuItem value="active">Aktive</MenuItem>
                            <MenuItem value="expired">Abgelaufene</MenuItem>
                            <MenuItem value="scheduled">Geplante</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={3}>
                    <FormControl fullWidth disabled={disabled}>
                        <InputLabel id="image-shipping-filter-label">Richtung</InputLabel>
                        <Select
                            labelId="image-shipping-filter-label"
                            id="image-shipping-filter"
                            value={shippingFilter}
                            label="Richtung"
                            onChange={handleShippingChange}
                        >
                            <MenuItem value="all">Alle Fotos</MenuItem>
                            <MenuItem value="sentToYou">An dich gesendete</MenuItem>
                            <MenuItem value="sentByYou">Von dir gesendete</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={3}>
                    <UserFilterSelect
                        label="Absender"
                        emptyLabel="Alle Absender"
                        value={senderFilter}
                        onChange={(sender) => applyUserFilter({ sender })}
                        disabled={disabled}
                    />
                </Grid>
                <Grid size={3}>
                    <UserFilterSelect
                        label="Empfänger"
                        emptyLabel="Alle Empfänger"
                        value={receiverFilter}
                        onChange={(receiver) => applyUserFilter({ receiver })}
                        disabled={disabled}
                    />
                </Grid>
                <Grid size={6}>
                    <BlurToggle checked={hideToYouFilter} onChange={handleHideToYouChange} disabled={disabled} height={56} />
                </Grid>
                <Grid size={3}>
                    {pageSizeSelect}
                </Grid>
                <Grid size={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Button
                        variant="text"
                        onClick={handleClearFilters}
                        startIcon={<FilterListOffIcon />}
                        disabled={disabled || activeFilterCount === 0}
                        sx={{ minHeight: 44 }}
                    >
                        Filter zurücksetzen
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FilterControls;
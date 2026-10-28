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
    FormGroup,
    FormControlLabel,
    Badge,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useAppDispatch, useAppSelector } from '@/store';
import {
    getDialogs,
    openFilterDialog,
    resetFilters,
    setHideToYouFilter,
    setShippingFilter,
    setStatusFilter
} from '@/store/ui/sentImages/sentImages.slice';
import { ISentImagesFilters, ShippingFilter, StatusFilter } from '@/types';
import { getSentImagesFilters } from '@/store/entities/images/images.slice';

export interface FilterControlsProps {
    onFiltersChange: (filters: ISentImagesFilters) => void;
    disabled?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    onFiltersChange,
    disabled = false
}) => {
    const dispatch = useAppDispatch();
    const theme = useTheme();
    const isCompact = useMediaQuery(theme.breakpoints.down('md'));
    const { filter: filterDialog } = useAppSelector(getDialogs);
    const appliedFilters = useAppSelector(getSentImagesFilters);
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

    const handleOpenExtendedFilters = () => {
        dispatch(openFilterDialog());
    };

    // On phones the five controls would push the photos below the fold; they live in the dialog instead.
    if (isCompact) {
        return (
            <Box sx={{ width: '100%', mb: 2, display: 'flex', gap: 1 }}>
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
                    <Button
                        variant="text"
                        onClick={handleClearFilters}
                        disabled={disabled}
                        startIcon={<FilterListOffIcon />}
                        sx={{ minHeight: 44 }}
                    >
                        Zurücksetzen
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Grid container spacing={2}>
                <Grid
                    size={{
                        xs: 12,
                        md: 3
                    }}>
                    <FormControl fullWidth disabled={disabled}>
                        <InputLabel id="image-status-filter-label">
                            Status Filter
                        </InputLabel>
                        <Select
                            labelId="image-status-filter-label"
                            id="image-status-filter"
                            value={statusFilter}
                            label="Status Filter"
                            onChange={handleStatusChange}
                        >
                            <MenuItem value="all">Alle Fotos</MenuItem>
                            <MenuItem value="active">Aktive</MenuItem>
                            <MenuItem value="expired">Abgelaufene</MenuItem>
                            <MenuItem value="scheduled">Geplante</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        md: 3
                    }}>
                    <FormControl fullWidth disabled={disabled}>
                        <InputLabel id="image-shipping-filter-label">
                            Versand Filter
                        </InputLabel>
                        <Select
                            labelId="image-shipping-filter-label"
                            id="image-shipping-filter"
                            value={shippingFilter}
                            label="Versand Filter"
                            onChange={handleShippingChange}
                        >
                            <MenuItem value="all">Alle Fotos</MenuItem>
                            <MenuItem value="sentToYou">An dich gesendete</MenuItem>
                            <MenuItem value="sentByYou">Von dir gesendete</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        md: 3
                    }}>
                    <FormControl
                        fullWidth
                        disabled={disabled}
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            border: (theme) => `1px solid ${theme.palette.action.disabled}`,
                            borderRadius: 1,
                            padding: '8px 14px',
                            height: '56px',
                            '&:hover': {
                                borderColor: (theme) => theme.palette.text.primary,
                            },
                            '& .MuiFormControlLabel-root': {
                                marginLeft: 0,
                                marginRight: 0,
                            },
                            '& .MuiSwitch-root': {
                                marginRight: (theme) => theme.spacing(1),
                            }
                        }}
                    >
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={hideToYouFilter}
                                        onChange={handleHideToYouChange}
                                    />
                                }
                                label="Fotos an dich verbergen"
                            />
                        </FormGroup>
                    </FormControl>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        md: 3
                    }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleOpenExtendedFilters}
                        startIcon={<FilterListIcon />}
                        sx={{ height: '56px' }}
                        disabled={disabled}
                    >
                        Mehr Filter
                    </Button>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        md: 3
                    }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleClearFilters}
                        startIcon={<FilterListOffIcon />}
                        sx={{ height: '56px' }}
                        disabled={disabled}
                    >
                        Filter löschen
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FilterControls;
import React, { useEffect } from 'react';
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
    FormControlLabel
} from '@mui/material';
import HideImageIcon from '@mui/icons-material/HideImage';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ISentImage, ShippingFilter, StatusFilter } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { getDialogs, openFilterDialog, resetFilters, setHideToYouFilter, setShippingFilter, setStatusFilter } from '@/store/ui/sentImages/sentImages.slice';
import { getUser } from '@/store/entities/authentication/authentication.slice';

export interface FilterControlsProps {
    images: ISentImage[];
    currentUser: { username: string };
    onFilteredImagesChange: (filteredImages: ISentImage[]) => void;
    disabled?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    images,
    currentUser,
    onFilteredImagesChange,
    disabled = false
}) => {
    const dispatch = useAppDispatch();
    const { filter: filterDialog } = useAppSelector(getDialogs);
    const user = useAppSelector(getUser);

    const statusFilter = filterDialog.statusFilter;
    const shippingFilter = filterDialog.shippingFilter;
    const senderFilter = filterDialog.senderFilter;
    const receiverFilter = filterDialog.receiverFilter;
    const hideToYouFilter = filterDialog.hideToYouFilter;

    const filterByStatus = (image: ISentImage, status: StatusFilter): boolean => {
        const expiryDate = new Date(image.expires_at);
        const isExpired = expiryDate < new Date();

        switch (status) {
            case 'active':
                return !isExpired;
            case 'expired':
                return isExpired;
            default:
                return true;
        }
    };

    const filterByShipping = (image: ISentImage, status: ShippingFilter): boolean => {
        switch (status) {
            case 'sentToYou':
                return image.reciever == user.me.username;
            case 'sentByYou':
                return image.sender == user.me.username;
            default:
                return true;
        }
    };

    const filterBySender = (image: ISentImage, searchTerm: string): boolean => {
        if (!searchTerm) return true;

        const isSender = image.sender === currentUser.username;
        const searchTermLower = searchTerm.toLowerCase();

        return isSender ?
            "Du".toLowerCase().includes(searchTermLower) :
            image.sender.toLowerCase().includes(searchTermLower);
    };

    const filterByReceiver = (image: ISentImage, searchTerm: string): boolean => {
        if (!searchTerm) return true;

        const isReceiver = image.reciever === currentUser.username;
        const searchTermLower = searchTerm.toLowerCase();

        return isReceiver ?
            "Du".toLowerCase().includes(searchTermLower) :
            image.reciever.toLowerCase().includes(searchTermLower);
    };

    const applyFilters = () => {
        const filteredImages = images.filter(image =>
            filterByStatus(image, statusFilter) &&
            filterByShipping(image, shippingFilter) &&
            filterBySender(image, senderFilter) &&
            filterByReceiver(image, receiverFilter)
        );
        onFilteredImagesChange(filteredImages);
    };

    const handleStatusChange = (event: SelectChangeEvent) => {
        dispatch(setStatusFilter({ statusFilter: event.target.value }));
    };

    const handleHideToYouChange = () => {
        dispatch(setHideToYouFilter({ hideToYouFilter: !hideToYouFilter }));
    };

    const handleShippingChange = (event: SelectChangeEvent) => {
        dispatch(setShippingFilter({ shippingFilter: event.target.value }));
    };

    const handleClearFilters = () => {
        dispatch(resetFilters());
    };

    const handleOpenExtendedFilters = () => {
        dispatch(openFilterDialog());
    };


    useEffect(() => {
        applyFilters();
    }, [
        statusFilter,
        shippingFilter,
        senderFilter,
        receiverFilter,
        hideToYouFilter,
        images
    ]);

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
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
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth disabled={disabled}>
                        <InputLabel id="image-shipping-filter-label">
                            Versand Filter
                        </InputLabel>
                        <Select
                            labelId="image-shipping-filter-label"
                            id="image-shipping-filter"
                            value={shippingFilter}
                            label="Status Filter"
                            onChange={handleShippingChange}
                        >
                            <MenuItem value="all">Alle Fotos</MenuItem>
                            <MenuItem value="sentToYou">An dich gesendete</MenuItem>
                            <MenuItem value="sentByYou">Von dir gesendete</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={3}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleClearFilters}
                        startIcon={<HideImageIcon />}
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
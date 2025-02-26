import React from 'react';
import {
    Box,
    Grid,
    MenuItem,
    TextField
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { getApi, getImagesPaginatedPageSize } from '@/store/entities/images/images.slice';
import { setImagesPaginatedPageSize } from '@/store/entities/images/images.actions';

export interface FilterControlsProps {
}

const FilterControls: React.FC<FilterControlsProps> = () => {
    const dispatch = useAppDispatch();

    const pageSize = useAppSelector(getImagesPaginatedPageSize);
    const loading = useAppSelector(getApi).loading;

    const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newPageSize = parseInt(event.target.value);
        dispatch(setImagesPaginatedPageSize(newPageSize));
    };

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        select
                        label="Anzahl auf Seite angezeigte Fotos"
                        value={pageSize}
                        onChange={handlePageSizeChange}
                        disabled={loading}
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                    </TextField>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FilterControls;
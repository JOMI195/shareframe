import React from 'react';
import { Box, Typography } from '@mui/material';
import EpaperToggle, { EpaperView } from '@/main/images/epaper/epaperToggle';

interface StepHeaderProps {
    fileName: string;
    view: EpaperView;
    onViewChange: (view: EpaperView) => void;
}

const StepHeader: React.FC<StepHeaderProps> = ({ fileName, view, onViewChange }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <Typography variant="h6">
            {fileName}
        </Typography>
        <EpaperToggle value={view} onChange={onViewChange} />
    </Box>
);

export default StepHeader;

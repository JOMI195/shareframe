import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { useState } from 'react';

const ZOOM_FACTOR = 0.1;
const MIN_ZOOM = -5;
const MAX_ZOOM = 1;

interface NavigationProps {
    onZoom?: (value: number, transitions?: boolean) => void;
    disabled?: unknown;
}

export const Navigation: React.FC<NavigationProps> = ({ onZoom, disabled }) => {
    const [zoom, setZoom] = useState(0);

    const handleZoomIn = () => {
        if (onZoom && typeof zoom === 'number') {
            const newZoom = zoom + ZOOM_FACTOR;
            setZoom(newZoom);
            onZoom(newZoom, true);
        }
    };

    const handleZoomOut = () => {
        if (onZoom && typeof zoom === 'number') {
            const newZoom = zoom - ZOOM_FACTOR;
            setZoom(newZoom);
            onZoom(newZoom, true);
        }
    };

    const handleSliderChange = (_: Event, newValue: number | number[]) => {
        if (onZoom) {
            setZoom(newValue as number)
            onZoom(newValue as number, false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                p: 1,
                mt: 1
            }}
        >
            <IconButton
                onClick={handleZoomOut}
                disabled={!!disabled || zoom === MIN_ZOOM}
                size="small"
                sx={{ color: 'text.secondary', mr: 1 }}
            >
                <ZoomOutIcon />
            </IconButton>
            <Slider
                value={zoom}
                onChange={handleSliderChange}
                disabled={!!disabled}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                aria-labelledby="zoom-slider"
                sx={{
                    flex: 1,
                    '& .MuiSlider-thumb': {
                        width: 20,
                        height: 20,
                        '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)',
                        },
                    },
                    '& .MuiSlider-rail': {
                        opacity: 0.28,
                    },
                }}
            />
            <IconButton
                onClick={handleZoomIn}
                disabled={!!disabled || zoom === MAX_ZOOM}
                size="small"
                sx={{ color: 'text.secondary', ml: 1 }}
            >
                <ZoomInIcon />
            </IconButton>
        </Box>
    );
};
import { Box, Button, Grid, IconButton, Slider, Typography } from '@mui/material';
import React from 'react';

import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import Forward30Icon from '@mui/icons-material/Forward30';
import Replay30Icon from '@mui/icons-material/Replay30';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface NavigationProps {
    zoom: number;
    onZoom: (zoom: number) => void;
    rotation: number;
    onRotation: (rotation: number) => void;
    onCenter: () => void;
    onCropperReset: () => void;
    disabled: boolean;
    ZOOM_FACTOR: number;
    MIN_ZOOM: number;
    MAX_ZOOM: number;
    ROTATION_DEGREE: number;
    MIN_ROTATION: number;
    MAX_ROTATION: number;
}

export const Navigation: React.FC<NavigationProps> = ({
    onZoom,
    disabled,
    zoom,
    rotation,
    onRotation,
    onCenter,
    onCropperReset,
    ZOOM_FACTOR,
    MIN_ZOOM,
    MAX_ZOOM,
    ROTATION_DEGREE,
    MIN_ROTATION,
    MAX_ROTATION,
}) => {

    const handleZoomIn = () => {
        if (onZoom && typeof zoom === 'number') {
            const newZoom = zoom + ZOOM_FACTOR;
            onZoom(newZoom);
        }
    };

    const handleZoomOut = () => {
        if (onZoom && typeof zoom === 'number') {
            const newZoom = zoom - ZOOM_FACTOR;
            onZoom(newZoom);
        }
    };

    const handleZoomSliderChange = (_: Event, value: number | number[], __: number) => {
        if (typeof value === 'number') {
            onZoom(value);
        }
    };

    const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;

    const snapToNearestDegree = (rotation: number, step: number) => {
        const remainder = rotation % step;
        if (remainder === 0) return rotation;
        return remainder > step / 2 ? rotation + (step - remainder) : rotation - remainder;
    };

    const handleRotationForward = () => {
        if (onRotation && typeof rotation === 'number') {
            let newRotation = rotation % ROTATION_DEGREE === 0 ? rotation - ROTATION_DEGREE : snapToNearestDegree(rotation, ROTATION_DEGREE);
            newRotation = normalizeRotation(newRotation);
            onRotation(newRotation);
        }
    };

    const handleRotationReplay = () => {
        if (onRotation && typeof rotation === 'number') {
            let newRotation = rotation % ROTATION_DEGREE === 0 ? rotation + ROTATION_DEGREE : snapToNearestDegree(rotation, ROTATION_DEGREE);
            newRotation = normalizeRotation(newRotation);
            onRotation(newRotation);
        }
    };

    const handleRotationSliderChange = (_: Event, value: number | number[], __: number) => {
        if (typeof value === 'number') {
            onRotation(value);
        }
    };

    return (
        <Box display="flex" flexDirection={"column"} alignItems="center" width="100%">
            <Box display="flex" alignItems="center" width="100%" borderRadius={1}
                sx={{
                    bgcolor: "background.paper",
                    pl: 2,
                    pr: 1,
                    mt: 1
                }}
            >
                <Typography variant='body2' width={60}>
                    Zoom
                </Typography>
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
                    onChange={handleZoomSliderChange}
                    disabled={disabled}
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    aria-labelledby="zoom-slider"
                    style={{ flex: 1 }}
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
            <Box display="flex" alignItems="center" width="100%" borderRadius={1}
                sx={{
                    bgcolor: "background.paper",
                    pl: 2,
                    pr: 1,
                    mt: 1
                }}
            >
                <Typography variant='body2' width={60}>
                    Rotation
                </Typography>
                <IconButton
                    onClick={handleRotationForward}
                    disabled={!!disabled || rotation <= MIN_ROTATION}
                    size="small"
                    sx={{ color: 'text.secondary', mr: 1 }}
                >
                    <Forward30Icon />
                </IconButton>
                <Slider
                    value={rotation}
                    onChange={handleRotationSliderChange}
                    disabled={disabled}
                    min={MIN_ROTATION}
                    max={MAX_ROTATION}
                    step={1}
                    aria-labelledby="rotation-slider"
                    style={{ flex: 1 }}
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
                    onClick={handleRotationReplay}
                    disabled={!!disabled || rotation >= MAX_ROTATION}
                    size="small"
                    sx={{ color: 'text.secondary', ml: 1 }}
                >
                    <Replay30Icon />
                </IconButton>
            </Box>
            <Grid justifyContent={"space-between"} container sx={{ mt: 1 }}>
                <Grid item xs={5.8}>
                    <Button fullWidth startIcon={<CenterFocusStrongIcon />} sx={{ bgcolor: "background.paper", color: "white" }} onClick={onCenter}>Zentrieren</Button>
                </Grid>
                <Grid item xs={5.8}>
                    <Button fullWidth startIcon={<RestartAltIcon />} sx={{ bgcolor: "background.paper", color: "white" }} onClick={onCropperReset}>Reset</Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Navigation;
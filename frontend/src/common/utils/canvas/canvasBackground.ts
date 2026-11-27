import type { Theme } from '@mui/material';

// The letterbox around a photo in the editors.
export const canvasBackground = (theme: Theme) => (theme.palette.mode === 'light' ? '#e0e0e0' : '#000000');

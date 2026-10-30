import React from 'react';
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';

const IMAGES_AUTO_DELETE_INTERVAL_HOURS = import.meta.env.VITE_APP_IMAGES_AUTO_DELETE_INTERVAL_HOURS
    ? +import.meta.env.VITE_APP_IMAGES_AUTO_DELETE_INTERVAL_HOURS
    : 24;

interface AutoDeleteOptionProps {
    checked: boolean;
    onChange: (value: boolean) => void;
}

const AutoDeleteOption: React.FC<AutoDeleteOptionProps> = ({ checked, onChange }) => (
    <Box sx={{ mt: 1 }}>
        <FormControlLabel
            control={
                <Checkbox
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    color="primary"
                />
            }
            label={
                <Box>
                    <Typography variant="body1">
                        Nach {IMAGES_AUTO_DELETE_INTERVAL_HOURS} Std. aus der Galerie löschen
                    </Typography>
                    <Typography variant="body2" sx={{
                        color: "text.secondary"
                    }}>
                        Das Foto verschwindet nach {IMAGES_AUTO_DELETE_INTERVAL_HOURS} Stunden nur aus deiner Galerie. Bereits gesendete und geplante Fotos bleiben in der Aktivität und auf den Bilderrahmen, bis ihre Anzeigedauer endet.
                    </Typography>
                </Box>
            }
        />
    </Box>
);

export default AutoDeleteOption;

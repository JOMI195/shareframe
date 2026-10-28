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
                        Kurze Verwendungszeit aktivieren
                    </Typography>
                    <Typography variant="body2" sx={{
                        color: "text.secondary"
                    }}>
                        Das Bild muss innerhalb von {IMAGES_AUTO_DELETE_INTERVAL_HOURS} Stunden an deine Freunde gesendet werden und wird anschließend automatisch gelöscht. Gesendete Bilder werden trotz der Löschung weiterhin bis zum Ablauf normal angezeigt.
                    </Typography>
                </Box>
            }
        />
    </Box>
);

export default AutoDeleteOption;

import React from 'react';
import { Box, FormControlLabel, Switch } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { deDE } from '@mui/x-date-pickers/locales';
import { de } from 'date-fns/locale';
import { MAX_SCHEDULE_DAYS, maxScheduleDate } from './schedule';

interface ScheduleSelectorProps {
    enabled: boolean;
    value: Date | null;
    error: string | null;
    onEnabledChange: (enabled: boolean) => void;
    onChange: (value: Date | null) => void;
    disabled?: boolean;
}

const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({ enabled, value, error, onEnabledChange, onChange, disabled }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <FormControlLabel
            control={<Switch checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} disabled={disabled} />}
            label="Zu einem späteren Zeitpunkt senden"
        />
        {enabled && (
            <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={de}
                localeText={deDE.components.MuiLocalizationProvider.defaultProps.localeText}
            >
                <DateTimePicker
                    label="Sendezeitpunkt"
                    value={value}
                    onChange={onChange}
                    ampm={false}
                    format="dd.MM.yyyy HH:mm"
                    disablePast
                    maxDateTime={maxScheduleDate()}
                    disabled={disabled}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            error: error !== null,
                            helperText: error ?? `Höchstens ${MAX_SCHEDULE_DAYS} Tage im Voraus. Die Ablaufzeit zählt ab dem Sendezeitpunkt.`,
                        },
                    }}
                />
            </LocalizationProvider>
        )}
    </Box>
);

export default ScheduleSelector;

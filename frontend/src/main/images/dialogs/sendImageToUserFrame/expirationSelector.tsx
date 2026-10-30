import React, { useState } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    Box,
    FormLabel,
} from '@mui/material';
import { MAX_CUSTOM_EXPIRATION, PREDEFINED_EXPIRATION_OPTIONS, TimeUnit, toExpirationHours } from './expiration';

interface ExpirationSelectorProps {
    expirationHours: number | null;
    onExpirationHoursChange: (hours: number | null) => void;
    disabled?: boolean;
}

type SelectionMode = 'predefined' | 'custom';

const ExpirationSelector: React.FC<ExpirationSelectorProps> = ({
    expirationHours,
    onExpirationHoursChange,
    disabled,
}) => {
    const [customTimeUnit, setCustomTimeUnit] = useState<TimeUnit>('hours');
    const [customTimeValue, setCustomTimeValue] = useState<string>('1');
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('predefined');

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: 1
        },
        radioGroup: {
            mb: 1
        },
        customInputContainer: {
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start'
        },
        timeInput: {
            flex: 1
        },
        unitSelect: {
            minWidth: '120px'
        }
    };

    const handleSelectionModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newMode = event.target.value as SelectionMode;
        setSelectionMode(newMode);
        if (newMode === 'predefined') {
            onExpirationHoursChange(PREDEFINED_EXPIRATION_OPTIONS[0].hours);
        } else {
            setCustomTimeValue('1');
            setCustomTimeUnit('hours');
            onExpirationHoursChange(1);
        }
    };

    const handleCustomTimeValueChange = (newValue: string) => {
        setCustomTimeValue(newValue);
        onExpirationHoursChange(toExpirationHours(newValue, customTimeUnit));
    };

    const handleCustomTimeUnitChange = (newUnit: TimeUnit) => {
        setCustomTimeUnit(newUnit);
        onExpirationHoursChange(toExpirationHours(customTimeValue, newUnit));
    };

    return (
        <Box sx={styles.container}>
            <FormLabel id="expiration-label">Anzeigedauer</FormLabel>
            <RadioGroup
                value={selectionMode}
                onChange={handleSelectionModeChange}
                sx={styles.radioGroup}
                aria-labelledby="expiration-label"
            >
                <FormControlLabel
                    value="predefined"
                    control={<Radio />}
                    label="Vorgaben"
                    disabled={disabled}
                />
                <FormControlLabel
                    value="custom"
                    control={<Radio />}
                    label="Eigene Dauer"
                    disabled={disabled}
                />
            </RadioGroup>

            {selectionMode === 'predefined' ? (
                <FormControl fullWidth disabled={disabled}>
                    <InputLabel>Anzeigedauer</InputLabel>
                    <Select
                        value={expirationHours ?? PREDEFINED_EXPIRATION_OPTIONS[0].hours}
                        label="Anzeigedauer"
                        onChange={(e) => onExpirationHoursChange(Number(e.target.value))}
                    >
                        {PREDEFINED_EXPIRATION_OPTIONS.map((option) => (
                            <MenuItem key={option.hours} value={option.hours}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            ) : (
                <Box sx={styles.customInputContainer}>
                    <TextField
                        type="number"
                        value={customTimeValue}
                        onChange={(e) => handleCustomTimeValueChange(e.target.value)}
                        label="Dauer"
                        sx={styles.timeInput}
                        disabled={disabled}
                        error={expirationHours === null}
                        helperText={expirationHours === null ? `Eine ganze Zahl von 1 bis ${MAX_CUSTOM_EXPIRATION}` : undefined}
                        slotProps={{
                            htmlInput: { min: 1, max: MAX_CUSTOM_EXPIRATION, inputMode: 'numeric' }
                        }}
                    />
                    <FormControl sx={styles.unitSelect} disabled={disabled}>
                        <InputLabel>Einheit</InputLabel>
                        <Select
                            value={customTimeUnit}
                            label="Einheit"
                            onChange={(e) => handleCustomTimeUnitChange(e.target.value as TimeUnit)}
                        >
                            <MenuItem value="hours">Stunden</MenuItem>
                            <MenuItem value="days">Tage</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            )}
        </Box>
    );
};

export default ExpirationSelector;
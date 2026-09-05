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
} from '@mui/material';
import { PREDEFINED_EXPIRATION_OPTIONS, TimeUnit, toExpirationHours } from './expiration';

interface ExpirationSelectorProps {
    expirationHours: number;
    onExpirationHoursChange: (hours: number) => void;
}

type SelectionMode = 'predefined' | 'custom';

const ExpirationSelector: React.FC<ExpirationSelectorProps> = ({
    expirationHours,
    onExpirationHoursChange
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
            <RadioGroup
                value={selectionMode}
                onChange={handleSelectionModeChange}
                sx={styles.radioGroup}
            >
                <FormControlLabel
                    value="predefined"
                    control={<Radio />}
                    label="Vordefinierte Zeiten"
                />
                <FormControlLabel
                    value="custom"
                    control={<Radio />}
                    label="Benutzerdefinierte Zeit"
                />
            </RadioGroup>

            {selectionMode === 'predefined' ? (
                <FormControl fullWidth>
                    <InputLabel>Ablaufzeit</InputLabel>
                    <Select
                        value={expirationHours}
                        label="Ablaufzeit"
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
                        label="Zeit"
                        sx={styles.timeInput}
                        slotProps={{
                            htmlInput: { min: 1, max: 365 }
                        }}
                    />
                    <FormControl sx={styles.unitSelect}>
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
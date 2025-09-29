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

interface ExpirationOption {
    label: string;
    hours: number;
}

interface ExpirationSelectorProps {
    expirationHours: number;
    onExpirationHoursChange: (hours: number) => void;
}

type TimeUnit = 'hours' | 'days';
type SelectionMode = 'predefined' | 'custom';

const PREDEFINED_OPTIONS: ExpirationOption[] = [
    { label: '24 Stunden', hours: 24 },
    { label: '7 Tage', hours: 168 },
    { label: '14 Tage', hours: 336 },
    { label: '30 Tage', hours: 720 }
];

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
            onExpirationHoursChange(PREDEFINED_OPTIONS[0].hours);
        }
    };

    const handleCustomTimeValueChange = (newValue: string) => {
        setCustomTimeValue(newValue);
        const numericValue = parseInt(newValue) || 1;
        const hoursValue = customTimeUnit === 'days' ? numericValue * 24 : numericValue;
        onExpirationHoursChange(hoursValue);
    };

    const handleCustomTimeUnitChange = (newUnit: TimeUnit) => {
        setCustomTimeUnit(newUnit);
        const numericValue = parseInt(customTimeValue) || 1;
        const hoursValue = newUnit === 'days' ? numericValue * 24 : numericValue;
        onExpirationHoursChange(hoursValue);
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
                        {PREDEFINED_OPTIONS.map((option) => (
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
                        inputProps={{ min: 1, max: 365 }}
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
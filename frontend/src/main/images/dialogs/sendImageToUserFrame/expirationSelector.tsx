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
    value: number;
    onChange: (hours: number) => void;
}

type TimeUnit = 'hours' | 'days';
type SelectionMode = 'predefined' | 'custom';

const PREDEFINED_OPTIONS: ExpirationOption[] = [
    { label: '24 Stunden', hours: 24 },
    { label: '7 Tage', hours: 168 },
    { label: '14 Tage', hours: 336 },
    { label: '30 Tage', hours: 720 }
];

const ExpirationSelector: React.FC<ExpirationSelectorProps> = ({ value, onChange }) => {
    const [timeUnit, setTimeUnit] = useState<TimeUnit>('hours');
    const [customValue, setCustomValue] = useState<string>(String(value));
    const [selectedOption, setSelectedOption] = useState<SelectionMode>('predefined');

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

    const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedOption(event.target.value as SelectionMode);
        if (event.target.value === 'predefined') {
            onChange(PREDEFINED_OPTIONS[0].hours);
        }
    };

    const handleCustomValueChange = (newValue: string) => {
        setCustomValue(newValue);
        const numValue = parseInt(newValue) || 1;
        const hours = timeUnit === 'days' ? numValue * 24 : numValue;
        onChange(hours);
    };

    return (
        <Box sx={styles.container}>
            <RadioGroup
                value={selectedOption}
                onChange={handleOptionChange}
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

            {selectedOption === 'predefined' ? (
                <FormControl fullWidth>
                    <InputLabel>Ablaufzeit</InputLabel>
                    <Select
                        value={value}
                        label="Ablaufzeit"
                        onChange={(e) => onChange(Number(e.target.value))}
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
                        value={customValue}
                        onChange={(e) => handleCustomValueChange(e.target.value)}
                        label="Zeit"
                        sx={styles.timeInput}
                        inputProps={{ min: 1, max: 365 }}
                    />
                    <FormControl sx={styles.unitSelect}>
                        <InputLabel>Einheit</InputLabel>
                        <Select
                            value={timeUnit}
                            label="Einheit"
                            onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
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
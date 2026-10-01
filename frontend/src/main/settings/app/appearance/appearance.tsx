import { ColorPreference, useColorThemeContext } from "@/context/colorTheme/colorThemeContextValue";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

const options: { value: ColorPreference; label: string; icon: React.ReactElement }[] = [
    { value: 'light', label: 'Hell', icon: <LightModeIcon fontSize="small" /> },
    { value: 'dark', label: 'Dunkel', icon: <DarkModeIcon fontSize="small" /> },
    { value: 'system', label: 'System', icon: <SettingsBrightnessIcon fontSize="small" /> },
];

const Appearance = () => {
    const { colorPreference, setColorPreference } = useColorThemeContext();

    const handleChange = (_event: React.MouseEvent<HTMLElement>, value: ColorPreference | null) => {
        if (value) setColorPreference(value);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body1">Darstellung</Typography>
            <ToggleButtonGroup
                value={colorPreference}
                exclusive
                onChange={handleChange}
                size="small"
                aria-label="Darstellung"
            >
                {options.map((option) => (
                    <ToggleButton key={option.value} value={option.value} sx={{ gap: 1, textTransform: 'none' }}>
                        {option.icon}
                        {option.label}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
};

export default Appearance;

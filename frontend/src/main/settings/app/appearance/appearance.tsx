import { ColorPreference, useColorThemeContext } from "@/context/colorTheme/colorThemeContextValue";
import { Box, Stack, Switch, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useAppDispatch, useAppSelector } from "@/store";
import { getSeasonalThemes, seasonalThemesSelected } from "@/store/ui/settings/settings.slice";

const options: { value: ColorPreference; label: string; icon: React.ReactElement }[] = [
    { value: 'light', label: 'Hell', icon: <LightModeIcon fontSize="small" /> },
    { value: 'dark', label: 'Dunkel', icon: <DarkModeIcon fontSize="small" /> },
    { value: 'system', label: 'System', icon: <SettingsBrightnessIcon fontSize="small" /> },
];

const Appearance = () => {
    const { colorPreference, setColorPreference } = useColorThemeContext();
    const seasonalThemes = useAppSelector(getSeasonalThemes);
    const dispatch = useAppDispatch();

    const handleChange = (_event: React.MouseEvent<HTMLElement>, value: ColorPreference | null) => {
        if (value) setColorPreference(value);
    };

    return (
        <Stack spacing={3}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box>
                    <Typography variant="body1">Saisonale Deko</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Kleine Akzente zu Halloween und anderen Anlässen
                    </Typography>
                </Box>
                <Switch
                    checked={seasonalThemes}
                    onChange={(event) => dispatch(seasonalThemesSelected(event.target.checked))}
                    slotProps={{ input: { 'aria-label': 'Saisonale Deko' } }}
                />
            </Box>
        </Stack>
    );
};

export default Appearance;

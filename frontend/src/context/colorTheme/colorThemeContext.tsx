import React, { PropsWithChildren, useSyncExternalStore } from 'react';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import light from '@/common/themes/lightTheme';
import dark from '@/common/themes/darkTheme';
import { ThemeProvider } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { designSelected, getDesign } from '@/store/ui/settings/settings.slice';
import { ColorMode, ColorPreference, ColorThemeContext, ColorThemeContextType } from './colorThemeContextValue';

const DARK_QUERY = '(prefers-color-scheme: dark)';

// Read live, never stored: iOS flips the scheme while snapshotting a backgrounded app.
const subscribeToSystemScheme = (onChange: () => void) => {
    const mediaQuery = window.matchMedia(DARK_QUERY);
    // Safari 13 and older only know addListener.
    if (typeof mediaQuery.addEventListener !== 'function') {
        mediaQuery.addListener(onChange);
        return () => mediaQuery.removeListener(onChange);
    }
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
};

const getSystemPrefersDark = () => window.matchMedia(DARK_QUERY).matches;

export const ColorThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const dispatch = useAppDispatch();
    const colorPreference = useAppSelector(getDesign);
    const systemPrefersDark = useSyncExternalStore(subscribeToSystemScheme, getSystemPrefersDark);

    const colorMode: ColorMode = colorPreference === 'system'
        ? (systemPrefersDark ? 'dark' : 'light')
        : colorPreference;

    const setColorPreference = (preference: ColorPreference) => {
        dispatch(designSelected(preference));
    };

    const contextValue: ColorThemeContextType = {
        theme: colorMode === 'dark' ? dark : light,
        colorMode,
        colorPreference,
        setColorPreference,
        toggleColorMode: () => setColorPreference(colorMode === 'light' ? 'dark' : 'light'),
        iconComponent: colorMode === 'dark' ? DarkModeIcon : LightModeIcon,
    };

    return (
        <ColorThemeContext.Provider value={contextValue}>
            <ThemeProvider theme={contextValue.theme}>
                {children}
            </ThemeProvider>
        </ColorThemeContext.Provider>
    );
};

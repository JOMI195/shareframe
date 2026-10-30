import React, { PropsWithChildren, useEffect, useMemo, useSyncExternalStore } from 'react';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import light from '@/common/themes/lightTheme';
import dark from '@/common/themes/darkTheme';
import { alpha, createTheme, GlobalStyles, ThemeProvider } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store';
import { designSelected, getDesign, getSeasonalThemes } from '@/store/ui/settings/settings.slice';
import { getIsSignedIn } from '@/store/entities/authentication/authentication.slice';
import { activeSeason } from '@/common/seasons/seasons';
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
    const seasonalThemes = useAppSelector(getSeasonalThemes);
    const signedIn = useAppSelector(getIsSignedIn);

    const colorMode: ColorMode = colorPreference === 'system'
        ? (systemPrefersDark ? 'dark' : 'light')
        : colorPreference;

    const season = seasonalThemes && signedIn ? activeSeason() : null;

    const theme = useMemo(() => {
        const base = colorMode === 'dark' ? dark : light;
        if (!season) return base;
        const { accent, secondary, background } = season.palette[colorMode];
        return createTheme(base, {
            palette: { accent: { main: accent }, secondary: { main: secondary }, background: { default: background } },
        });
    }, [colorMode, season]);

    // The installed app's status bar follows the app bar instead of staying white in dark mode.
    useEffect(() => {
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.palette.background.default);
    }, [theme]);

    const contextValue = useMemo<ColorThemeContextType>(() => {
        const setColorPreference = (preference: ColorPreference) => {
            dispatch(designSelected(preference));
        };
        return {
            theme,
            colorMode,
            season,
            colorPreference,
            setColorPreference,
            toggleColorMode: () => setColorPreference(colorMode === 'light' ? 'dark' : 'light'),
            iconComponent: colorMode === 'dark' ? DarkModeIcon : LightModeIcon,
        };
    }, [theme, colorMode, season, colorPreference, dispatch]);

    return (
        <ColorThemeContext.Provider value={contextValue}>
            <ThemeProvider theme={contextValue.theme}>
                {season && <GlobalStyles styles={{ '::selection': { backgroundColor: alpha(theme.palette.secondary.main, 0.35) } }} />}
                {children}
            </ThemeProvider>
        </ColorThemeContext.Provider>
    );
};

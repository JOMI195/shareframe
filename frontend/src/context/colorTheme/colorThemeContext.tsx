import React, { PropsWithChildren, createContext, useContext, useEffect } from 'react';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import light from '@/common/themes/lightTheme';
import dark from '@/common/themes/darkTheme';
import { ThemeProvider } from '@mui/material';
import { RootState, useAppDispatch, useAppSelector } from '@/store';
import { designSelected, getDesign } from '@/store/ui/settings/settings.slice';

type ColorMode = 'light' | 'dark';
type Theme = typeof light | typeof dark;
type IconComponent = typeof LightModeIcon | typeof DarkModeIcon;

interface ColorThemeContextType {
    theme: Theme;
    toggleColorMode: () => void;
    colorMode: ColorMode;
    iconComponent: IconComponent;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export const useColorThemeContext = () => {
    const context = useContext(ColorThemeContext);
    if (!context) {
        throw new Error('useColorThemeContext must be used within a ColorThemeProvider');
    }
    return context;
};

export const ColorThemeProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const dispatch = useAppDispatch();
    const colorModeFromState = useAppSelector((state: RootState) => getDesign(state) as ColorMode);

    // Determine the initial color mode based on the system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialColorMode: ColorMode = colorModeFromState || (systemPrefersDark ? 'dark' : 'light');

    const [iconComponent, setIconComponent] = React.useState<IconComponent>(
        initialColorMode === 'dark' ? DarkModeIcon : LightModeIcon
    );

    const toggleColorMode = () => {
        const newMode: ColorMode = colorModeFromState === 'light' ? 'dark' : 'light';
        dispatch(designSelected(newMode));
    };

    useEffect(() => {
        setIconComponent(colorModeFromState === 'dark' ? DarkModeIcon : LightModeIcon);
    }, [colorModeFromState]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleSystemColorModeChange = (e: MediaQueryListEvent) => {
            const newMode: ColorMode = e.matches ? 'dark' : 'light';
            dispatch(designSelected(newMode));
        };

        mediaQuery.addEventListener('change', handleSystemColorModeChange);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemColorModeChange);
        };
    }, [dispatch]);

    const contextValue: ColorThemeContextType = {
        theme: colorModeFromState === 'dark' ? dark : light,
        colorMode: colorModeFromState,
        toggleColorMode,
        iconComponent,
    };

    return (
        <ColorThemeContext.Provider value={contextValue}>
            <ThemeProvider theme={contextValue.theme}>
                {children}
            </ThemeProvider>
        </ColorThemeContext.Provider>
    );
};

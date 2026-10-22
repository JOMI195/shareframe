import { Box } from '@mui/material';
import { useColorThemeContext } from '@/context/colorTheme/colorThemeContextValue';

const SeasonalDecoration: React.FC<{ top?: number }> = ({ top }) => {
    const { season } = useColorThemeContext();
    if (!season) return null;

    const { Decoration } = season;
    return (
        <Box
            aria-hidden
            data-testid="SeasonalDecoration"
            sx={{
                position: 'fixed',
                top: (theme) => top ?? theme.layout.appbar.height,
                right: 0,
                width: { xs: 64, sm: 96 },
                height: { xs: 64, sm: 96 },
                color: 'text.secondary',
                pointerEvents: 'none',
                zIndex: (theme) => theme.zIndex.appBar - 1,
                displayPrint: 'none',
            }}
        >
            <Decoration />
        </Box>
    );
};

export default SeasonalDecoration;

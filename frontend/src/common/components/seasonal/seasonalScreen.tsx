import { Box } from '@mui/material';
import { useSeasonSlot } from './useSeasonSlot';

const SeasonalScreen: React.FC = () => {
    const overlays = useSeasonSlot('screen');
    if (!overlays.length) return null;

    return (
        <Box
            aria-hidden
            data-testid="SeasonalScreen"
            sx={{
                position: 'fixed',
                top: (theme) => theme.layout.appbar.height,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: (theme) => theme.zIndex.appBar - 1,
                displayPrint: 'none',
            }}
        >
            {overlays.map((Overlay, i) => (
                <Overlay key={i} />
            ))}
        </Box>
    );
};

export default SeasonalScreen;

import { Box } from '@mui/material';
import { useSeasonSlot } from './useSeasonSlot';

const SeasonalAppBar: React.FC = () => {
    const overlays = useSeasonSlot('appBar');
    if (!overlays.length) return null;

    return (
        <Box
            aria-hidden
            data-testid="SeasonalAppBar"
            sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', displayPrint: 'none' }}
        >
            {overlays.map((Overlay, i) => (
                <Overlay key={i} />
            ))}
        </Box>
    );
};

export default SeasonalAppBar;

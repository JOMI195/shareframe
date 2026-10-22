import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useColorThemeContext } from '@/context/colorTheme/colorThemeContextValue';
import { triggerFlyby, useFlybyRun } from '@/common/seasons/flyby';

const SHOWN_KEY = 'seasonalFlybyShown';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const shownThisSession = () => {
    try {
        if (sessionStorage.getItem(SHOWN_KEY)) return true;
        sessionStorage.setItem(SHOWN_KEY, '1');
    } catch {
        // Private mode may block storage; then it just flies on every load.
    }
    return false;
};

const SeasonalFlyby: React.FC = () => {
    const { season } = useColorThemeContext();
    const run = useFlybyRun();
    const [doneRun, setDoneRun] = useState(run);

    useEffect(() => {
        if (season && !reducedMotion() && !shownThisSession()) triggerFlyby();
    }, [season]);

    if (!season || run === doneRun || reducedMotion()) return null;

    const { Flyby } = season;
    return (
        <Box
            aria-hidden
            data-testid="SeasonalFlyby"
            sx={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                color: 'text.primary',
                pointerEvents: 'none',
                zIndex: (theme) => theme.zIndex.snackbar,
                displayPrint: 'none',
            }}
        >
            <Flyby key={run} onDone={() => setDoneRun(run)} />
        </Box>
    );
};

export default SeasonalFlyby;

import { createElement, useEffect, useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { triggerFlyby, useFlybyRun } from '@/common/seasons/flyby';
import { pickNext, type FlybyProps } from '@/common/seasons/seasons';
import { useSeasonSlot } from './useSeasonSlot';

const SHOWN_KEY = 'seasonalFlybyShown';

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
    const flybys = useSeasonSlot('flyby');
    const run = useFlybyRun();
    const [doneRun, setDoneRun] = useState(run);
    const [picked, setPicked] = useState<{ run: number; Flyby: React.ComponentType<FlybyProps> | null }>({ run, Flyby: null });
    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
    const active = flybys.length > 0;

    useEffect(() => {
        if (active && !shownThisSession()) triggerFlyby();
    }, [active]);

    let { Flyby } = picked;
    if (picked.run !== run) {
        Flyby = pickNext(flybys, picked.Flyby);
        setPicked({ run, Flyby });
    }

    if (!active || run === doneRun || !Flyby) return null;

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
            {createElement(Flyby, { key: run, reducedMotion, onDone: () => setDoneRun(run) })}
        </Box>
    );
};

export default SeasonalFlyby;

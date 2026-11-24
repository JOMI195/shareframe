import { createElement, useContext } from 'react';
import { ColorThemeContext } from '@/context/colorTheme/colorThemeContextValue';
import { useSeasonPick } from './useSeasonSlot';

const SeasonalEmptyState: React.FC<{ size: number }> = ({ size }) => {
    const Icon = useSeasonPick('emptyState');
    const look = useContext(ColorThemeContext)?.season?.emptyStateLook;
    if (!Icon) return null;
    const scaled = size * (look?.scale ?? 1);

    return createElement(Icon, {
        'aria-hidden': true,
        sx: {
            position: 'absolute',
            right: -(scaled - size) / 2,
            bottom: 0,
            fontSize: scaled,
            color: 'text.secondary',
            opacity: look?.opacity ?? 0.8,
        },
    });
};

export default SeasonalEmptyState;

import { createElement } from 'react';
import { useSeasonPick } from './useSeasonSlot';

const SeasonalEmptyState: React.FC<{ size: number }> = ({ size }) => {
    const Icon = useSeasonPick('emptyState');
    if (!Icon) return null;

    return createElement(Icon, {
        'aria-hidden': true,
        sx: { position: 'absolute', right: 0, bottom: 0, fontSize: size, color: 'text.secondary', opacity: 0.8 },
    });
};

export default SeasonalEmptyState;

import type { Season } from '../seasons';
import PumpkinIcon from './pumpkinIcon';
import GhostIcon from './ghostIcon';
import HalloweenDecoration from './halloweenDecoration';
import BatsFlyby from './batsFlyby';

const halloween: Season = {
    id: 'halloween',
    label: 'Halloween',
    from: { month: 10, day: 17 },
    to: { month: 10, day: 31 },
    palette: {
        light: { accent: '#E8711A', secondary: '#E8711A', background: '#F4EFEA' },
        dark: { accent: '#FF9F43', secondary: '#FF9F43', background: '#25212B' },
    },
    stripe: 'linear-gradient(90deg, #8b5cf6, #FF9F43)',
    greeting: 'Schaurig schöne Halloween-Zeit!',
    LogoIcon: PumpkinIcon,
    EmptyStateIcon: GhostIcon,
    Decoration: HalloweenDecoration,
    Flyby: BatsFlyby,
};

export default halloween;

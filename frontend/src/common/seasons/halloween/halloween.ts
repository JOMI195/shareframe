import type { Season } from '../seasons';

const halloween: Season = {
    id: 'halloween',
    label: 'Halloween',
    from: { month: 10, day: 17 },
    to: { month: 10, day: 31 },
    palette: {
        light: { accent: '#E8711A', secondary: '#E8711A', background: '#F4EFEA' },
        dark: { accent: '#FF9F43', secondary: '#FF9F43', background: '#25212B' },
    },
    loadOverlays: () => import('./halloweenOverlays'),
};

export default halloween;

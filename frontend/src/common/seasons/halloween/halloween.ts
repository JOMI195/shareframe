import type { Season } from '../seasons';
import PumpkinIcon from './icons/pumpkinIcon';
import GhostIcon from './icons/ghostIcon';
import BatIcon from './icons/batIcon';
import JackOLanternIcon from './icons/jackOLanternIcon';
import Stripe from './overlays/stripe';
import SpiderWeb from './overlays/spiderWeb';
import PeekingGhost from './overlays/peekingGhost';
import BatsFlyby from './overlays/batsFlyby';
import WitchFlyby from './overlays/witchFlyby';
import GhostFlyby from './overlays/ghostFlyby';
import LeavesFlyby from './overlays/leavesFlyby';

const halloween: Season = {
    id: 'halloween',
    label: 'Halloween',
    from: { month: 10, day: 17 },
    to: { month: 10, day: 31 },
    palette: {
        light: { accent: '#E8711A', secondary: '#E8711A', background: '#F4EFEA' },
        dark: { accent: '#FF9F43', secondary: '#FF9F43', background: '#25212B' },
    },
    overlays: {
        logo: [JackOLanternIcon],
        loading: [PumpkinIcon, GhostIcon],
        emptyState: [GhostIcon, PumpkinIcon, BatIcon],
        greeting: ['Schaurig schöne Halloween-Zeit!'],
        appBar: [Stripe],
        screen: [SpiderWeb, PeekingGhost],
        flyby: [BatsFlyby, WitchFlyby, GhostFlyby, LeavesFlyby],
    },
};

export default halloween;

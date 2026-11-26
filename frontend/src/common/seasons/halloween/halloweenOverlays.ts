import type { SeasonOverlays } from '../seasons';
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

const overlays: SeasonOverlays = {
    logo: [JackOLanternIcon],
    loading: [PumpkinIcon, GhostIcon],
    emptyState: [GhostIcon, PumpkinIcon, BatIcon],
    greeting: ['Schaurig schöne Halloween-Zeit!'],
    appBar: [Stripe],
    screen: [SpiderWeb, PeekingGhost],
    flyby: [BatsFlyby, WitchFlyby, GhostFlyby, LeavesFlyby],
};

export default overlays;

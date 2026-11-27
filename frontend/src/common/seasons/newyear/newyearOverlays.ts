import type { SeasonOverlays } from '../seasons';
import PartyHatIcon from './icons/partyHatIcon';
import ChampagneGlass from './art/champagneGlass';
import ToastArt from './art/toastArt';
import MidnightClockArt from './art/midnightClockArt';
import YearBalloonsArt from './art/yearBalloonsArt';
import RocketIcon from './icons/rocketIcon';
import ClockIcon from './icons/clockIcon';
import YearBanner from './overlays/yearBanner';
import Confetti from './overlays/confetti';
import FireworksFlyby from './overlays/fireworksFlyby';
import ChampagnePopFlyby from './overlays/champagnePopFlyby';
import YearBalloonsFlyby from './overlays/yearBalloonsFlyby';
import MidnightClockFlyby from './overlays/midnightClockFlyby';
import { newYearGreeting } from './newyear';

const overlays: SeasonOverlays = {
    logo: [PartyHatIcon],
    loading: [ChampagneGlass, RocketIcon, ClockIcon],
    emptyState: [ToastArt, MidnightClockArt, YearBalloonsArt],
    greeting: [newYearGreeting],
    appBar: [YearBanner],
    screen: [Confetti],
    flyby: [FireworksFlyby, ChampagnePopFlyby, YearBalloonsFlyby, MidnightClockFlyby],
};

export default overlays;

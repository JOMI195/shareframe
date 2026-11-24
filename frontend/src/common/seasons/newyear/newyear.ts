import type { Season } from '../seasons';
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
import { newYearNumber } from './year';

const SILVESTER = 31;

export const newYearGreeting = (date: Date): string => {
    const year = newYearNumber(date);
    if (date.getMonth() === 0) return `Frohes neues Jahr ${year}!`;
    const days = SILVESTER - date.getDate();
    if (days === 0) return `Guten Rutsch ins Jahr ${year}!`;
    if (days === 1) return 'Morgen ist Silvester!';
    return `Noch ${days} Tage bis Silvester!`;
};

const newyear: Season = {
    id: 'newyear',
    label: 'Silvester',
    from: { month: 12, day: 28 },
    to: { month: 1, day: 2 },
    palette: {
        light: { accent: '#2E4FC7', secondary: '#B7791F', background: '#F6F4EE' },
        dark: { accent: '#FFC857', secondary: '#7FB2FF', background: '#0B1026' },
    },
    overlays: {
        logo: [PartyHatIcon],
        loading: [ChampagneGlass, RocketIcon, ClockIcon],
        emptyState: [ToastArt, MidnightClockArt, YearBalloonsArt],
        greeting: [newYearGreeting],
        appBar: [YearBanner],
        screen: [Confetti],
        flyby: [FireworksFlyby, ChampagnePopFlyby, YearBalloonsFlyby, MidnightClockFlyby],
    },
    logoBadge: { size: 24, top: -11, left: -6, rotate: -22 },
    emptyStateLook: { scale: 1.8, opacity: 1 },
};

export default newyear;

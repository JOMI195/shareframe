import type { Season } from '../seasons';
import PartyHatIcon from './icons/partyHatIcon';
import ChampagneGlass from './art/champagneGlass';
import LuckyClover from './art/luckyClover';
import PartyGarland from './overlays/partyGarland';
import Confetti from './overlays/confetti';
import PeekingPig from './overlays/peekingPig';

const SILVESTER = 31;

export const newYearGreeting = (date: Date): string => {
    const year = date.getFullYear();
    if (date.getMonth() === 0) return `Frohes neues Jahr ${year}!`;
    const days = SILVESTER - date.getDate();
    if (days === 0) return `Guten Rutsch ins Jahr ${year + 1}!`;
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
        loading: [ChampagneGlass, LuckyClover],
        emptyState: [],
        greeting: [newYearGreeting],
        appBar: [PartyGarland],
        screen: [Confetti, PeekingPig],
        flyby: [],
    },
    logoBadge: { size: 24, top: -11, left: -6, rotate: -22 },
};

export default newyear;

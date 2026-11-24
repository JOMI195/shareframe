import type { Season } from '../seasons';
import { BACKDROP } from './palette';
import SantaHatIcon from './icons/santaHatIcon';
import GlassOrnament from './art/glassOrnament';
import GlowSnowflake from './art/glowSnowflake';
import ChristmasTreeArt from './art/christmasTreeArt';
import SnowmanArt from './art/snowmanArt';
import PresentsArt from './art/presentsArt';
import FairyLights from './overlays/fairyLights';
import Snowfall from './overlays/snowfall';
import PeekingReindeer from './overlays/peekingReindeer';
import SleighFlyby from './overlays/sleighFlyby';
import SnowstormFlyby from './overlays/snowstormFlyby';
import GiftDropFlyby from './overlays/giftDropFlyby';

const CHRISTMAS_EVE = 24;

export const christmasGreeting = (date: Date): string => {
    const nights = CHRISTMAS_EVE - date.getDate();
    if (nights === 1) return 'Noch einmal schlafen bis Heiligabend!';
    if (nights > 1) return `Noch ${nights} Mal schlafen bis Heiligabend!`;
    if (nights > -3) return 'Frohe Weihnachten!';
    return 'Schöne Feiertage und einen guten Rutsch!';
};

const christmas: Season = {
    id: 'christmas',
    label: 'Weihnachten',
    from: { month: 12, day: 1 },
    to: { month: 12, day: 27 },
    palette: {
        light: { accent: '#D6304A', secondary: '#1F7A5A', background: '#F7F3EC' },
        dark: { accent: '#FF5C7A', secondary: '#F3C969', background: '#0E1420' },
    },
    overlays: {
        logo: [SantaHatIcon],
        loading: [GlassOrnament, GlowSnowflake],
        emptyState: [ChristmasTreeArt, SnowmanArt, PresentsArt],
        greeting: [christmasGreeting],
        appBar: [FairyLights],
        screen: [Snowfall, PeekingReindeer],
        flyby: [SleighFlyby, SnowstormFlyby, GiftDropFlyby],
    },
    logoBadge: { size: 26, top: -14, left: -7, rotate: -22 },
    emptyStateLook: { scale: 1.8, opacity: 1 },
    backdrop: BACKDROP,
    glassAppBar: true,
};

export default christmas;

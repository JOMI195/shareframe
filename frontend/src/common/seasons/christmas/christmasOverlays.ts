import type { SeasonOverlays } from '../seasons';
import SantaHatIcon from './icons/santaHatIcon';
import OrnamentIcon from './icons/ornamentIcon';
import SnowflakeIcon from './icons/snowflakeIcon';
import ChristmasTreeArt from './art/christmasTreeArt';
import SnowmanArt from './art/snowmanArt';
import PresentsArt from './art/presentsArt';
import FairyLights from './overlays/fairyLights';
import Snowfall from './overlays/snowfall';
import PeekingReindeer from './overlays/peekingReindeer';
import SleighFlyby from './overlays/sleighFlyby';
import SnowstormFlyby from './overlays/snowstormFlyby';
import GiftDropFlyby from './overlays/giftDropFlyby';
import { christmasGreeting } from './christmas';

const overlays: SeasonOverlays = {
    logo: [SantaHatIcon],
    loading: [OrnamentIcon, SnowflakeIcon],
    emptyState: [ChristmasTreeArt, SnowmanArt, PresentsArt],
    greeting: [christmasGreeting],
    appBar: [FairyLights],
    screen: [Snowfall, PeekingReindeer],
    flyby: [SleighFlyby, SnowstormFlyby, GiftDropFlyby],
};

export default overlays;

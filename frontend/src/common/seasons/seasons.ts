import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import type { ColorMode } from '@/context/colorTheme/colorThemeContextValue';
import halloween from './halloween/halloween';

export type MonthDay = { month: number; day: number };

export interface FlybyProps {
    onDone: () => void;
    reducedMotion: boolean;
}

export interface SeasonOverlays {
    logo: ComponentType<SvgIconProps>[];
    loading: ComponentType<SvgIconProps>[];
    emptyState: ComponentType<SvgIconProps>[];
    greeting: string[];
    appBar: ComponentType[];
    screen: ComponentType[];
    flyby: ComponentType<FlybyProps>[];
}

export type OverlaySlot = keyof SeasonOverlays;

export interface Season {
    id: string;
    label: string;
    from: MonthDay;
    to: MonthDay;
    palette: Record<ColorMode, { accent: string; secondary: string; background: string }>;
    overlays: SeasonOverlays;
}

export const SEASONS: Season[] = [halloween];

const ordinal = ({ month, day }: MonthDay) => month * 100 + day;

// Inclusive; a window with from after to wraps over the new year.
export const isInWindow = (date: Date, from: MonthDay, to: MonthDay): boolean => {
    const today = ordinal({ month: date.getMonth() + 1, day: date.getDate() });
    const start = ordinal(from);
    const end = ordinal(to);
    return start <= end ? today >= start && today <= end : today >= start || today <= end;
};

export const activeSeason = (date: Date = new Date(), seasons: Season[] = SEASONS): Season | null =>
    seasons.find((season) => isInWindow(date, season.from, season.to)) ?? null;

export const pickOne = <T>(items: readonly T[], random: () => number = Math.random): T | null =>
    items.length ? items[Math.floor(random() * items.length)] : null;

export const pickNext = <T>(items: readonly T[], last: T | null, random: () => number = Math.random): T | null =>
    pickOne(items.length > 1 ? items.filter((item) => item !== last) : items, random);

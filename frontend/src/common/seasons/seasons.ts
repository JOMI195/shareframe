import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import type { ColorMode } from '@/context/colorTheme/colorThemeContextValue';
import halloween from './halloween/halloween';

export type MonthDay = { month: number; day: number };

export interface Season {
    id: string;
    label: string;
    from: MonthDay;
    to: MonthDay;
    palette: Record<ColorMode, { accent: string; secondary: string; background: string }>;
    // CSS background for the stripe under the app bar.
    stripe: string;
    greeting: string;
    LogoIcon: ComponentType<SvgIconProps>;
    EmptyStateIcon: ComponentType<SvgIconProps>;
    Decoration: ComponentType;
    Flyby: ComponentType<{ onDone: () => void }>;
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

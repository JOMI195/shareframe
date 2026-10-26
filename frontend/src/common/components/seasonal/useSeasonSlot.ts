import { useContext, useState } from 'react';
import { ColorThemeContext } from '@/context/colorTheme/colorThemeContextValue';
import { pickOne, type OverlaySlot, type SeasonOverlays } from '@/common/seasons/seasons';

const NONE: never[] = [];

// Reads the context directly: the spinner also renders outside the theme provider.
export const useSeasonSlot = <S extends OverlaySlot>(slot: S): SeasonOverlays[S] =>
    useContext(ColorThemeContext)?.season?.overlays[slot] ?? NONE;

// One random item per mount, picked again only when the slot changes.
export const useSeasonPick = <S extends OverlaySlot>(slot: S): SeasonOverlays[S][number] | null => {
    const items: readonly SeasonOverlays[S][number][] = useSeasonSlot(slot);
    const [pick, setPick] = useState(() => ({ items, item: pickOne(items) }));
    if (pick.items === items) return pick.item;

    const next = { items, item: pickOne(items) };
    setPick(next);
    return next.item;
};

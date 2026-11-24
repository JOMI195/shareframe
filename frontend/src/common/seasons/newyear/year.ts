// The year being welcomed: from summer on that is the next one.
export const newYearNumber = (date: Date): number => date.getFullYear() + (date.getMonth() >= 6 ? 1 : 0);

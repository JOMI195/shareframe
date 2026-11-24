// The year being welcomed: in late December that is the next one.
export const newYearNumber = (date: Date): number => date.getFullYear() + (date.getMonth() === 11 ? 1 : 0);

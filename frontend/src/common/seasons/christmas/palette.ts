export const GOLD = '#F3C969';
export const ICE = '#8DB6E0';

export const SNOWFLAKE = 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.4 10.2l3.4-.9-.9-3.4M20.6 13.8l-3.4.9.9 3.4M5.9 18.1l.9-3.4-3.4-.9M18.1 5.9l-.9 3.4 3.4.9';

const STARS = [
    [8, 14], [17, 62], [26, 33], [35, 81], [44, 9], [52, 47], [61, 72], [69, 21], [77, 56], [86, 38], [93, 86], [97, 12],
];

const glow = (size: string, at: string, color: string) => `radial-gradient(${size} at ${at}, ${color}, transparent 70%)`;

export const BACKDROP = {
    light: [
        glow('60vmax 40vmax', '100% 0%', 'rgba(233, 185, 73, 0.18)'),
        glow('55vmax 40vmax', '0% 100%', 'rgba(214, 48, 74, 0.09)'),
    ].join(', '),
    dark: [
        ...STARS.map(([x, y]) => `radial-gradient(1.2px 1.2px at ${x}% ${y}%, rgba(255, 255, 255, 0.55), transparent)`),
        glow('70vmax 35vmax', '85% -5%', 'rgba(127, 224, 194, 0.13)'),
        glow('60vmax 40vmax', '0% 0%', 'rgba(255, 92, 122, 0.09)'),
        glow('60vmax 40vmax', '50% 110%', 'rgba(243, 201, 105, 0.07)'),
    ].join(', '),
};

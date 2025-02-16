import { alpha, Theme } from '@mui/material/styles';

export const getRandomMuiColor = (theme: Theme): string => {
    const colorCorpora = [
        theme.palette.accent.main,
        theme.palette.primary.main,
        theme.palette.secondary.main
    ];

    const randomColor = colorCorpora[Math.floor(Math.random() * colorCorpora.length)];

    //const randomAlpha = (Math.random() * 0.8) + 0.1;

    return alpha(randomColor, 1);
};

export function stringToColor(string: string) {
    let hash = 0
    let i

    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash)
    }

    let color = '#'

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff
        color += `00${value.toString(16)}`.slice(-2)
    }

    return color
}

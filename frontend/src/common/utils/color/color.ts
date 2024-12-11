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
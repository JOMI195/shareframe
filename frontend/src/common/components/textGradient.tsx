import { Typography, TypographyProps } from "@mui/material";
import React from "react";
import { SxProps, Theme } from '@mui/material/styles';

interface GradientOptions {
    variant?: TypographyProps['variant'];
    textAlign?: TypographyProps['align'];
    direction: 'to top' | 'to bottom' | 'to left' | 'to right' | 'to top right' | 'to bottom right' | 'to top left' | 'to bottom left';
    startColor: string;
    endColor: string;
}

interface TextGradientProps {
    options: GradientOptions;
    children: React.ReactNode;
    sx?: SxProps<Theme>;
}

const TextGradient: React.FC<TextGradientProps> = ({ options, children, sx }) => {
    return (
        <Typography
            variant={options.variant}
            align={options.textAlign}
            sx={{
                backgroundImage: `linear-gradient(${options.direction}, ${options.startColor}, ${options.endColor})`,
                backgroundSize: "100%",
                backgroundRepeat: "repeat",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                overflowWrap: "break-word",
                wordWrap: "break-word",
                hyphens: "auto",
                ...sx
            }}
        >
            {children}
        </Typography>
    );
};

export default TextGradient;

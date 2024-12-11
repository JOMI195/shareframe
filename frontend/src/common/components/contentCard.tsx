import React, { ReactNode } from 'react';
import { Card, Box } from '@mui/material';
import { SxProps, Theme } from '@mui/system';

interface ContentCardProps {
    elevation?: number;
    padding?: number | string;
    backgroundColor?: string;
    transform?: string | null;
    maxWidth?: string;
    justifyContent?: string;
    alignItems?: string;
    children: ReactNode;
    fontSize?: string;
    fontWeight?: string | number;
    textAlign?: string;
    sx?: SxProps<Theme>;
}

const ContentCard: React.FC<ContentCardProps> = ({
    elevation = 10,
    padding = 2,
    backgroundColor,
    transform = "rotate(1deg)",
    maxWidth = "700px",
    justifyContent = "center",
    alignItems = "center",
    children,
    fontSize = 'h4.fontSize',
    fontWeight = 'medium',
    textAlign = "center",
    sx = {},
}) => {
    return (
        <Card
            elevation={elevation}
            sx={{
                p: padding,
                backgroundColor: backgroundColor,
                transform: transform,
                maxWidth: maxWidth,
                display: "flex",
                flexDirection: "column",
                justifyContent: justifyContent,
                alignItems: alignItems,
                ...sx,
            }}
        >
            <Box
                sx={{
                    fontWeight: fontWeight,
                    fontSize: fontSize,
                    textAlign: textAlign,
                    width: '100%',
                }}
            >
                {children}
            </Box>
        </Card>
    );
};

export default ContentCard;

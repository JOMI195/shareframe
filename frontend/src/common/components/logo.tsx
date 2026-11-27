import React from 'react';
import { Link } from 'react-router';
import { useTheme } from '@mui/material';

interface LogoProps {
    darkLogoSrc: string;
    lightLogoSrc: string;
    maxWidth?: number;
    minWidth?: number;
    marginRight?: number;
    clickable?: boolean;
    linkUrl?: string;
    alt?: string;
    width?: number;
    height?: number;
}

const Logo: React.FC<LogoProps> = ({
    darkLogoSrc,
    lightLogoSrc,
    maxWidth,
    minWidth,
    marginRight = 16,
    clickable = true,
    linkUrl: homeUrl = "/",
    alt,
    width,
    height,
}) => {
    // Decorative unless it is a link, which needs a name.
    const label = alt ?? (clickable ? "ShareFrame" : "");
    const isDarkMode = useTheme().palette.mode === 'dark';
    const logoSrc = isDarkMode ? darkLogoSrc : lightLogoSrc;

    return clickable ? (
        <Link to={homeUrl} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
                src={logoSrc}
                alt={label}
                width={width}
                height={height}
                style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth,
                    minWidth,
                    marginRight
                }}
            />
        </Link>
    ) : (
        <img
            src={logoSrc}
            alt={label}
            width={width}
            height={height}
            style={{
                width: '100%',
                height: 'auto',
                maxWidth,
                minWidth,
                marginRight
            }}
        />
    );
};

export default Logo;

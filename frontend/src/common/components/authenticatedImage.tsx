import { useAppSelector } from '@/store';
import { getUser } from '@/store/entities/authentication/authentication.slice';
import { Box } from '@mui/material';
import React, { useState, useEffect } from 'react';

interface AuthenticatedImageProps {
    url: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    onError?: (error: Error) => void;
    hideToYouFilter?: boolean;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
    url,
    alt,
    className,
    style,
    onClick,
    onError,
    hideToYouFilter
}) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const user = useAppSelector(getUser);

    useEffect(() => {
        let isMounted = true;

        const loadImage = async (): Promise<void> => {
            try {
                setIsLoading(true);
                const token = user.accessToken;

                if (!token) {
                    throw new Error('Authentication token not found');
                }

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to load image: ${response.statusText}`);
                }

                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);

                if (isMounted) {
                    setImageSrc(objectUrl);
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
                if (error instanceof Error) {
                    //console.error('Error loading image:', error.message);
                    onError?.(error);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
            if (imageSrc) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [url, onError]);

    if (isLoading) {
        return (
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    bgcolor: 'grey.200',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                        '0%, 100%': {
                            opacity: 1
                        },
                        '50%': {
                            opacity: .5
                        }
                    },
                    ...style,
                    borderRadius: 0,
                }}
            />
        );
    }

    return imageSrc ? (
        <div
            style={{
                ...style,
                overflow: 'hidden',
            }}
        >
            <img
                src={imageSrc}
                alt={alt}
                className={className}
                style={{
                    ...style,
                    filter: hideToYouFilter ? 'blur(25px)' : 'none'
                }}
                onClick={onClick}
            />
        </div>
    ) : null;
};

export default AuthenticatedImage;
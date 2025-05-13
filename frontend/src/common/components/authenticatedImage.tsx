import axiosInstance from '@/services/api';
import { Box } from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';

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
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            {
                rootMargin: '100px', // Preload when 100px away from viewport
                threshold: 0.1,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let isMounted = true;

        const loadImage = async (): Promise<void> => {
            try {
                setIsLoading(true);

                const response = await axiosInstance.get(url, {
                    responseType: 'blob'
                });

                const objectUrl = URL.createObjectURL(response.data);

                if (isMounted) {
                    setImageSrc(objectUrl);
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
                if (error instanceof Error) {
                    onError?.(error);
                } else {
                    onError?.(new Error('Failed to load image'));
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
    }, [url, isVisible, onError]);

    if (isLoading && isVisible) {
        return (
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    bgcolor: 'grey.200',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 }
                    },
                    ...style,
                    borderRadius: 1,
                }}
                ref={imgRef}
            />
        );
    }

    return (
        <div ref={imgRef} style={{ overflow: 'hidden', ...style }}>
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={alt}
                    className={className}
                    loading="lazy"
                    style={{
                        ...style,
                        filter: hideToYouFilter ? 'blur(25px)' : 'none',
                        transition: 'opacity 0.5s ease-in-out',
                        opacity: isLoading ? 0 : 1,
                    }}
                    onClick={onClick}
                />
            ) : null}
        </div>
    );
};

export default AuthenticatedImage;

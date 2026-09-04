import axiosInstance from '@/services/api';
import { Skeleton } from '@mui/material';
import React, { useState, useEffect, useRef } from 'react';
import { useMinimumLoading } from '@/hooks/loading/useMinimumLoading';

interface AuthenticatedImageProps {
    url: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    onError?: (error: Error) => void;
    hideToYouFilter?: boolean;
    aspectRatio?: number;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
    url,
    alt,
    className,
    style,
    onClick,
    onError,
    hideToYouFilter,
    aspectRatio
}) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const imgRef = useRef<HTMLDivElement>(null);
    const showSkeleton = useMinimumLoading(isLoading);

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

        const element = imgRef.current;

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let isMounted = true;
        let objectUrl = '';

        const loadImage = async (): Promise<void> => {
            try {
                setIsLoading(true);

                const response = await axiosInstance.get(url, {
                    responseType: 'blob'
                });

                objectUrl = URL.createObjectURL(response.data);

                if (isMounted) {
                    setImageSrc(objectUrl);
                    setIsLoading(false);
                } else {
                    URL.revokeObjectURL(objectUrl);
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
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [url, isVisible, onError]);

    if (showSkeleton) {
        // Height first so the box keeps the ratio the img will settle at once max-width clamps it.
        const skeletonStyle: React.CSSProperties = aspectRatio
            ? { ...style, height: style?.maxHeight, width: 'auto', aspectRatio }
            : { width: '100%', height: '100%', ...style };

        return (
            <Skeleton
                variant="rectangular"
                animation="wave"
                style={skeletonStyle}
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

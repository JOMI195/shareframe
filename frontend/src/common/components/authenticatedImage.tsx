import { Box, Skeleton } from '@mui/material';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import React, { useState, useEffect, useRef } from 'react';
import { acquireImage, peekImage } from '@/common/utils/imageCache';

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
    const [loaded, setLoaded] = useState<{ url: string; src: string } | null>(null);
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const imgRef = useRef<HTMLDivElement>(null);
    const onErrorRef = useRef(onError);

    // A cached blob renders straight away, without waiting for the observer or the skeleton.
    const imageSrc = loaded?.url === url ? loaded.src : peekImage(url) ?? '';
    const hasError = failedUrl === url;
    // No minimum hold: thumbnails often arrive within a few ms.
    const showSkeleton = !imageSrc && !hasError;

    useEffect(() => {
        onErrorRef.current = onError;
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
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

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible && !peekImage(url)) return;

        let isMounted = true;
        const image = acquireImage(url);

        image.objectUrl.then(
            (src) => {
                if (isMounted) setLoaded({ url, src });
            },
            (error: unknown) => {
                if (!isMounted) return;
                setFailedUrl(url);
                onErrorRef.current?.(error instanceof Error ? error : new Error('Failed to load image'));
            }
        );

        return () => {
            isMounted = false;
            image.release();
        };
    }, [url, isVisible]);

    if (hasError) {
        return (
            <Box
                ref={imgRef}
                role="img"
                aria-label={alt}
                onClick={onClick}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: 80,
                    bgcolor: 'action.hover',
                    color: 'text.disabled',
                }}
                style={style}
            >
                <BrokenImageOutlinedIcon />
            </Box>
        );
    }

    if (showSkeleton) {
        return (
            <Skeleton
                variant="rectangular"
                animation="wave"
                style={{ width: '100%', height: '100%', ...style }}
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
                    decoding="async"
                    className={className}
                    style={{
                        ...style,
                        filter: hideToYouFilter ? 'blur(25px)' : 'none',
                    }}
                    onClick={onClick}
                />
            ) : null}
        </div>
    );
};

export default AuthenticatedImage;

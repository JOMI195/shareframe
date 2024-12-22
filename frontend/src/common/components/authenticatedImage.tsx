import { useAppSelector } from '@/store';
import { getUser } from '@/store/entities/authentication/authentication.slice';
import React, { useState, useEffect } from 'react';

interface AuthenticatedImageProps {
    url: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    onError?: (error: Error) => void;
}

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
    url,
    alt,
    className,
    style,
    onClick,
    onError
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
                    console.error('Error loading image:', error.message);
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
            <div
                className="w-20 h-20 bg-gray-200 animate-pulse rounded"
                style={style}
            />
        );
    }

    return imageSrc ? (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            style={style}
            onClick={onClick}
        />
    ) : null;
};

export default AuthenticatedImage;
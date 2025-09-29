import React, { useEffect, useRef, useState } from 'react';
import EasyCropper, { Area } from 'react-easy-crop';
import { useTheme } from '@mui/material/styles';
import Navigation from './navigation';

const ZOOM_FACTOR = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

const ROTATION_DEGREE = 30;
const MIN_ROTATION = 0;
const MAX_ROTATION = 360;

interface CropperProps {
    image: File;
    setCroppedAreaPixels: React.Dispatch<React.SetStateAction<Area>>;
    rotation: number;
    setRotation: React.Dispatch<React.SetStateAction<number>>;
}

const Cropper: React.FC<CropperProps> = ({
    image,
    setCroppedAreaPixels,
    rotation,
    setRotation
}) => {
    const theme = useTheme();
    const cropperRef = useRef<EasyCropper>(null);
    const cropperContainerRef = useRef<HTMLDivElement>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [isTouching, setIsTouching] = useState(false);

    const getCropperStyles = () => {
        const isLight = theme.palette.mode === 'light';
        const borderColor = isLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)';
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)';

        return `
          .reactEasyCrop_CropArea {
            border: 2px solid ${borderColor} !important;
          }
          .reactEasyCrop_CropAreaGrid::before {
            border-left: 1px solid ${gridColor} !important;
            border-right: 1px solid ${gridColor} !important;
          }
          .reactEasyCrop_CropAreaGrid::after {
            border-top: 1px solid ${gridColor} !important;
            border-bottom: 1px solid ${gridColor} !important;
          }
        `;
    };

    const handleTouchStart = () => setIsTouching(true);
    const handleTouchEnd = () => setIsTouching(false);

    useEffect(() => {
        const container = cropperContainerRef.current;
        if (container) {
            container.addEventListener("touchstart", handleTouchStart);
            container.addEventListener("touchend", handleTouchEnd);

            return () => {
                container.removeEventListener("touchstart", handleTouchStart);
                container.removeEventListener("touchend", handleTouchEnd);
            };
        }
    }, []);

    useEffect(() => {
        if (image) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result as string);
                onCropperReset();
            };
            reader.readAsDataURL(image);
        } else {
            setImageSrc('');
        }
    }, [image]);

    useEffect(() => {
        if (cropperContainerRef.current) {
            setTimeout(() => {
                cropperContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [image]);

    const onCropChange = (newCrop: { x: number; y: number }) => setCrop(newCrop);

    const onCropComplete = (_: Area, croppedAreaPixels: Area) => setCroppedAreaPixels(croppedAreaPixels);

    const onZoom = (newZoom: number) => setZoom(newZoom);

    const onRotation = (newZoom: number) => setRotation(newZoom);

    const onCenter = () => setCrop({ x: 0, y: 0 });

    const onCropperReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
    };

    return (
        <div ref={cropperContainerRef} style={{
            width: '100%', height: '500px', display: "flex", flexDirection: "column"
        }}>
            {imageSrc && (
                <>
                    <style>{getCropperStyles()}</style>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        backgroundColor: theme.palette.mode === 'light' ? '#e0e0e0' : '#000000',
                        border: theme.palette.mode === 'light' ? `1px solid ${theme.palette.divider}` : 'none'
                    }}>
                        <EasyCropper
                            ref={cropperRef}
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={800 / 480}
                            onCropChange={onCropChange}
                            onCropComplete={onCropComplete}
                            onZoomChange={onZoom}
                            onRotationChange={(newRotation) => {
                                if (!isTouching) {
                                    onRotation(newRotation);
                                }
                            }}
                            minZoom={MIN_ZOOM}
                            maxZoom={MAX_ZOOM}
                            restrictPosition={false}
                            cropShape="rect"
                            objectFit="horizontal-cover"
                        />
                    </div>
                    <Navigation
                        zoom={zoom}
                        onZoom={onZoom}
                        rotation={rotation}
                        onRotation={onRotation}
                        onCenter={onCenter}
                        onCropperReset={onCropperReset}
                        disabled={false}
                        ZOOM_FACTOR={ZOOM_FACTOR}
                        MIN_ZOOM={MIN_ZOOM}
                        MAX_ZOOM={MAX_ZOOM}
                        ROTATION_DEGREE={ROTATION_DEGREE}
                        MIN_ROTATION={MIN_ROTATION}
                        MAX_ROTATION={MAX_ROTATION}
                    />
                </>
            )}
        </div>
    );
};

export default Cropper;

import React, { useEffect, useRef, useState } from 'react';
import EasyCropper, { Area } from 'react-easy-crop';
import Navigation from './navigation';

const ZOOM_FACTOR = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

const ROTATION_DEGREE = 30;
const MIN_ROTATION = 0;
const MAX_ROTATION = 360;

interface CropperProps {
    image: File;
    setCroppedAreaPixels: React.Dispatch<React.SetStateAction<Area>>
}

const Cropper: React.FC<CropperProps> = ({ image, setCroppedAreaPixels }) => {
    const cropperRef = useRef<EasyCropper>(null);
    const cropperContainerRef = useRef<HTMLDivElement>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0)
    const [imageSrc, setImageSrc] = useState<string>('');

    useEffect(() => {
        if (image) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result as string);
            };
            reader.readAsDataURL(image);
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
                    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: "black" }}>
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
                            onRotationChange={onRotation}
                            minZoom={MIN_ZOOM}
                            maxZoom={MAX_ZOOM}
                            restrictPosition={false}
                            cropShape="rect"
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

import React, { useEffect, useRef } from 'react';
import { FixedCropperRef, FixedCropper, ImageRestriction } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import './cropper.css';
import 'react-advanced-cropper/dist/themes/corners.css';
import Wrapper from './wrapper';

interface CropperWrapperProps {
    image: File;
    setCropper: React.Dispatch<React.SetStateAction<FixedCropperRef | null>>;
}

const Cropper: React.FC<CropperWrapperProps> = ({ image, setCropper }) => {
    const cropperRef = useRef<FixedCropperRef>(null);
    const cropperContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCropper(cropperRef.current);
    }, [cropperRef, setCropper]);

    useEffect(() => {
        if (cropperContainerRef.current) {
            setTimeout(() => {
                cropperContainerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300);
        }
    }, [image]);

    return (
        <div ref={cropperContainerRef}>
            <FixedCropper
                ref={cropperRef}
                src={URL.createObjectURL(image)}
                className="cropper"
                stencilProps={{
                    handlers: false,
                    lines: true,
                    movable: false,
                    resizable: false,
                }}
                stencilSize={{ width: 800, height: 480 }}
                imageRestriction={ImageRestriction.none}
                transformImage={{
                    adjustStencil: false,
                }}
                checkOrientation={true}
                wrapperComponent={Wrapper}
            />
        </div>
    );
};

export default Cropper;
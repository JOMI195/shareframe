import React, { useEffect, useRef } from 'react';
import { FixedCropperRef, FixedCropper, ImageRestriction } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import './cropper.css';
import 'react-advanced-cropper/dist/themes/corners.css';

interface CropperWrapperProps {
    image: File;
    setCropper: React.Dispatch<React.SetStateAction<FixedCropperRef | null>>;
}

const ImageCropper: React.FC<CropperWrapperProps> = ({ image, setCropper }) => {
    const cropperRef = useRef<FixedCropperRef>(null);

    useEffect(() => {
        setCropper(cropperRef.current);
    }, [cropperRef, setCropper]);

    return (
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
        />
    );
};

export default ImageCropper;
import React, { useEffect, useRef } from 'react';
import { FixedCropperRef, FixedCropper, ImageRestriction } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import './cropper.css';

interface IImageCropperProps {
    image: File;
    setCropper: React.Dispatch<React.SetStateAction<FixedCropperRef | null>>
}

const ImageCropper: React.FC<IImageCropperProps> = ({ image, setCropper }) => {
    const cropperRef = useRef<FixedCropperRef>(null);

    useEffect(() => {
        setCropper(cropperRef.current);
    }, [cropperRef])

    return (
        <FixedCropper
            ref={cropperRef}
            className="cropper"
            src={URL.createObjectURL(image)}
            stencilProps={{
                handlers: false,
                lines: false,
                movable: false,
                resizable: false
            }}
            stencilSize={{ width: 800, height: 480 }}
            imageRestriction={ImageRestriction.stencil}
        />
    )
}

export default ImageCropper;
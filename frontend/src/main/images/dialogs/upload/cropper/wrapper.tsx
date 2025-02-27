import { CSSProperties, FC } from 'react';
import cn from 'classnames';
import { CropperRef, CropperFade } from 'react-advanced-cropper';
import { getZoomFactor } from 'advanced-cropper/extensions/absolute-zoom';
import { Navigation } from './navigation';
import './wrapper.css';
import { Box } from '@mui/material';

interface Props {
    cropper: CropperRef;
    className?: string;
    style?: CSSProperties;
    children?: React.ReactNode;
}

export const Wrapper: FC<Props> = ({ cropper, children, className }) => {
    const state = cropper.getState();
    const settings = cropper.getSettings();

    const onZoom = (value: number, transitions?: boolean) => {
        if (cropper) {
            cropper.zoomImage(getZoomFactor(state, settings, value), {
                transitions: !!transitions,
            });
        }
    };

    return (
        <Box>
            <CropperFade className={cn('custom-wrapper', className)} visible={state && cropper.isLoaded()}>
                {children}
            </CropperFade>
            <Navigation onZoom={onZoom} />
        </Box>

    );
};

export default Wrapper;

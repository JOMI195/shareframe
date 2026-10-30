import { Box, Button, DialogContent, Typography, useMediaQuery, useTheme } from "@mui/material";
import AppDialog from '@/common/components/appDialog';
import DialogHeader from '@/common/components/dialogHeader';
import FormActions from '@/common/components/settings/formActions';
import { useEffect, useMemo, useRef, useState } from "react";
import EasyCropper, { Area, MediaSize, Point, Size } from "react-easy-crop";
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi } from "@/store/entities/authentication/authentication.slice";
import { uploadMyAvatar } from "@/store/entities/authentication/authentication.actions";
import { openAuthAlertSnackbar } from "@/store/ui/authentication/authentication.slice";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import Navigation from "@/main/images/dialogs/upload/imageCropping/cropper/navigation";
import { getCroppedImg } from "@/main/images/dialogs/upload/imageCropping/cropper/utils";

const ZOOM_FACTOR = 0.1;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const MOVE_STEP = 10;

interface CropAvatarDialogProps {
    file: File | null;
    onClose: () => void;
}

const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

const CropAvatarDialog = ({ file, onClose }: CropAvatarDialogProps) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const loading = useAppSelector(getApi).loading;
    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [entered, setEntered] = useState(false);
    const mediaSize = useRef<MediaSize | null>(null);
    const cropSize = useRef<Size | null>(null);

    const src = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => {
        if (src) URL.revokeObjectURL(src);
    }, [src]);

    const fail = (message: string) => {
        dispatch(openAuthAlertSnackbar({ message, severity: 'error' }));
        onClose();
    };

    // The cropper keeps the picture inside the circle while dragging, but not for positions set from outside.
    const onMove = (dx: number, dy: number) => setCrop((c) => {
        const media = mediaSize.current;
        const area = cropSize.current;
        const x = c.x + dx * MOVE_STEP;
        const y = c.y + dy * MOVE_STEP;
        if (!media || !area) return { x, y };
        return {
            x: clamp(x, Math.max(0, (media.width * zoom - area.width) / 2)),
            y: clamp(y, Math.max(0, (media.height * zoom - area.height) / 2)),
        };
    });

    const onReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(MIN_ZOOM);
    };

    const handleConfirm = async () => {
        if (!file || !croppedAreaPixels) return;
        try {
            const blob = await getCroppedImg(file, croppedAreaPixels);
            dispatch(uploadMyAvatar(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })));
            onClose();
        } catch (error) {
            fail(error instanceof Error ? error.message : 'Zuschneiden fehlgeschlagen');
        }
    };

    const notReady = !(croppedAreaPixels && croppedAreaPixels.width >= 1 && croppedAreaPixels.height >= 1);

    return (
        <AppDialog
            fullScreen={!matches}
            maxWidth="sm"
            fullWidth
            open={file !== null}
            onClose={onClose}
            aria-labelledby='dialog-crop-avatar-title'
            slots={{
                transition: matches ? ZoomTransition : SlideTransition
            }}
            // The cropper measures itself on load, which mid-transition yields a scaled or empty box.
            slotProps={{ transition: { onEntered: () => setEntered(true) } }}
        >
            <DialogHeader title="Profilbild zuschneiden" titleId="dialog-crop-avatar-title" onClose={onClose} />
            <DialogContent>
                <Typography sx={{ mb: 2 }}>
                    Verschiebe und zoome das Bild, bis der Ausschnitt im Kreis passt.
                </Typography>
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: { xs: 300, sm: 360 },
                        bgcolor: theme.palette.mode === 'light' ? '#e0e0e0' : '#000000',
                    }}
                >
                    {src && entered && (
                        <EasyCropper
                            image={src}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            minZoom={MIN_ZOOM}
                            maxZoom={MAX_ZOOM}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_, area) => setCroppedAreaPixels(area)}
                            onCropAreaChange={(_, area) => setCroppedAreaPixels(area)}
                            setMediaSize={(size) => { mediaSize.current = size; }}
                            setCropSize={(size) => { cropSize.current = size; }}
                            mediaProps={{ onError: () => fail('Das Bild konnte nicht geladen werden.') }}
                        />
                    )}
                </Box>
                <Navigation
                    zoom={zoom}
                    onZoom={setZoom}
                    onMove={onMove}
                    onCenter={() => setCrop({ x: 0, y: 0 })}
                    onCropperReset={onReset}
                    disabled={false}
                    ZOOM_FACTOR={ZOOM_FACTOR}
                    MIN_ZOOM={MIN_ZOOM}
                    MAX_ZOOM={MAX_ZOOM}
                />
                <Box sx={{ mt: 3 }}>
                    <FormActions>
                        <Button
                            onClick={handleConfirm}
                            color="primary"
                            disabled={loading || notReady}
                            variant="contained"
                        >
                            Übernehmen
                        </Button>
                    </FormActions>
                </Box>
            </DialogContent>
        </AppDialog>
    );
};

export default CropAvatarDialog;

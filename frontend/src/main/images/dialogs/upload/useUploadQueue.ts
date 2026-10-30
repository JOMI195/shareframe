import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAppDispatch } from '@/store';
import { openCreateImageDialog, openImagesAlertSnackbar } from '@/store/ui/images/images.slice';
import { SHARE_EMPTY_PARAM, SHARE_EMPTY_VALUE, takeSharedFiles } from '@/common/utils/pwa/sharedFiles';

export interface ImageStatus {
    id: string;
    file: File;
    status: 'pending' | 'cropping' | 'uploaded';
    croppedFile?: File;
}

export const maxFilesOnce = import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE
    ? +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE
    : 5;

const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

export const useUploadQueue = () => {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>([]);
    const [imagePreviews, setImagePreviews] = useState<{ [id: string]: string }>({});
    const [previewErrors, setPreviewErrors] = useState<{ [id: string]: string }>({});

    const addImages = (files: File[]) => {
        const knownKeys = new Set(imageStatuses.map(status => getFileKey(status.file)));
        const additions: ImageStatus[] = [];
        let skipped = 0;

        files.forEach(file => {
            const key = getFileKey(file);
            if (knownKeys.has(key) || imageStatuses.length + additions.length >= maxFilesOnce) {
                skipped++;
                return;
            }
            knownKeys.add(key);
            additions.push({
                id: `${key}-${Date.now()}-${Math.random()}`,
                file,
                status: 'pending'
            });
        });

        if (skipped > 0) {
            dispatch(openImagesAlertSnackbar({
                message: `${skipped === 1 ? 'Ein Foto wurde' : `${skipped} Fotos wurden`} nicht hinzugefügt, weil sie schon ausgewählt sind oder das Maximum von ${maxFilesOnce} erreicht ist.`,
                severity: "warning"
            }));
        }

        if (additions.length > 0) {
            setImageStatuses(prev => [...prev, ...additions]);
        }
    };

    const reset = () => {
        setImageStatuses([]);
        setImagePreviews({});
        setPreviewErrors({});
    };

    useEffect(() => {
        if (searchParams.get(SHARE_EMPTY_PARAM) === SHARE_EMPTY_VALUE) {
            setSearchParams((params) => {
                params.delete(SHARE_EMPTY_PARAM);
                return params;
            }, { replace: true });
            dispatch(openCreateImageDialog());
            dispatch(openImagesAlertSnackbar({
                message: 'Das geteilte Foto ist nicht angekommen. Wähle es hier direkt aus.',
                severity: 'warning'
            }));
        }

        let cancelled = false;
        takeSharedFiles().then((files) => {
            if (cancelled || files.length === 0) return;
            addImages(files);
            dispatch(openCreateImageDialog());
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- photos shared into the app are picked up once on mount
    }, []);

    const activeUrlRefs = useRef<{ [id: string]: string }>({});

    useEffect(() => {
        const newPreviewsMap: { [id: string]: string } = {};
        const currentImageIdsInStatus = new Set(imageStatuses.map(status => status.id));

        const urlsToRevoke: string[] = [];
        for (const imageId in activeUrlRefs.current) {
            if (!currentImageIdsInStatus.has(imageId)) {
                urlsToRevoke.push(activeUrlRefs.current[imageId]);
            }
        }

        imageStatuses.forEach(imageStatus => {
            newPreviewsMap[imageStatus.id] = activeUrlRefs.current[imageStatus.id] ?? URL.createObjectURL(imageStatus.file);
        });

        setImagePreviews(newPreviewsMap);
        setPreviewErrors(prev => {
            const staleIds = Object.keys(prev).filter(id => !currentImageIdsInStatus.has(id));
            if (staleIds.length === 0) {
                return prev;
            }
            const next = { ...prev };
            staleIds.forEach(id => delete next[id]);
            return next;
        });

        activeUrlRefs.current = newPreviewsMap;

        // No cleanup revoking all URLs: it would run before every re-run and leave
        // reused previews pointing at revoked blobs. Unmount is handled below.
        urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    }, [imageStatuses]);

    useEffect(() => {
        return () => {
            Object.values(activeUrlRefs.current).forEach(url => URL.revokeObjectURL(url));
            activeUrlRefs.current = {};
        };
    }, []);

    const markPreviewBroken = useCallback((id: string, reason: string) => {
        setPreviewErrors(prev => (prev[id] ? prev : { ...prev, [id]: reason }));
    }, []);

    return { imageStatuses, setImageStatuses, addImages, reset, imagePreviews, previewErrors, markPreviewBroken };
};

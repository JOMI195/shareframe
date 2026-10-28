import React, { useRef, useState } from 'react';
import { validateImages, getAcceptedFileTypes } from './imageUpload/validation/imageValidation';
import { materializeFiles } from '@/common/utils/files/fileCopy.helpers';
import { useAppDispatch, useAppSelector } from '@/store';
import { getImagesPaginated } from '@/store/entities/images/images.slice';
import { openImagesAlertSnackbar } from '@/store/ui/images/images.slice';
import { ImageStatus } from './useUploadQueue';

// Selected photos are held in memory until upload, so the batch needs a ceiling.
const MAX_MATERIALIZED_BYTES = 200 * 1024 * 1024;

export type PickerSource = 'gallery' | 'camera';

export const usePhotoPicker = (imageStatuses: ImageStatus[], addImages: (files: File[]) => void) => {
    const dispatch = useAppDispatch();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPreparing, setIsPreparing] = useState(false);
    const imagesPaginatedCount = useAppSelector(getImagesPaginated).count;

    const handleFileSelection = async (selectedFiles: File[]) => {
        const { validFiles, invalidFiles } = validateImages(
            selectedFiles,
            imagesPaginatedCount,
            imageStatuses.length
        );

        const problems = invalidFiles.map(({ file, errors }) => `${file.name}: ${errors.join(', ')}`);

        let remainingBytes = MAX_MATERIALIZED_BYTES - imageStatuses.reduce((sum, status) => sum + status.file.size, 0);
        const accepted: File[] = [];

        validFiles.forEach(file => {
            if (file.size <= remainingBytes) {
                remainingBytes -= file.size;
                accepted.push(file);
            } else {
                problems.push(`${file.name}: Zu viele Daten in einer Auswahl`);
            }
        });

        if (accepted.length > 0) {
            setIsPreparing(true);
            // Copy the bytes now. Android releases the picker's staged file as soon as
            // the input is touched again, long before the preview or cropper read it.
            const { copies, failures } = await materializeFiles(accepted);
            setIsPreparing(false);

            failures.forEach(({ file, reason }) => problems.push(`${file.name}: ${reason}`));

            if (copies.length > 0) {
                addImages(copies);
            }
        }

        if (problems.length > 0) {
            dispatch(openImagesAlertSnackbar({
                message: `Einige Fotos konnten nicht hinzugefügt werden:\n${problems.join('\n')}`,
                severity: "warning"
            }));
        }
    };

    const selectFiles = (files: File[]) => {
        handleFileSelection(files).catch(error => {
            setIsPreparing(false);
            dispatch(openImagesAlertSnackbar({
                message: error instanceof Error ? error.message : 'Fotos konnten nicht gelesen werden',
                severity: "error"
            }));
        });
    };

    const openPicker = (source: PickerSource = 'gallery') => {
        const input = inputRef.current;
        if (!input || isPreparing) return;

        input.removeAttribute('capture');
        if (source === 'camera') {
            input.setAttribute('capture', 'environment');
        }

        // Cleared here, not after a selection: picking the same photo twice needs a
        // change event, and on Android clearing it invalidates files still to be read.
        input.value = '';

        // Must stay inside the user gesture or iOS Safari drops the picker.
        input.click();
    };

    const inputProps: React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement> = {
        ref: inputRef,
        type: 'file',
        multiple: true,
        hidden: true,
        accept: getAcceptedFileTypes(),
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.files) {
                selectFiles(Array.from(event.target.files));
            }
        },
    };

    return { inputProps, openPicker, selectFiles, isPreparing };
};

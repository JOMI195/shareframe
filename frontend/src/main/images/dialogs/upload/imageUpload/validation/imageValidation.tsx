import { IImageValidationResponse } from "@/types";

const EXTENSION_MIME_TYPES: { [extension: string]: string } = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
};

const getAllowedExtensions = (): string[] => {
    const formats = import.meta.env.VITE_APP_UPLOADED_FILES_FILE_FORMATS;
    return formats !== undefined ? formats.split(" ").filter(Boolean) : [];
}

const getAllowedMimeTypes = (): string[] => {
    const mimeTypes = getAllowedExtensions()
        .map(extension => EXTENSION_MIME_TYPES[extension.toLowerCase()])
        .filter(Boolean);
    return Array.from(new Set(mimeTypes));
}

// Keeps the file input in sync with what the validation actually accepts.
export const getAcceptedFileTypes = (): string => getAllowedMimeTypes().join(",");

export const getAllowedExtensionLabels = (): string[] => getAllowedExtensions();

// Some mobile pickers hand over files without a usable name, so the MIME type counts too.
const hasValidFormat = (file: File): boolean => {
    const allowedExtensions = getAllowedExtensions();
    if (allowedExtensions.length === 0) {
        return false;
    }

    const name = file.name.toLowerCase();
    if (allowedExtensions.some(extension => name.endsWith(`.${extension.toLowerCase()}`))) {
        return true;
    }

    return getAllowedMimeTypes().includes(file.type);
}

const doesntExceedFileLimit = (fileIndex: number, totalFiles: number = 1): boolean => {
    if (import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE !== undefined) {
        const maxFiles = +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE;
        // For multiple files, check if the current total would exceed the limit
        if (totalFiles > maxFiles) {
            return false;
        }
        // For individual file validation, check if this specific file index exceeds limit
        if (fileIndex >= maxFiles) {
            return false;
        }
        return true;
    } else {
        return false;
    }
}

const doesntExceedTotalFileLimit = (newFilesCount: number, existingFilesCount: number): boolean => {
    if (import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_TOTAL !== undefined) {
        const maxTotalFiles = +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_TOTAL;
        return (existingFilesCount + newFilesCount) <= maxTotalFiles;
    }
    return true;
}

const hasValidFileSize = (file: File): boolean => {
    const maxSizeInMB = import.meta.env.VITE_APP_UPLOADED_FILES_MAX_SIZE_MB;
    if (maxSizeInMB !== undefined) {
        const maxSizeInBytes = +maxSizeInMB * 1024 * 1024;
        return file.size <= maxSizeInBytes;
    }
    return true;
}

export const validateImage = (file: File, fileIndex: number, totalFiles: number = 1, existingFilesCount: number = 0): IImageValidationResponse => {
    const errors: string[] = [];
    let valid: boolean = true;

    if (!hasValidFormat(file)) {
        errors.push("Falsches Dateiformat");
        valid = false;
    }

    if (!doesntExceedFileLimit(fileIndex, totalFiles)) {
        const maxFiles = +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_ONCE || 1;
        errors.push(`Maximal ${maxFiles} Foto(s) können auf einmal hochgeladen werden`);
        valid = false;
    }

    if (!doesntExceedTotalFileLimit(totalFiles, existingFilesCount)) {
        const maxTotalFiles = +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_TOTAL || 100;
        errors.push(`Maximale Gesamtanzahl von ${maxTotalFiles} hochgeladenen Foto(s) würde überschritten werden`);
        valid = false;
    }

    if (!hasValidFileSize(file)) {
        const maxSize = import.meta.env.VITE_APP_UPLOADED_FILES_MAX_SIZE_MB || 10;
        errors.push(`Datei ist zu groß (maximal ${maxSize}MB)`);
        valid = false;
    }

    return { valid: valid, errors: errors };
}

// Helper function to validate multiple files at once
export const validateImages = (files: File[], existingFilesCount: number = 0, alreadySelectedCount: number = 0): { validFiles: File[], invalidFiles: { file: File, errors: string[] }[] } => {
    const validFiles: File[] = [];
    const invalidFiles: { file: File, errors: string[] }[] = [];
    const totalSelected = alreadySelectedCount + files.length;

    // First check if the total would exceed the limit
    if (!doesntExceedTotalFileLimit(totalSelected, existingFilesCount)) {
        const maxTotalFiles = +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES_TOTAL || 100;
        // If total limit would be exceeded, mark all files as invalid
        files.forEach((file) => {
            invalidFiles.push({
                file,
                errors: [`Maximale Gesamtanzahl von ${maxTotalFiles} Foto(s) würde überschritten`]
            });
        });
        return { validFiles, invalidFiles };
    }

    files.forEach((file, index) => {
        const validation = validateImage(file, alreadySelectedCount + index, totalSelected, existingFilesCount);
        if (validation.valid) {
            validFiles.push(file);
        } else {
            invalidFiles.push({ file, errors: validation.errors });
        }
    });

    return { validFiles, invalidFiles };
}

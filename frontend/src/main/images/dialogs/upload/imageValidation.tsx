import { IImageValidationResponse } from "@/types";

const hasValidExtension = (file: File): boolean => {
    if (import.meta.env.VITE_APP_UPLOADED_FILES_FILE_FORMATS !== undefined) {
        const validFileExtensions = import.meta.env.VITE_APP_UPLOADED_FILES_FILE_FORMATS.split(" ");
        let valid = false
        for (let i = 0; i < validFileExtensions.length; i++) {
            if (file.name.toLowerCase().endsWith(`.${validFileExtensions[i]}`)) {
                valid = true
            }
        }
        return valid
    } else {
        return false
    }
}

const doesntExceedFileLimit = (fileIndex: number, totalFiles: number = 1): boolean => {
    if (import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES !== undefined) {
        const maxFiles = +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES;
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

const hasValidFileSize = (file: File): boolean => {
    // Add file size validation if needed
    const maxSizeInMB = import.meta.env.VITE_APP_UPLOADED_FILES_MAX_SIZE_MB;
    if (maxSizeInMB !== undefined) {
        const maxSizeInBytes = +maxSizeInMB * 1024 * 1024;
        return file.size <= maxSizeInBytes;
    }
    return true;
}

export const validateImage = (file: File, fileIndex: number, totalFiles: number = 1): IImageValidationResponse => {
    let errors: string[] = [];
    let valid: boolean = true;

    if (!hasValidExtension(file)) {
        errors.push("Falsches Dateiformat");
        valid = false;
    }

    if (!doesntExceedFileLimit(fileIndex, totalFiles)) {
        const maxFiles = +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES || 1;
        errors.push(`Maximal ${maxFiles} Foto(s) können hochgeladen werden`);
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
export const validateImages = (files: File[]): { validFiles: File[], invalidFiles: { file: File, errors: string[] }[] } => {
    const validFiles: File[] = [];
    const invalidFiles: { file: File, errors: string[] }[] = [];

    files.forEach((file, index) => {
        const validation = validateImage(file, index, files.length);
        if (validation.valid) {
            validFiles.push(file);
        } else {
            invalidFiles.push({ file, errors: validation.errors });
        }
    });

    return { validFiles, invalidFiles };
}
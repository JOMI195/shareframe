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

const doesntExceedFileLimit = (fileIndex: number): boolean => {
    if (import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES !== undefined) {
        if (fileIndex >= +import.meta.env.VITE_APP_UPLOADED_FILES_MAX_FILES) {
            return false
        } else {
            return true
        }
    } else {
        return false
    }
}

export const validateImage = (file: File, fileIndex: number): IImageValidationResponse => {
    let errors: string[] = [];
    let valid: boolean = true
    if (!hasValidExtension(file)) {
        errors.push("Falsches Dateiformat")
        valid = false
    }
    if (!doesntExceedFileLimit(fileIndex)) {
        errors.push("Es kann nur ein Foto hochgeladen werden")
        valid = false
    }
    return { valid: valid, errors: errors };
}
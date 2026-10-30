import { AlertColor } from '@mui/material';

// The api middleware resolves a failed request with its error message.
export type SendResult = unknown;

const fotos = (count: number) => `${count} ${count === 1 ? 'Foto' : 'Fotos'}`;

export const sendSummary = (
    results: SendResult[],
    photoCount: number,
    receiverCount: number,
    scheduled: boolean,
): { message: string; severity: AlertColor; allFailed: boolean } => {
    const errors = results.filter((result): result is string => typeof result === 'string');
    const failed = errors.length;

    if (failed === 0) {
        return {
            message: `${fotos(photoCount)} an ${receiverCount} Empfänger ${scheduled ? 'geplant' : 'gesendet'}`,
            severity: 'success',
            allFailed: false,
        };
    }
    if (failed === results.length) {
        return { message: `Senden fehlgeschlagen: ${errors[0]}`, severity: 'error', allFailed: true };
    }
    return {
        message: `${results.length - failed} von ${results.length} Sendungen erfolgreich, ${failed} fehlgeschlagen`,
        severity: 'warning',
        allFailed: false,
    };
};

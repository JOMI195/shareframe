import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from '..';
import uuid from 'react-uuid';
import { addAlertSnackbar, addLoadingSnackbar, removeLoadingSnackbar } from '../snackbars/snackbars.Slice';
import { fetchWithTimeout } from '@/common/utils/fetch';
import { IServerResponse } from '@/types';
import { startTimer } from '../multiTimer/multiTimer.Slice';


const MAX_OPERATION_WAIT_TIME = 10 * 60 * 1000; // 10 minutes

// Types for Slideshow Operation State
interface SlideshowOperationState {
    isToggling: boolean;
    isClearingDisplay: boolean;
    error: string | null;
    startTime: number | null;
}

// Initial State
const initialState: SlideshowOperationState = {
    isToggling: false,
    isClearingDisplay: false,
    error: null,
    startTime: null,
};

// Slice
export const slideshowOperationSlice = createSlice({
    name: 'slideshowOperation',
    initialState,
    reducers: {
        setToggleStatus: (state, action: PayloadAction<{
            isToggling: boolean;
        }>) => {
            state.isToggling = action.payload.isToggling;
            state.startTime = action.payload.isToggling ? Date.now() : null;
        },
        setClearDisplayStatus: (state, action: PayloadAction<{
            isClearingDisplay: boolean;
        }>) => {
            state.isClearingDisplay = action.payload.isClearingDisplay;
            state.startTime = action.payload.isClearingDisplay ? Date.now() : null;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        resetOperation: (state) => {
            state.isToggling = false;
            state.isClearingDisplay = false;
            state.error = null;
            state.startTime = null;
        }
    }
});

// Async Thunk for Clearing Display
export const clearDisplayThunk = () => async (
    dispatch: AppDispatch,
    getState: () => RootState
) => {
    const currentState = getState().slideshowOperation;

    // Prevent multiple simultaneous operations
    if (currentState.isToggling || currentState.isClearingDisplay) {
        return;
    }

    const actionId = uuid();

    try {
        // Start clear display operation
        dispatch(slideshowOperationSlice.actions.setClearDisplayStatus({
            isClearingDisplay: true,
        }));

        // Add loading snackbar
        dispatch(addLoadingSnackbar(
            actionId,
            'Bildschirm wird geleert'
        ));

        const clearResponse = await fetchWithTimeout('/api/frame/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        const clearData: IServerResponse = await clearResponse.json();

        if (!clearData.success) {
            throw new Error('Bildschirm leeren fehlgeschlagen');
        }

        // Success notification
        dispatch(addAlertSnackbar(
            uuid(),
            'Bildschirm erfolgreich geleert',
            'success'
        ));

        // Start timer
        dispatch(startTimer('actionRestrict'));

        // Reset clear display status
        dispatch(slideshowOperationSlice.actions.setClearDisplayStatus({
            isClearingDisplay: false,
        }));

        dispatch(removeLoadingSnackbar(actionId));

    } catch (error) {
        // Reset clear display status
        dispatch(slideshowOperationSlice.actions.setClearDisplayStatus({
            isClearingDisplay: false,
        }));

        // Set error
        dispatch(slideshowOperationSlice.actions.setError(
            error instanceof Error ? error.message : 'Unbekannter Fehler'
        ));

        // Error notification
        dispatch(addAlertSnackbar(
            uuid(),
            'Fehler beim Leeren des Bildschirms',
            'error'
        ));

        dispatch(removeLoadingSnackbar(actionId));
    }
};

export const toggleSlideshowThunk = () => async (
    dispatch: AppDispatch,
    getState: () => RootState
) => {
    const currentState = getState().slideshowOperation;

    // Prevent multiple simultaneous operations
    if (currentState.isToggling || currentState.isClearingDisplay) {
        return;
    }

    const actionId = uuid();

    try {
        // Start toggle operation
        dispatch(slideshowOperationSlice.actions.setToggleStatus({
            isToggling: true,
        }));

        // Add loading snackbar
        dispatch(addLoadingSnackbar(
            actionId,
            'Status der Bilderwiedergabe wird gewechselt'
        ));

        // Fetch current slideshow status
        const statusResponse = await fetchWithTimeout('/api/frame/slideshow/is-active');
        const statusData = await statusResponse.json();

        if (!statusData.success) {
            throw new Error('Aktueller Status konnte nicht abgerufen werden');
        }

        const action = statusData.isActive ? 'stop' : 'start';

        const toggleResponse = await fetchWithTimeout('/api/frame/slideshow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        const toggleData: IServerResponse = await toggleResponse.json();

        if (!toggleData.success) {
            throw new Error('Statusänderung fehlgeschlagen');
        }

        const monitorOperation = async () => {
            const startTime = Date.now();

            while (Date.now() - startTime < MAX_OPERATION_WAIT_TIME) {
                try {
                    const statusCheck = await fetchWithTimeout('/api/frame/slideshow/is-active');
                    const statusCheckData = await statusCheck.json();

                    if (statusCheckData.success &&
                        statusCheckData.isActive !== statusData.isActive) {

                        // Reset toggle status
                        dispatch(slideshowOperationSlice.actions.setToggleStatus({
                            isToggling: false,
                        }));

                        // Success notification
                        dispatch(addAlertSnackbar(
                            uuid(),
                            `Bilderwiedergabe erfolgreich ${action === 'stop' ? 'gestoppt' : 'gestartet'}`,
                            'success'
                        ));

                        dispatch(startTimer('actionRestrict'));

                        // Clear frame if stopping
                        if (action === 'stop') {
                            await fetchWithTimeout('/api/frame/clear', { method: 'POST' });
                        }

                        dispatch(removeLoadingSnackbar(actionId));


                        return;
                    }
                } catch (checkError) {
                    console.error('Status check failed', checkError);
                    dispatch(removeLoadingSnackbar(actionId));
                }

                // Wait before next check
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Timeout occurred
            dispatch(slideshowOperationSlice.actions.setToggleStatus({
                isToggling: false,
            }));

            dispatch(slideshowOperationSlice.actions.setError(
                'Zeitüberschreitung bei Statusänderung'
            ));

            // Error notification
            dispatch(addAlertSnackbar(
                uuid(),
                'Zeitüberschreitung bei Statusänderung',
                'error'
            ));

            dispatch(removeLoadingSnackbar(actionId));
        };

        // Start monitoring in background
        monitorOperation();

    } catch (error) {
        // Reset toggle status
        dispatch(slideshowOperationSlice.actions.setToggleStatus({
            isToggling: false,
        }));

        // Set error
        dispatch(slideshowOperationSlice.actions.setError(
            error instanceof Error ? error.message : 'Unbekannter Fehler'
        ));

        // Error notification
        dispatch(addAlertSnackbar(
            uuid(),
            'Fehler bei der Statusänderung der Bildwiedergabe',
            'error'
        ));

        dispatch(removeLoadingSnackbar(actionId));
    }
};

export const selectSlideshowOperation = (state: RootState) => state.slideshowOperation;

export const {
    setToggleStatus,
    setClearDisplayStatus,
    setError,
    resetOperation
} = slideshowOperationSlice.actions;

export default slideshowOperationSlice.reducer;
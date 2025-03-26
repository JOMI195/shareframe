import { createSlice, PayloadAction, ThunkAction } from '@reduxjs/toolkit';
import { RootState } from '..';

// Timer configuration
const TIMER_DURATION_MINS = 3;
const TIMER_DURATION_SECS = TIMER_DURATION_MINS * 60;
const TIMER_END_KEY = 'GlobalTimer_EndTime';

// State interface
interface GlobalTimerState {
    isRunning: boolean;
    remainingSeconds: number;
}

// Initial state
const initialState: GlobalTimerState = {
    isRunning: false,
    remainingSeconds: 0
};

// Slice
export const slideshowActionRestrictTimerSlice = createSlice({
    name: 'slideshowActionRestrictTimer',
    initialState,
    reducers: {
        // Start the timer and begin countdown
        startTimerWithCountdown(state) {
            state.isRunning = true;
            state.remainingSeconds = TIMER_DURATION_SECS;

            // Store end time in localStorage
            const endTime = Date.now() + (TIMER_DURATION_SECS * 1000);
            localStorage.setItem(TIMER_END_KEY, endTime.toString());
        },

        // Restore timer state from localStorage
        restoreTimerState(state, action: PayloadAction<{ remainingSeconds: number }>) {
            state.isRunning = true;
            state.remainingSeconds = action.payload.remainingSeconds;
        },

        // Update remaining time
        updateRemainingTime(state, action: PayloadAction<number>) {
            state.remainingSeconds = action.payload;

            // Stop timer when time runs out
            if (action.payload <= 0) {
                state.isRunning = false;
                localStorage.removeItem(TIMER_END_KEY);
            }
        },

        // Reset timer
        resetTimer(state) {
            state.isRunning = false;
            state.remainingSeconds = 0;
            localStorage.removeItem(TIMER_END_KEY);
        }
    }
});

// Thunk to start timer with countdown
export const startSlideshowActionRestrictTimer = (): ThunkAction<void, RootState, unknown, any> =>
    (dispatch, getState) => {
        // Dispatch to start timer
        dispatch(slideshowActionRestrictTimerSlice.actions.startTimerWithCountdown());

        // Start countdown interval
        startCountdownInterval(dispatch, getState);
    };

// Helper function to start countdown interval
const startCountdownInterval = (
    dispatch: any,
    getState: () => RootState
) => {
    const intervalId = setInterval(() => {
        const state = getState().slideshowActionRestrictTimer;

        if (state.isRunning && state.remainingSeconds > 0) {
            dispatch(slideshowActionRestrictTimerSlice.actions.updateRemainingTime(state.remainingSeconds - 1));
        } else {
            // Stop the interval if timer is not running or time is up
            clearInterval(intervalId);
        }
    }, 1000);
};

// Thunk to initialize timer from localStorage
export const initializeTimerFromStorage = (): ThunkAction<void, RootState, unknown, any> =>
    (dispatch, getState) => {
        const storedEndTime = localStorage.getItem(TIMER_END_KEY);

        if (storedEndTime) {
            const endTime = parseInt(storedEndTime, 10);
            const currentTime = Date.now();
            const remainingMs = endTime - currentTime;

            if (remainingMs > 0) {
                // Restore timer state
                dispatch(slideshowActionRestrictTimerSlice.actions.restoreTimerState({
                    remainingSeconds: Math.ceil(remainingMs / 1000)
                }));

                // Start the countdown interval
                startCountdownInterval(dispatch, getState);
            } else {
                // Clear expired timer
                localStorage.removeItem(TIMER_END_KEY);
            }
        }
    };

// Utility to format time
export const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Selector for timer state
export const selectSlideshowActionRestrictTimer = (state: RootState) => state.slideshowActionRestrictTimer;

// Export actions
export const {
    startTimerWithCountdown,
    updateRemainingTime,
    resetTimer
} = slideshowActionRestrictTimerSlice.actions;

export default slideshowActionRestrictTimerSlice.reducer;
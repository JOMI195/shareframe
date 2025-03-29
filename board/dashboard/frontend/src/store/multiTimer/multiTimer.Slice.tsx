import { Action, createSlice, PayloadAction, ThunkAction } from '@reduxjs/toolkit';
import { RootState } from '..';

// Timer configuration
const DEFAULT_TIMER_DURATION_MINS = 3;
const DEFAULT_TIMER_DURATION_SECS = DEFAULT_TIMER_DURATION_MINS * 60;
const MULTI_TIMER_STORAGE_KEY = 'MultiTimerState';

// Timer configuration interface
interface TimerState {
    isRunning: boolean;
    remainingSeconds: number;
    endTime?: number;
}

// Overall state with multiple timers
interface MultiTimerState {
    timers: Record<string, TimerState>;
}

// Initial state
const initialState: MultiTimerState = {
    timers: {}
};

// Slice
export const multiTimerSlice = createSlice({
    name: 'multiTimer',
    initialState,
    reducers: {
        // Create a new timer
        createTimer(state, action: PayloadAction<{
            id: string,
            durationMins?: number
        }>) {
            const { id, durationMins = DEFAULT_TIMER_DURATION_MINS } = action.payload;
            const durationSecs = durationMins * 60;

            // Prevent overwriting existing timer
            if (!state.timers[id]) {
                state.timers[id] = {
                    isRunning: false,
                    remainingSeconds: durationSecs,
                    endTime: undefined
                };
            }

            // Save to localStorage
            saveTimersToLocalStorage(state.timers);
        },

        // Start a specific timer
        startTimer(state, action: PayloadAction<{ id: string }>) {
            const { id } = action.payload;
            const timer = state.timers[id];

            if (timer) {
                timer.isRunning = true;
                timer.endTime = Date.now() + (timer.remainingSeconds * 1000);

                // Save to localStorage
                saveTimersToLocalStorage(state.timers);
            }
        },

        // Update remaining time for a specific timer
        updateTimerRemainingTime(state, action: PayloadAction<{
            id: string,
            remainingSeconds: number
        }>) {
            const { id, remainingSeconds } = action.payload;
            const timer = state.timers[id];

            if (timer) {
                timer.remainingSeconds = remainingSeconds;

                // Stop timer when time runs out
                if (remainingSeconds <= 0) {
                    timer.isRunning = false;
                    timer.endTime = undefined;
                }

                // Save to localStorage
                saveTimersToLocalStorage(state.timers);
            }
        },

        resetAllTimers(state) {
            // Reset each timer to its initial state
            Object.keys(state.timers).forEach(id => {
                const timer = state.timers[id];
                timer.isRunning = false;
                timer.remainingSeconds = DEFAULT_TIMER_DURATION_SECS;
                timer.endTime = undefined;
            });

            // Save to localStorage
            saveTimersToLocalStorage(state.timers);
        },

        // Reset a specific timer
        resetTimer(state, action: PayloadAction<{ id: string }>) {
            const { id } = action.payload;
            const timer = state.timers[id];

            if (timer) {
                timer.isRunning = false;
                timer.remainingSeconds = DEFAULT_TIMER_DURATION_SECS;
                timer.endTime = undefined;

                // Save to localStorage
                saveTimersToLocalStorage(state.timers);
            }
        },

        // Remove a specific timer
        removeTimer(state, action: PayloadAction<{ id: string }>) {
            delete state.timers[action.payload.id];

            // Save to localStorage
            saveTimersToLocalStorage(state.timers);
        },

        // Load timers from localStorage
        loadTimersFromStorage(state, action: PayloadAction<MultiTimerState['timers']>) {
            state.timers = action.payload;
        }
    }
});

// Utility to save timers to localStorage
const saveTimersToLocalStorage = (timers: Record<string, TimerState>) => {
    try {
        localStorage.setItem(MULTI_TIMER_STORAGE_KEY, JSON.stringify(timers));
    } catch (error) {
        console.error('Failed to save timers to localStorage', error);
    }
};

export const resetAllTimers = (): ThunkAction<void, RootState, unknown, any> =>
    (dispatch) => {
        dispatch(multiTimerSlice.actions.resetAllTimers());
    };

// Thunk to initialize timers from localStorage
export const initializeTimersFromStorage = ():
    ThunkAction<void, RootState, unknown, Action> =>
    (dispatch) => {
        try {
            // Type-safe localStorage retrieval
            const storedTimersJson = localStorage.getItem(MULTI_TIMER_STORAGE_KEY);

            if (storedTimersJson) {
                // Safely parse the stored timers
                const storedTimers: Record<string, TimerState> = JSON.parse(storedTimersJson);
                const validTimers: MultiTimerState['timers'] = {};

                // Validate and restore running timers
                Object.entries(storedTimers).forEach(([id, timer]) => {
                    // Type guards for timer validation
                    const isValidTimer =
                        timer &&
                        typeof timer === 'object' &&
                        timer.isRunning === true &&
                        timer.endTime !== undefined &&
                        typeof timer.endTime === 'number' &&
                        typeof timer.remainingSeconds === 'number';

                    if (isValidTimer) {
                        const currentTime = Date.now();
                        const remainingMs = timer.endTime! - currentTime;

                        // Only restore timers with positive remaining time
                        if (remainingMs > 0) {
                            validTimers[id] = {
                                ...timer,
                                remainingSeconds: Math.ceil(remainingMs / 1000)
                            };

                            // Dispatch start for each valid timer
                            dispatch({
                                type: 'multiTimer/startTimer',
                                payload: { id }
                            });
                        } else {
                            dispatch(multiTimerSlice.actions.removeTimer({ id }));
                        }
                    } else {
                        dispatch(multiTimerSlice.actions.removeTimer({ id }));
                    }
                });

                // Dispatch action to load valid timers
                dispatch({
                    type: 'multiTimer/loadTimersFromStorage',
                    payload: validTimers
                });
            }
        } catch (error) {
            // Type-safe error handling
            console.error('Failed to initialize timers from localStorage', error);

            // Optionally dispatch an error action
            dispatch({
                type: 'multiTimer/initializationError',
                payload: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

// Thunk to start a timer with countdown
export const startTimer = (id: string, durationMins?: number): ThunkAction<void, RootState, unknown, any> =>
    (dispatch, getState) => {
        // Ensure timer exists, creating if necessary
        const existingTimer = getState().multiTimer.timers[id];
        if (!existingTimer) {
            dispatch(multiTimerSlice.actions.createTimer({ id, durationMins }));
        }

        // Start the timer
        dispatch(multiTimerSlice.actions.startTimer({ id }));

        // Start countdown interval
        startCountdownInterval(id, dispatch, getState);
    };

// Helper function to start countdown interval
const startCountdownInterval = (
    timerId: string,
    dispatch: any,
    getState: () => RootState
) => {
    const intervalId = setInterval(() => {
        const timer = getState().multiTimer.timers[timerId];

        if (timer && timer.isRunning && timer.remainingSeconds > 0) {
            const currentTime = Date.now();
            const updatedRemainingSeconds = Math.max(
                0,
                Math.ceil((timer.endTime! - currentTime) / 1000)
            );

            dispatch(multiTimerSlice.actions.updateTimerRemainingTime({
                id: timerId,
                remainingSeconds: updatedRemainingSeconds
            }));
        } else {
            // Stop the interval if timer is not running or time is up
            clearInterval(intervalId);
        }
    }, 1000);
};

// Utility to format time
export const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Selector for getting a specific timer with default properties
export const selectTimer = (state: RootState, timerId: string): TimerState => {
    const DEFAULT_TIMER_STATE: TimerState = {
        isRunning: false,
        remainingSeconds: 0,
        endTime: undefined
    };

    return state.multiTimer.timers[timerId] || DEFAULT_TIMER_STATE;
};

// Selector for getting all timers
export const selectAllTimers = (state: RootState) =>
    state.multiTimer.timers;

// Export actions
export const {
    createTimer,
    startTimer: startTimerAction,
    updateTimerRemainingTime,
    resetTimer,
    removeTimer,
    resetAllTimers: resetAllTimersAction
} = multiTimerSlice.actions;

export default multiTimerSlice.reducer;
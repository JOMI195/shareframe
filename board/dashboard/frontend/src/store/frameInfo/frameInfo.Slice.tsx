import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import uuid from 'react-uuid';
import { addAlertSnackbar } from '@/store/snackbars/snackbars.Slice';
import { IServerResponse } from '@/types';
import { fetchWithTimeout } from '@/common/utils/fetch';

// Interfaces
export interface FrameInfo {
    public_serial_number: string;
    version: string;
    display_refresh_interval_mins: number;
}

export interface FrameInfoState {
    frameInfo: FrameInfo | null;
    loading: boolean;
    error: string | null;
}

// Initial State
const initialState: FrameInfoState = {
    frameInfo: null,
    loading: false,
    error: null
};

// Async Thunk
export const fetchFrameInfos = createAsyncThunk(
    'frameInfo/fetchFrameInfos',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const response = await fetchWithTimeout('/api/frame/infos');
            const data: IServerResponse & { frameInfo: FrameInfo } = await response.json();

            if (data.success && data.frameInfo) {
                return data.frameInfo;
            } else {
                dispatch(addAlertSnackbar(uuid(), "Abrufen der Frame-Informationen fehlgeschlagen", "error"));
                return rejectWithValue('Failed to fetch frame infos');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            dispatch(addAlertSnackbar(uuid(), "Abrufen der Frame-Informationen fehlgeschlagen", "error"));
            return rejectWithValue(errorMessage);
        }
    }
);

// Slice
export const frameInfoSlice = createSlice({
    name: 'frameInfo',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Fetch Frame Infos
        builder.addCase(fetchFrameInfos.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchFrameInfos.fulfilled, (state, action) => {
            state.loading = false;
            state.frameInfo = action.payload;
        });
        builder.addCase(fetchFrameInfos.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    }
});

// Selectors
export const selectFrameInfoState = (state: RootState) => state.frameInfo;

export default frameInfoSlice.reducer;
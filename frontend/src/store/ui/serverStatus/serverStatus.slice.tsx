import { RootState } from "@/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type SliceState = {
  unavailable: boolean;
  maintenance: boolean;
};

const initialState: SliceState = {
  unavailable: false,
  maintenance: false,
};

const serverStatusSlice = createSlice({
  name: "serverStatus",
  initialState,
  reducers: {
    serverUnavailable: (serverStatus, action: PayloadAction<{ maintenance: boolean }>) => {
      serverStatus.unavailable = true;
      serverStatus.maintenance = action.payload.maintenance;
    },
    serverAvailable: (serverStatus) => {
      serverStatus.unavailable = false;
      serverStatus.maintenance = false;
    },
  },
});

export const { serverUnavailable, serverAvailable } = serverStatusSlice.actions;
export default serverStatusSlice.reducer;

export const getServerStatus = (state: RootState) => state.ui.serverStatus;

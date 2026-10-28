import { RootState } from "@/store";
import { createAction, createSlice } from "@reduxjs/toolkit";

type SliceState = {
  selectedFeature: { title: string };
  sidebar: { open: boolean };
};

const initialState: SliceState = {
  selectedFeature: { title: "welcome" },
  sidebar: { open: false }
};

// Dialog state lives in the store, so without this a dialog left open would reappear on the next visit.
export const routeChanged = createAction("navigation/routeChanged");

export const closeOpenDialogs = (dialogs: Record<string, { open: boolean }>) => {
  for (const dialog of Object.values(dialogs)) dialog.open = false;
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    featureSelected: (navigation, action) => {
      navigation.selectedFeature.title = action.payload;
    },
    sidebarOpened: (navigation) => {
      navigation.sidebar.open = true;
    },
    sidebarClosed: (navigation) => {
      navigation.sidebar.open = false;
    },
  },
});

export const setSelectedFeature = (payload: string) => ({
  type: featureSelected.type,
  payload,
});

export const openSidedbar = () => ({
  type: sidebarOpened.type,
});

export const closeSidebar = () => ({
  type: sidebarClosed.type,
});

export const {
  featureSelected,
  sidebarOpened,
  sidebarClosed
} = navigationSlice.actions;

export default navigationSlice.reducer;

export const getSelectedFeature = (state: RootState) =>
  state.ui.navigation.selectedFeature;

export const getSidebar = (state: RootState) =>
  state.ui.navigation.sidebar;
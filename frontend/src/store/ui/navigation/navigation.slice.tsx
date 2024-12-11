import { RootState } from "@/store";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  selectedFeature: { title: string };
  dialogs: { loginOptions: { open: boolean } };
  sidebar: { open: boolean };
};

const initialState: SliceState = {
  selectedFeature: { title: "welcome" },
  dialogs: { loginOptions: { open: false } },
  sidebar: { open: false }
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    featureSelected: (navigation, action) => {
      navigation.selectedFeature.title = action.payload;
    },
    loginOptionsDialogOpened: (navigation) => {
      navigation.dialogs.loginOptions.open = true;
    },
    loginOptionsDialogClosed: (navigation) => {
      navigation.dialogs.loginOptions.open = false;
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

export const openLoginOptionsDialog = () => ({
  type: loginOptionsDialogOpened.type,
});

export const closeLoginOptionsDialog = () => ({
  type: loginOptionsDialogClosed.type,
});

export const openSidedbar = () => ({
  type: sidebarOpened.type,
});

export const closeSidebar = () => ({
  type: sidebarClosed.type,
});

export const {
  featureSelected,
  loginOptionsDialogOpened,
  loginOptionsDialogClosed,
  sidebarOpened,
  sidebarClosed
} = navigationSlice.actions;

export default navigationSlice.reducer;

export const getSelectedFeature = (state: RootState) =>
  state.ui.navigation.selectedFeature;

export const getDialogs = (state: RootState) =>
  state.ui.navigation.dialogs;

export const getSidebar = (state: RootState) =>
  state.ui.navigation.sidebar;
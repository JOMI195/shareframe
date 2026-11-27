import { RootState } from '@/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ColorPreference } from '@/context/colorTheme/colorThemeContextValue';

type SliceState = {
  design: { colorTheme: ColorPreference; seasonalThemes: boolean };
  pwa: { installPromptDismissed: boolean; pushPromptDismissed: boolean };
  // The last choice in the upload dialog, kept for the next upload.
  upload: { autoDelete: boolean };
};

const initialState: SliceState = {
  design: {
    colorTheme: (localStorage.getItem('colorTheme') as ColorPreference | null) || 'system',
    seasonalThemes: true,
  },
  pwa: { installPromptDismissed: false, pushPromptDismissed: false },
  upload: { autoDelete: true },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    designSelected: (settings, action: PayloadAction<ColorPreference>) => {
      settings.design.colorTheme = action.payload;
      localStorage.setItem('colorTheme', action.payload);
    },
    seasonalThemesSelected: (settings, action: PayloadAction<boolean>) => {
      settings.design.seasonalThemes = action.payload;
    },
    installPromptDismissed: (state) => {
      state.pwa.installPromptDismissed = true;
    },
    pushPromptDismissed: (state) => {
      state.pwa.pushPromptDismissed = true;
    },
    pushPromptReset: (state) => {
      state.pwa.pushPromptDismissed = false;
    },
    uploadAutoDeleteSet: (state, action: PayloadAction<boolean>) => {
      state.upload.autoDelete = action.payload;
    },
  },
});

export const {
  designSelected,
  seasonalThemesSelected,
  installPromptDismissed,
  pushPromptDismissed,
  pushPromptReset,
  uploadAutoDeleteSet,
} = settingsSlice.actions;

export default settingsSlice.reducer;

export const getDesign = (state: RootState) => state.ui.settings.design.colorTheme;
export const getSeasonalThemes = (state: RootState) => state.ui.settings.design.seasonalThemes;
export const getPwa = (state: RootState) => state.ui.settings.pwa;
export const getUploadAutoDelete = (state: RootState) => state.ui.settings.upload.autoDelete;

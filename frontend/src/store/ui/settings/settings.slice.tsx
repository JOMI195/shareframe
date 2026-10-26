import { RootState } from '@/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ColorPreference } from '@/context/colorTheme/colorThemeContextValue';

const COOKIE_CONSENT_LIFETIME = Number(import.meta.env.VITE_APP_COOKIE_CONSENT_LIFETIME) || 30;

const getNewConsentExpiryDate = () => {
  const newExpiryDate = Date.now() + COOKIE_CONSENT_LIFETIME * 24 * 60 * 60 * 1000;
  return newExpiryDate;
}

type SliceState = {
  design: { colorTheme: ColorPreference; seasonalThemes: boolean };
  cookies: {
    analyticsCookies: boolean;
    consentExpiry: number | null;
  };
  pwa: { installPromptDismissed: boolean; pushPromptDismissed: boolean };
};

const initialState: SliceState = {
  design: {
    colorTheme: (localStorage.getItem('colorTheme') as ColorPreference | null) || 'system',
    seasonalThemes: true,
  },
  cookies: {
    analyticsCookies: JSON.parse(localStorage.getItem('analyticsCookies') || 'false'),
    consentExpiry: JSON.parse(localStorage.getItem('consentExpiry') || 'null'),
  },
  pwa: { installPromptDismissed: false, pushPromptDismissed: false }
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
    analyticsCookiesAccepted: (state) => {
      state.cookies.analyticsCookies = true;
      localStorage.setItem('analyticsCookies', JSON.stringify(true));

      const newConsentExpiryDate = getNewConsentExpiryDate()
      state.cookies.consentExpiry = newConsentExpiryDate;
      localStorage.setItem('consentExpiry', JSON.stringify(newConsentExpiryDate));
    },
    analyticsCookiesDeclined: (state) => {
      state.cookies.analyticsCookies = false;
      localStorage.setItem('analyticsCookies', JSON.stringify(false));

      const newConsentExpiryDate = getNewConsentExpiryDate()
      state.cookies.consentExpiry = newConsentExpiryDate;
      localStorage.setItem('consentExpiry', JSON.stringify(newConsentExpiryDate));
    },
    allCookiesAccepted: (state) => {
      state.cookies.analyticsCookies = true;
      localStorage.setItem('analyticsCookies', JSON.stringify(true));

      const newConsentExpiryDate = getNewConsentExpiryDate()
      state.cookies.consentExpiry = newConsentExpiryDate;
      localStorage.setItem('consentExpiry', JSON.stringify(newConsentExpiryDate));
    },
    allCookiesDeclined: (state) => {
      state.cookies.analyticsCookies = false;
      localStorage.setItem('analyticsCookies', JSON.stringify(false));

      const newConsentExpiryDate = getNewConsentExpiryDate()
      state.cookies.consentExpiry = newConsentExpiryDate;
      localStorage.setItem('consentExpiry', JSON.stringify(newConsentExpiryDate));
    },
    installPromptDismissed: (state) => {
      state.pwa.installPromptDismissed = true;
    },
    pushPromptDismissed: (state) => {
      state.pwa.pushPromptDismissed = true;
    },
    pushPromptReset: (state) => {
      state.pwa.pushPromptDismissed = false;
    }
  },
});

export const acceptAnalyticsCookies = () => ({
  type: analyticsCookiesAccepted.type,
});

export const declineAnalyticsCookies = () => ({
  type: analyticsCookiesDeclined.type,
});

export const acceptAllCookies = () => ({
  type: allCookiesAccepted.type,
});

export const {
  designSelected,
  seasonalThemesSelected,
  analyticsCookiesAccepted,
  analyticsCookiesDeclined,
  allCookiesAccepted,
  allCookiesDeclined,
  installPromptDismissed,
  pushPromptDismissed,
  pushPromptReset
} = settingsSlice.actions;

export default settingsSlice.reducer;

export const getDesign = (state: RootState) => state.ui.settings.design.colorTheme;
export const getSeasonalThemes = (state: RootState) => state.ui.settings.design.seasonalThemes;
export const getCookies = (state: RootState) => state.ui.settings.cookies;
export const getPwa = (state: RootState) => state.ui.settings.pwa;

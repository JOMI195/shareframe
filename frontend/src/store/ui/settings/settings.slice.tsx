import { RootState } from '@/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ColorPreference } from '@/context/colorTheme/colorThemeContextValue';

const COOKIE_CONSENT_LIFETIME = Number(import.meta.env.VITE_APP_COOKIE_CONSENT_LIFETIME) || 30;

const getNewConsentExpiryDate = () => {
  const newExpiryDate = Date.now() + COOKIE_CONSENT_LIFETIME * 24 * 60 * 60 * 1000;
  return newExpiryDate;
}

type SliceState = {
  design: { colorTheme: ColorPreference };
  cookies: {
    analyticsCookies: boolean;
    consentExpiry: number | null;
  };
  navigation: { bottomNavigation: { open: boolean } };
  pwa: { installPromptDismissed: boolean };
};

const initialState: SliceState = {
  design: { colorTheme: (localStorage.getItem('colorTheme') as ColorPreference | null) || 'system' },
  cookies: {
    analyticsCookies: JSON.parse(localStorage.getItem('analyticsCookies') || 'false'),
    consentExpiry: JSON.parse(localStorage.getItem('consentExpiry') || 'null'),
  },
  navigation: { bottomNavigation: { open: false } },
  pwa: { installPromptDismissed: false }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    designSelected: (settings, action: PayloadAction<ColorPreference>) => {
      settings.design.colorTheme = action.payload;
      localStorage.setItem('colorTheme', action.payload);
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
    bottomNavigationOpened: (state) => {
      state.navigation.bottomNavigation.open = true;
    },
    bottomNavigationClosed: (state) => {
      state.navigation.bottomNavigation.open = false;
    },
    installPromptDismissed: (state) => {
      state.pwa.installPromptDismissed = true;
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

export const openBottomNavigation = () => ({
  type: bottomNavigationOpened.type,
});

export const closeBottomNavigation = () => ({
  type: bottomNavigationClosed.type,
});

export const {
  designSelected,
  analyticsCookiesAccepted,
  analyticsCookiesDeclined,
  allCookiesAccepted,
  allCookiesDeclined,
  bottomNavigationOpened,
  bottomNavigationClosed,
  installPromptDismissed
} = settingsSlice.actions;

export default settingsSlice.reducer;

export const getDesign = (state: RootState) => state.ui.settings.design.colorTheme;
export const getCookies = (state: RootState) => state.ui.settings.cookies;
export const getNavigation = (state: RootState) => state.ui.settings.navigation;
export const getPwa = (state: RootState) => state.ui.settings.pwa;

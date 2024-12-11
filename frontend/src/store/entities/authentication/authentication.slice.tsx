import { RootState } from "@/store";
import { IUser } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  api: {
    loading: boolean;
    lastFetch: number | null;
  };
  loggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  persistToken: string | null;
  me: IUser;
};

const initialState: SliceState = {
  api: {
    loading: false,
    lastFetch: null,
  },
  loggedIn: false,
  accessToken: null,
  refreshToken: null,
  persistToken: null,
  me: {
    id: 0,
    email: "",
    username: "",
    account: {
      recieves_newsletter: false
    }
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    userCreationPending: (user) => {
      user.api.loading = true;
    },
    userCreationFulfilled: (user) => {
      user.api.loading = false;
    },
    userCreationRejected: (user) => {
      user.api.loading = false;
    },
    resendActivationEmailPending: (user) => {
      user.api.loading = true;
    },
    resendActivationEmailFulfilled: (user) => {
      user.api.loading = false;
    },
    resendActivationEmailRejected: (user) => {
      user.api.loading = false;
    },
    userActivationPending: (user) => {
      user.api.loading = true;
    },
    userActivationFulfilled: (user) => {
      user.api.loading = false;
    },
    userActivationRejected: (user) => {
      user.api.loading = false;
    },
    authenticationPending: (user) => {
      user.api.loading = true;
    },
    authenticationFulfilled: (user, action) => {
      user.accessToken = action.payload.access;
      user.refreshToken = action.payload.refresh;
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("refreshToken", action.payload.refresh);
      localStorage.setItem("accessToken", action.payload.access);
      user.loggedIn = true;
      user.api.lastFetch = Date.now();
      user.api.loading = false;
    },
    authenticationRejected: (user) => {
      user.api.loading = false;
    },
    getUserDataPending: (user) => {
      user.api.loading = true;
    },
    getUserDataFulfilled: (user, action) => {
      user.me = action.payload;
      user.api.lastFetch = Date.now();
      user.api.loading = false;
    },
    getUserDataRejected: (user) => {
      user.api.loading = false;
    },
    signedOut: () => {
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("accessToken");
      return initialState;
    },
    userFetchFulfilled: (user, action) => {
      user.loggedIn = true;
      user.me = action.payload;
      user.api.loading = false;
      user.api.lastFetch = Date.now();
    },
    userUpdatePending: (user) => {
      user.api.loading = true;
    },
    userUpdateFulfilled: (user, action) => {
      user.me = action.payload;
      user.api.loading = false;
      user.api.lastFetch = Date.now();
    },
    userUpdateRejected: (user) => {
      user.api.loading = false;
    },
    accountUpdatePending: (user) => {
      user.api.loading = true;
    },
    accountUpdateFulfilled: (user, action) => {
      user.me.account = action.payload;
      user.api.loading = false;
      user.api.lastFetch = Date.now();
    },
    accountUpdateRejected: (user) => {
      user.api.loading = false;
    },
    passwordResetPending: (user) => {
      user.api.loading = true;
    },
    passwordResetFulfilled: (user) => {
      user.api.loading = false;
    },
    passwordResetRejected: (user) => {
      user.api.loading = false;
    },
    profileUpdateRejected: (user) => {
      user.api.loading = false;
    },
    passwordUpdatePending: (user) => {
      user.api.loading = true;
    },
    passwordUpdateFulfilled: (user) => {
      user.api.loading = false;
    },
    passwordUpdateRejected: (user) => {
      user.api.loading = false;
    },
    emailUpdatePending: (user) => {
      user.api.loading = true;
    },
    emailUpdateFulfilled: (user, action) => {
      user.api.loading = false;
      user.me.email = action.payload;
    },
    emailUpdateRejected: (user) => {
      user.api.loading = false;
    },
    usernameUpdatePending: (user) => {
      user.api.loading = true;
    },
    usernameUpdateFulfilled: (user, action) => {
      user.api.loading = false;
      user.me.username = action.payload;
    },
    usernameUpdateRejected: (user) => {
      user.api.loading = false;
    },
    userDeletePending: (user) => {
      user.api.loading = true;
    },
    userDeleteFulfilled: (user) => {
      user.api.loading = false;
      user.loggedIn = false;
      user.accessToken = null;
      user.refreshToken = null;
      user.persistToken = null;
      user.me = {
        id: 0,
        email: "",
        username: "",
        account: {
          recieves_newsletter: false
        }
      };
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("accessToken");
    },
    userDeleteRejected: (user) => {
      user.api.loading = false;
    },
  },
});

export const {
  userCreationPending,
  userCreationFulfilled,
  userCreationRejected,
  userActivationPending,
  userActivationFulfilled,
  userActivationRejected,
  resendActivationEmailPending,
  resendActivationEmailFulfilled,
  resendActivationEmailRejected,
  authenticationPending,
  authenticationFulfilled,
  authenticationRejected,
  getUserDataPending,
  getUserDataFulfilled,
  getUserDataRejected,
  signedOut,
  userUpdatePending,
  userUpdateFulfilled,
  userUpdateRejected,
  accountUpdatePending,
  accountUpdateFulfilled,
  accountUpdateRejected,
  profileUpdateRejected,
  passwordResetPending,
  passwordResetFulfilled,
  passwordResetRejected,
  passwordUpdatePending,
  passwordUpdateFulfilled,
  passwordUpdateRejected,
  emailUpdatePending,
  emailUpdateFulfilled,
  emailUpdateRejected,
  usernameUpdatePending,
  usernameUpdateFulfilled,
  usernameUpdateRejected,
  userDeletePending,
  userDeleteFulfilled,
  userDeleteRejected,
} = userSlice.actions;
export default userSlice.reducer;

export const getApi = (state: RootState) => state.auth.user.api;
export const getUser = (state: RootState) => state.auth.user;
export const getMyUserDetails = (state: RootState) => state.auth.user.me;

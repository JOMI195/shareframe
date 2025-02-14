import { RootState } from "@/store";
import { ShippingFilter, StatusFilter } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  dialogs: {
    filter: {
      open: boolean;
      statusFilter: StatusFilter;
      shippingFilter: ShippingFilter;
      hideToYouFilter: boolean,
      senderFilter: string;
      receiverFilter: string;
    },
  };
};

const initialState: SliceState = {
  dialogs: {
    filter: {
      open: false,
      statusFilter: 'all',
      shippingFilter: 'all',
      hideToYouFilter: true,
      senderFilter: '',
      receiverFilter: ''
    }
  },
};

const sentImagesSlice = createSlice({
  name: "sentImages",
  initialState,
  reducers: {
    filterDialogOpened: (sliceState) => {
      sliceState.dialogs.filter.open = true;
    },
    filterDialogClosed: (sliceState) => {
      sliceState.dialogs.filter.open = false;
    },
    statusFilterSet: (sliceState, action) => {
      sliceState.dialogs.filter.statusFilter = action.payload.statusFilter;
    },
    shippingFilterSet: (sliceState, action) => {
      sliceState.dialogs.filter.shippingFilter = action.payload.shippingFilter;
    },
    senderFilterSet: (sliceState, action) => {
      sliceState.dialogs.filter.senderFilter = action.payload.senderFilter;
    },
    receiverFilterSet: (sliceState, action) => {
      sliceState.dialogs.filter.receiverFilter = action.payload.receiverFilter;
    },
    hideToYouFilterSet: (sliceState, action) => {
      sliceState.dialogs.filter.hideToYouFilter = action.payload.hideToYouFilter;
    },
    filtersReset: (sliceState) => {
      sliceState.dialogs.filter.statusFilter = 'all';
      sliceState.dialogs.filter.shippingFilter = 'all';
      sliceState.dialogs.filter.senderFilter = '';
      sliceState.dialogs.filter.receiverFilter = '';
      sliceState.dialogs.filter.hideToYouFilter = true;
    },
  },
});

export const openFilterDialog = () => ({
  type: filterDialogOpened.type,
});

export const closeFilterDialog = () => ({
  type: filterDialogClosed.type,
});

export const setStatusFilter = (payload: { statusFilter: string }) => ({
  type: statusFilterSet.type,
  payload
});

export const setShippingFilter = (payload: { shippingFilter: string }) => ({
  type: shippingFilterSet.type,
  payload
});

export const setSenderFilter = (payload: { senderFilter: string }) => ({
  type: senderFilterSet.type,
  payload
});

export const setRecieverFilter = (payload: { receiverFilter: string }) => ({
  type: receiverFilterSet.type,
  payload
});

export const setHideToYouFilter = (payload: { hideToYouFilter: boolean }) => ({
  type: hideToYouFilterSet.type,
  payload
});

export const resetFilters = () => ({
  type: filtersReset.type,
});

export const {
  filterDialogOpened,
  filterDialogClosed,
  statusFilterSet,
  shippingFilterSet,
  senderFilterSet,
  receiverFilterSet,
  filtersReset,
  hideToYouFilterSet
} = sentImagesSlice.actions;

export default sentImagesSlice.reducer;

export const getDialogs = (state: RootState) => state.ui.sentImages.dialogs;

import { describe, expect, it } from 'vitest';
import reducer, {
  filterDialogClosed,
  filterDialogOpened,
  filtersReset,
  hideToYouFilterSet,
  previewSentImageDialogClosed,
  previewSentImageDialogOpened,
  receiverFilterSet,
  senderFilterSet,
  shippingFilterSet,
  statusFilterSet,
} from '@/store/ui/sentImages/sentImages.slice';
import { makeSentImage } from '@tests/fixtures';

const initial = () => reducer(undefined, { type: '@@init' });

describe('sentImages preview dialog', () => {
  it('stores and clears the selected sent image', () => {
    const sentImage = makeSentImage();
    const opened = reducer(initial(), previewSentImageDialogOpened({ sentImage }));
    expect(opened.dialogs.preview).toEqual({ open: true, selectedSentImage: sentImage });

    expect(reducer(opened, previewSentImageDialogClosed()).dialogs.preview).toEqual({
      open: false,
      selectedSentImage: null,
    });
  });
});

describe('sentImages filters', () => {
  it('defaults to hiding images sent to you', () => {
    expect(initial().dialogs.filter).toEqual({
      open: false,
      statusFilter: 'all',
      shippingFilter: 'all',
      hideToYouFilter: true,
      senderFilter: '',
      receiverFilter: '',
    });
  });

  it('sets each filter independently', () => {
    let state = reducer(initial(), statusFilterSet({ statusFilter: 'active' }));
    state = reducer(state, shippingFilterSet({ shippingFilter: 'sentByYou' }));
    state = reducer(state, senderFilterSet({ senderFilter: 'alice' }));
    state = reducer(state, receiverFilterSet({ receiverFilter: 'bob' }));
    state = reducer(state, hideToYouFilterSet({ hideToYouFilter: false }));

    expect(state.dialogs.filter).toMatchObject({
      statusFilter: 'active',
      shippingFilter: 'sentByYou',
      senderFilter: 'alice',
      receiverFilter: 'bob',
      hideToYouFilter: false,
    });
  });

  // The reset restores hideToYouFilter to true, not false.
  it('restores every default on reset but leaves the dialog open state alone', () => {
    let state = reducer(initial(), filterDialogOpened());
    state = reducer(state, statusFilterSet({ statusFilter: 'expired' }));
    state = reducer(state, hideToYouFilterSet({ hideToYouFilter: false }));

    const reset = reducer(state, filtersReset());

    expect(reset.dialogs.filter).toEqual({ ...initial().dialogs.filter, open: true });
    expect(reducer(reset, filterDialogClosed()).dialogs.filter.open).toBe(false);
  });
});

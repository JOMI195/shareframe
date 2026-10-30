import { describe, expect, it } from 'vitest';
import reducer, {
  closeOpenDialogs,
  closeSidebar,
  featureSelected,
  openSidedbar,
  setSelectedFeature,
  sidebarClosed,
  sidebarOpened,
} from '@/store/ui/navigation/navigation.slice';

const initial = () => reducer(undefined, { type: '@@init' });

describe('navigation slice', () => {
  it('starts on the welcome feature with the sidebar closed', () => {
    expect(initial()).toEqual({
      selectedFeature: { title: 'welcome' },
      sidebar: { open: false },
    });
  });

  it('sets the selected feature', () => {
    expect(reducer(initial(), featureSelected('app')).selectedFeature.title).toBe('app');
  });

  it('toggles the sidebar', () => {
    const open = reducer(initial(), sidebarOpened());
    expect(open.sidebar.open).toBe(true);

    expect(reducer(open, sidebarClosed())).toEqual(initial());
  });

  it('exposes matching plain action creators', () => {
    expect(setSelectedFeature('settings')).toEqual({ type: featureSelected.type, payload: 'settings' });
    expect(openSidedbar()).toEqual({ type: sidebarOpened.type });
    expect(closeSidebar()).toEqual({ type: sidebarClosed.type });
  });
});

describe('closeOpenDialogs', () => {
  // Keeps everything but the open flags, e.g. the activity filter values.
  it('closes every dialog and leaves their data alone', () => {
    const dialogs = { filter: { open: true, statusFilter: 'expired' }, preview: { open: false } };

    closeOpenDialogs(dialogs);

    expect(dialogs).toEqual({ filter: { open: false, statusFilter: 'expired' }, preview: { open: false } });
  });
});

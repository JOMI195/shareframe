import { describe, expect, it } from 'vitest';
import reducer, {
  closeLoginOptionsDialog,
  closeSidebar,
  featureSelected,
  loginOptionsDialogClosed,
  loginOptionsDialogOpened,
  openLoginOptionsDialog,
  openSidedbar,
  setSelectedFeature,
  sidebarClosed,
  sidebarOpened,
} from '@/store/ui/navigation/navigation.slice';

const initial = () => reducer(undefined, { type: '@@init' });

describe('navigation slice', () => {
  it('starts on the welcome feature with everything closed', () => {
    expect(initial()).toEqual({
      selectedFeature: { title: 'welcome' },
      dialogs: { loginOptions: { open: false } },
      sidebar: { open: false },
    });
  });

  it('sets the selected feature', () => {
    expect(reducer(initial(), featureSelected('app')).selectedFeature.title).toBe('app');
  });

  it('toggles the sidebar and login dialog independently', () => {
    const open = reducer(reducer(initial(), sidebarOpened()), loginOptionsDialogOpened());
    expect(open.sidebar.open).toBe(true);
    expect(open.dialogs.loginOptions.open).toBe(true);

    const closed = reducer(reducer(open, sidebarClosed()), loginOptionsDialogClosed());
    expect(closed).toEqual(initial());
  });

  it('exposes matching plain action creators', () => {
    expect(setSelectedFeature('settings')).toEqual({ type: featureSelected.type, payload: 'settings' });
    expect(openSidedbar()).toEqual({ type: sidebarOpened.type });
    expect(closeSidebar()).toEqual({ type: sidebarClosed.type });
    expect(openLoginOptionsDialog()).toEqual({ type: loginOptionsDialogOpened.type });
    expect(closeLoginOptionsDialog()).toEqual({ type: loginOptionsDialogClosed.type });
  });
});

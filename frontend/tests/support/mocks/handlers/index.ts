import { appHandlers } from './app';
import { authHandlers } from './auth';
import { changelogHandlers } from './changelogs';
import { contactHandlers } from './contact';
import { dashboardHandlers } from './dashboard';
import { frameHandlers } from './frames';
import { friendshipHandlers } from './friendships';
import { imageHandlers } from './images';
import { mediaHandlers } from './media';

// The default set answers every call the app can make with an empty, signed-in
// world. Tests layer data or failures on top with server.use(...scenario).
export const handlers = [
  ...authHandlers,
  ...appHandlers,
  ...dashboardHandlers,
  ...imageHandlers,
  ...frameHandlers,
  ...friendshipHandlers,
  ...changelogHandlers,
  ...contactHandlers,
  ...mediaHandlers,
];

export {
  appHandlers,
  authHandlers,
  changelogHandlers,
  contactHandlers,
  dashboardHandlers,
  frameHandlers,
  friendshipHandlers,
  imageHandlers,
  mediaHandlers,
};

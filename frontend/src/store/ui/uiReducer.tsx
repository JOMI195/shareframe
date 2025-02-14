import { combineReducers } from "redux";

import authReducer from "./authentication/authentication.slice";
import navigationReducer from "./navigation/navigation.slice";
import settingsReducer from "./settings/settings.slice";
import contactReducer from "./contact/contact.slice";
import friendshipsReducer from "./friendships/friendships.slice";
import framesReducer from "./frames/frames.slice";
import imagesReducer from "./images/images.slice";
import sentImagesReducer from "./sentImages/sentImages.slice";

export default combineReducers({
  navigation: navigationReducer,
  friendships: friendshipsReducer,
  settings: settingsReducer,
  auth: authReducer,
  contact: contactReducer,
  frames: framesReducer,
  images: imagesReducer,
  sentImages: sentImagesReducer,
});

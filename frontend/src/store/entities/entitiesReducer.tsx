import { combineReducers } from "redux";
import contactReducer from "./contact/contact.slice";
import friendshipsReducer from "./friendships/friendships.slice";
import framesReducer from "./frames/frames.slice";
import imagesReducer from "./images/images.slice";
import changelogsReducer from "./changelogs/changelogs.slice";

export default combineReducers({
    contact: contactReducer,
    friendships: friendshipsReducer,
    frames: framesReducer,
    images: imagesReducer,
    changelogs: changelogsReducer,
});

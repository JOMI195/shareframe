import { combineReducers } from "redux";
import contactReducer from "./contact/contact.slice";
import friendshipsReducer from "./friendships/friendships.slice";
import framesReducer from "./frames/frames.slice";
import imagesReducer from "./images/images.slice";
import changelogsReducer from "./changelogs/changelogs.slice";
import appReducer from "./app/app.slice";
import dashboardReducer from "./dashboard/dashboard.slice";

export default combineReducers({
    app: appReducer,
    contact: contactReducer,
    friendships: friendshipsReducer,
    frames: framesReducer,
    images: imagesReducer,
    changelogs: changelogsReducer,
    dashboard: dashboardReducer,
});

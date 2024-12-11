import { combineReducers } from "redux";
import contactReducer from "./contact/contact.slice";
import friendshipsReducer from "./friendships/friendships.slice";

export default combineReducers({
    contact: contactReducer,
    friendships: friendshipsReducer
});

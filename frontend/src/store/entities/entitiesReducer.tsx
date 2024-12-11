import { combineReducers } from "redux";
import contactReducer from "./contact/contact.slice";

export default combineReducers({
    contact: contactReducer
});

import { combineReducers } from "redux";
import userReducer from "./authentication/authentication.slice";

export default combineReducers({
  user: userReducer,
});

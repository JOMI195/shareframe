import { combineReducers } from "redux";
import authenticationReducer from "./entities/authenticationReducer";
import entitiesReducer from "./entities/entitiesReducer";
import uiReducer from "./ui/uiReducer";

const rootReducer = combineReducers({
  auth: authenticationReducer,
  entities: entitiesReducer,
  ui: uiReducer,
});

export default rootReducer;

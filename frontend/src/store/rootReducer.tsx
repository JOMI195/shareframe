import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authenticationReducer from "./entities/authenticationReducer";
import entitiesReducer from "./entities/entitiesReducer";
import uiReducer from "./ui/uiReducer";

const uiPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['settings', 'changelogs'],
};

const rootReducer = combineReducers({
  auth: authenticationReducer,
  entities: entitiesReducer,
  ui: persistReducer(uiPersistConfig, uiReducer),
});

export default rootReducer;

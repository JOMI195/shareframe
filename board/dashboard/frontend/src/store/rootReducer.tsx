import { combineReducers } from "redux";
import snackbarsReducer from "./snackbars/snackbars.Slice";
import slideshowOperationReducer from "./slideshowOperation/slideshowOperation.Slice";
import slideshowStatusReducer from "./slideshowStatus/slideshowStatus.Slice";
import slideshowActionRestrictTimerReducer from "./slideshowActionRestrictTimer/slideshowActionRestrictTimer.Slice";
import networkReducer from "./network/network.Slice";

const rootReducer = combineReducers({
  snackbars: snackbarsReducer,
  slideshowOperation: slideshowOperationReducer,
  slideshowStatus: slideshowStatusReducer,
  slideshowActionRestrictTimer: slideshowActionRestrictTimerReducer,
  network: networkReducer,
});

export default rootReducer;
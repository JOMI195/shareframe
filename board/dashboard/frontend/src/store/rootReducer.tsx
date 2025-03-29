import { combineReducers } from "redux";
import snackbarsReducer from "./snackbars/snackbars.Slice";
import slideshowOperationReducer from "./slideshowOperation/slideshowOperation.Slice";
import slideshowStatusReducer from "./slideshowStatus/slideshowStatus.Slice";
import multiTimerReducer from "./multiTimer/multiTimer.Slice";
import networkReducer from "./network/network.Slice";
import authReducer from "./auth/auth.Slice";
import frameInfoReducer from "./frameInfo/frameInfo.Slice";
import updatesReducer from "./updates/updates.Slice";

const rootReducer = combineReducers({
  snackbars: snackbarsReducer,
  slideshowOperation: slideshowOperationReducer,
  slideshowStatus: slideshowStatusReducer,
  multiTimer: multiTimerReducer,
  network: networkReducer,
  auth: authReducer,
  frameInfo: frameInfoReducer,
  updates: updatesReducer
});

export default rootReducer;
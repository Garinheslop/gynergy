import { combineReducers } from "redux";

import states from "./states";
import toast from "./toast";

const rootReducer = combineReducers({
  states: states,
  toast: toast,
});

export default rootReducer;

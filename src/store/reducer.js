import { combineReducers } from "redux";
import list from "../components/list/model";

let commonReducers = {
  list
};

const reducer = combineReducers(commonReducers);
export default reducer;

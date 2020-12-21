import { applyMiddleware } from "redux";
import thunk from "redux-thunk";

let commonMiddlewares = [thunk];

export default applyMiddleware(...commonMiddlewares);

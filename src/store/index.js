import { createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension/developmentOnly";
import middleware from "./middleware";
import reducer from "./reducer";
const composeEnhancers = composeWithDevTools({
  // options like actionSanitizer, stateSanitizer
});
export const store = createStore(reducer, composeEnhancers(middleware));

/*const composeEnhancers =
  ( typeof window === 'object' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ) ?
      window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

export const store = createStore(reducer, composeEnhancers(middleware))
*/

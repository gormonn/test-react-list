import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
//import store from "./store";
import ListComponent from "./components/list";
import { WindowSize } from "./contexts/WindowSize";

import "./styles.css";
const renderApp = () => {
  let { store } = require("./store");
  ReactDOM.render(
    <Provider store={store}>
      <WindowSize>
        <ListComponent />
      </WindowSize>
    </Provider>,
    document.getElementById("root")
  );
};

renderApp();

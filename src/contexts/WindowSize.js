import React from "react";
const windowSize = (h = window.innerHeight, w = window.innerWidth) => {
  return {
    height: h - h * 0.1,
    width: w - w * 0.1
  };
};
export const WindowSizeContext = React.createContext(windowSize());

export class WindowSize extends React.PureComponent {
  constructor() {
    super();
    this.state = { ...windowSize() };
    this.updateDimensions = this.updateDimensions.bind(this);
  }
  updateDimensions() {
    this.setState({ ...windowSize() });
  }
  componentWillMount() {
    this.updateDimensions();
  }
  componentDidMount() {
    window.addEventListener("resize", this.updateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }
  render() {
    return (
      <WindowSizeContext.Provider value={this.state}>
        {this.props.children}
      </WindowSizeContext.Provider>
    );
  }
}

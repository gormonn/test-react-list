export const Aux = props => props.children;

export function model(model = {}, actionMap) {
  return function(state = model, action) {
    const reduceFn = actionMap[action && action.type];
    if (reduceFn) {
      return reduceFn(state, action);
    }
    return state;
  };
}

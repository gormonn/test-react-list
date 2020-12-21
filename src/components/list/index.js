import React from "react";
import { connect } from "react-redux";
import {
  ITEM_GENERATE,
  ITEM_EDIT,
  ITEM_REMOVE,
  ITEM_ADD_UP,
  ITEM_ADD_DOWN,
  ITEM_SORT_ASC,
  ITEM_SORT_DESC
} from "./model";
import { Aux } from "../../utils";
import { WindowSizeContext } from "../../contexts/WindowSize";
import VirtualList from "./VirtualList";

class ListComponentApp extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      arraySize: props.array.length,
      filters: {
        label: null,
        value: null
      },
      sort: false
    };
    this.filterSave = this.filterSave.bind(this);
    this.filterApply = this.filterApply.bind(this);
    this.clearFilters = this.clearFilters.bind(this);
    this.sort = this.sort.bind(this);
    this.onChange = this.onChange.bind(this);
    this.generateArray = this.generateArray.bind(this);
  }
  onChange(e) {
    this.setState({
      arraySize: e.target.value
    });
  }
  generateArray(e) {
    e.preventDefault();
    this.props.dispatch({
      type: ITEM_GENERATE,
      size: this.state.arraySize
    });
  }
  componentWillReceiveProps(props) {
    if (props.array.length !== this.state.arraySize) {
      this.setState({ arraySize: props.array.length });
    }
  }
  filterApply() {
    let { filters } = this.state;
    let filteredArr = this.props.array.slice(0);
    for (let key in filters) {
      if (filters[key]) {
        filteredArr = filteredArr.filter(item => {
          return (
            item[key].toLowerCase().indexOf(filters[key].toLowerCase()) > -1
          );
        });
      }
    }
    return filteredArr;
  }
  filterSave(e) {
    //воткнуть debouncing
    //идеальная задача для service worker
    this.setState({
      filters: {
        ...this.state.filters,
        [e.target.name]: e.target.value || null
      }
    });
  }
  clearFilters() {
    let { filters } = this.state;
    let emptyFilters = {};
    for (let key in filters) {
      emptyFilters[key] = null;
    }
    this.setState({ filters: emptyFilters });
  }
  sort() {
    let type = this.state.sort ? ITEM_SORT_ASC : ITEM_SORT_DESC;
    this.setState({ sort: !this.state.sort }, () => {
      this.props.dispatch({ type });
    });
  }
  render() {
    let array = this.props.array;
    if (this.state.filters.label || this.state.filters.value) {
      array = this.filterApply();
    }
    return (
      <Aux>
        <form onSubmit={this.generateArray}>
          N:{" "}
          <input
            type="number"
            min="0"
            max="100000000"
            value={this.state.arraySize}
            onChange={this.onChange}
          />{" "}
          <button type="submit">Применить</button>
        </form>
        <input
          onInput={this.filterSave}
          value={this.state.filters.label || ""}
          name="label"
          placeholder="Фильтр по label"
        />
        <input
          onInput={this.filterSave}
          value={this.state.filters.value || ""}
          name="value"
          placeholder="Фильтр по value"
        />
        <button onClick={this.clearFilters}>Очистить фильтры</button>
        <button onClick={this.sort}>Сортировка</button>
        <WindowSizeContext.Consumer>
          {({ width, height }) => (
            <VirtualList
              className="List"
              width={width}
              height={height}
              itemCount={array.length}
              itemSize={35}
              overscanCount={2}
              direction="vertical"
              useIsScrolling={false}
            >
              {({ index, style }) => (
                <div className="list__row" style={style}>
                  <ListItem
                    {...{
                      ...array[index],
                      dispatch: this.props.dispatch
                    }}
                  />
                </div>
              )}
            </VirtualList>
          )}
        </WindowSizeContext.Consumer>
      </Aux>
    );
  }
}

class ListItem extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      label: props.label,
      value: props.value,
      label_temp: props.label,
      value_temp: props.value,
      index: props.index
    };
    this.edit = this.edit.bind(this);
    this.remove = this.remove.bind(this);
    this.save = this.save.bind(this);
    this.cancel = this.cancel.bind(this);
    this.addUp = this.addUp.bind(this);
    this.addDown = this.addDown.bind(this);
    this.onChange = this.onChange.bind(this);
  }
  save(e) {
    e.preventDefault();
    this.setState(
      {
        edit: false,
        label: this.state.label_temp,
        value: this.state.value_temp
      },
      () => {
        this.props.dispatch({
          type: ITEM_EDIT,
          index: this.props.index,
          label: this.state.label,
          value: this.state.value
        });
      }
    );
  }
  cancel() {
    this.setState({ edit: false });
  }
  edit() {
    this.setState({
      edit: true,
      label_temp: this.state.label,
      value_temp: this.state.value
    });
  }
  remove() {
    this.props.dispatch({
      type: ITEM_REMOVE,
      index: this.props.index
    });
  }
  addUp() {
    this.props.dispatch({
      type: ITEM_ADD_UP,
      index: this.props.index
    });
  }
  addDown() {
    this.props.dispatch({
      type: ITEM_ADD_DOWN,
      index: this.props.index
    });
  }
  onChange(e) {
    this.setState({ [`${e.target.name}_temp`]: e.target.value });
  }
  render() {
    let { edit, label, value, label_temp, value_temp } = this.state;
    if (edit)
      return (
        <form onSubmit={this.save}>
          <input name="label" onChange={this.onChange} value={label_temp} />:{" "}
          <input name="value" onChange={this.onChange} value={value_temp} />
          <button type="submit">Применить</button>
          <button onClick={this.cancel}>Отменить</button>
        </form>
      );
    return (
      <Aux>
        <span>{label}</span>: <span>{value}</span>{" "}
        <button onClick={this.edit}>Изменить</button>
        <button onClick={this.remove}>Удалить</button>
        <button onClick={this.addDown}>Добавить вниз</button>
        <button onClick={this.addUp}>Добавить вверх</button>
      </Aux>
    );
  }
}

function mapStateToProps(state) {
  return { ...state.list };
}

const ListComponent = connect(mapStateToProps)(ListComponentApp);
export default ListComponent;

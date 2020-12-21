import { model } from "../../utils";
import uniqid from "uniqid";
export const ITEM_ADD_UP = "ITEM_ADD_UP";
export const ITEM_ADD_DOWN = "ITEM_ADD_DOWN";
export const ITEM_REMOVE = "ITEM_REMOVE";
export const ITEM_EDIT = "ITEM_EDIT";
export const ITEM_SORT_ASC = "ITEM_SORT_ASC";
export const ITEM_SORT_DESC = "ITEM_SORT_DESC";
export const ITEM_GENERATE = "ITEM_GENERATE";

//const ARRAY_SIZE = 100;
const ARRAY_SIZE = 10000;
function createArrayBySize(size = null) {
  size = size ? size : ARRAY_SIZE;
  let array = new Array(size);
  let i = -1;
  while (++i < size) {
    //Если не индексировать строки в момент генерации,
    //то при фильтрации массива нет возможности узнать корректный индекс для манипуляций над записью.
    //(учитывая, что значения у нас могут быть не уникальные)
    //либо можно генерить не массив а объект, с идентификатором в качестве ключа:
    //[uniqkey]:{ label, value };
    //а при выводе делать Object.values()
    array[i] = { index: uniqid.time(), label: "L" + i, value: "V" + i };
  }
  return array;
}

const getIndex = (arr, index) =>
  arr.findIndex(obj => {
    return obj.index === index;
  });

export const reducer = model(
  {
    array: createArrayBySize()
  },
  {
    [ITEM_GENERATE](state, { size }) {
      let newArray = createArrayBySize(size);
      return { ...state, array: newArray };
    },
    [ITEM_ADD_UP](state, { index }) {
      let newArray = state.array.slice(0);
      newArray.splice(getIndex(state.array, index), 0, {
        index: uniqid.time(),
        label: "",
        value: ""
      });
      return { ...state, array: newArray };
    },
    [ITEM_ADD_DOWN](state, { index }) {
      let newArray = state.array.slice(0);
      newArray.splice(getIndex(state.array, index) + 1, 0, {
        index: uniqid.time(),
        label: "",
        value: ""
      });
      return { ...state, array: newArray };
    },
    [ITEM_REMOVE](state, { index }) {
      let newIndex = getIndex(state.array, index);
      let newArray = state.array
        .slice(0, newIndex)
        .concat(state.array.slice(newIndex + 1));
      return { ...state, array: newArray };
    },
    [ITEM_EDIT](state, { index, label, value }) {
      let newArray = state.array.slice(0);
      let newIndex = getIndex(state.array, index);
      newArray[newIndex] = { ...newArray[newIndex], label, value };
      return { ...state, array: newArray };
    },
    [ITEM_SORT_ASC](state) {
      let newArray = state.array.slice(0);
      let collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base"
      });
      newArray.sort(function(a, b) {
        return collator.compare(a.label, b.label);
      });
      return { ...state, array: newArray };
    },
    [ITEM_SORT_DESC](state) {
      let newArray = state.array.slice(0);
      let collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base"
      });
      newArray.sort(function(a, b) {
        return collator.compare(b.label, a.label);
      });
      return { ...state, array: newArray };
    }
  }
);

export default reducer;

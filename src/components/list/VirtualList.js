/**
 * Данный компонент является по своей сути клоном "react-window",
 * но с вырезанными Flow и гибким интерфейсом компонента
 * Оригинальные исходники компонента можно найти здесь:
 * https://github.com/bvaughn/react-window
 * Однако, первой библиотекой, которую открыл для себя
 * в рамках похожей задачи была "react-virtualized":
 * https://github.com/bvaughn/react-virtualized
 *
 * Я сознательно пошел на данный компромисс, учитывая что сам установил себе сроки.
 * К сожалению, пока не могу себе позволить интересную задачу такого объема в качестве тестового задания.
 *
 * Тестовое задание весьма вписывается в проект "ГИС Услуг".
 * Смог выделить меньше времени, чем хотел.
 */
import memoizeOne from "memoize-one";
import React from "react";

const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;
const getEstimatedTotalSize = ({ itemCount, itemSize }) => itemCount * itemSize;
const getStartIndexForOffset = ({ itemCount, itemSize }, offset) =>
  Math.max(0, Math.min(itemCount - 1, Math.floor(offset / itemSize)));

const getStopIndexForStartIndex = (
  { height, itemCount, itemSize, width },
  startIndex,
  scrollOffset
) => {
  const offset = startIndex * itemSize;
  const size = height;
  return Math.max(
    0,
    Math.min(
      itemCount - 1,
      startIndex + Math.floor((size + (scrollOffset - offset)) / itemSize)
    )
  );
};
const getOffsetForIndexAndAlignment = (
  { height, itemCount, itemSize, width },
  index,
  align,
  scrollOffset
) => {
  const size = height;
  const maxOffset = Math.min(itemCount * itemSize - size, index * itemSize);
  const minOffset = Math.max(0, index * itemSize - size + itemSize);

  switch (align) {
    case "start":
      return maxOffset;
    case "end":
      return minOffset;
    case "center":
      return Math.round(minOffset + (maxOffset - minOffset) / 2);
    case "auto":
    default:
      if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
        return scrollOffset;
      } else if (scrollOffset - minOffset < maxOffset - scrollOffset) {
        return minOffset;
      } else {
        return maxOffset;
      }
  }
};

export default class VirtualList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isScrolling: false,
      scrollDirection: "forward",
      scrollOffset:
        typeof this.props.initialScrollOffset === "number"
          ? this.props.initialScrollOffset
          : 0,
      scrollUpdateWasRequested: false
    };
  }

  scrollTo(scrollOffset) {
    this.setState(
      prevState => ({
        scrollDirection:
          prevState.scrollOffset < scrollOffset ? "forward" : "backward",
        scrollOffset: scrollOffset,
        scrollUpdateWasRequested: true
      }),
      this._resetIsScrollingDebounced
    );
  }

  scrollToItem(index, align = "auto") {
    const { scrollOffset } = this.state;
    this.scrollTo(
      getOffsetForIndexAndAlignment(
        this.props,
        index,
        align,
        scrollOffset,
        this._instanceProps
      )
    );
  }

  componentDidMount() {
    const { initialScrollOffset } = this.props;
    if (typeof initialScrollOffset === "number" && this._outerRef !== null) {
      this._outerRef.scrollTop = initialScrollOffset;
    }
    this._callPropsCallbacks();
  }

  componentDidUpdate() {
    const { scrollOffset, scrollUpdateWasRequested } = this.state;
    if (scrollUpdateWasRequested && this._outerRef !== null) {
      this._outerRef.scrollTop = scrollOffset;
    }
    this._callPropsCallbacks();
  }

  componentWillUnmount() {
    if (this._resetIsScrollingTimeoutId !== null) {
      clearTimeout(this._resetIsScrollingTimeoutId);
    }
  }

  render() {
    let {
      children,
      className,
      height,
      innerRef,
      itemCount,
      itemData,
      style,
      useIsScrolling,
      width
    } = this.props;
    let { isScrolling } = this.state;
    const onScroll = this._onScrollVertical;
    const [startIndex, stopIndex] = this._getRangeToRender();
    const items = [];
    if (itemCount > 0) {
      for (let index = startIndex; index <= stopIndex; index++) {
        items.push(
          React.createElement(children, {
            data: itemData,
            key: index,
            index,
            isScrolling: useIsScrolling ? isScrolling : undefined,
            style: this._getItemStyle(index)
          })
        );
      }
    }

    const estimatedTotalSize = getEstimatedTotalSize(
      this.props,
      this._instanceProps
    );

    return React.createElement(
      "div",
      {
        className,
        onScroll,
        ref: this._outerRefSetter,
        style: {
          position: "relative",
          height,
          width,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          willChange: "transform",
          ...style
        }
      },
      React.createElement("div", {
        children: items,
        ref: innerRef,
        style: {
          height: estimatedTotalSize,
          overflow: "hidden",
          pointerEvents: isScrolling ? "none" : "",
          width: "100%"
        }
      })
    );
  }

  _callOnItemsRendered = memoizeOne(
    (
      overscanStartIndex,
      overscanStopIndex,
      visibleStartIndex,
      visibleStopIndex
    ) =>
      this.props.onItemsRendered({
        overscanStartIndex,
        overscanStopIndex,
        visibleStartIndex,
        visibleStopIndex
      })
  );

  _callOnScroll = memoizeOne(
    (scrollDirection, scrollOffset, scrollUpdateWasRequested) =>
      this.props.onScroll({
        scrollDirection,
        scrollOffset,
        scrollUpdateWasRequested
      })
  );

  _callPropsCallbacks() {
    if (typeof this.props.onItemsRendered === "function") {
      const { itemCount } = this.props;
      if (itemCount > 0) {
        const [
          overscanStartIndex,
          overscanStopIndex,
          visibleStartIndex,
          visibleStopIndex
        ] = this._getRangeToRender();
        this._callOnItemsRendered(
          overscanStartIndex,
          overscanStopIndex,
          visibleStartIndex,
          visibleStopIndex
        );
      }
    }

    if (typeof this.props.onScroll === "function") {
      const {
        scrollDirection,
        scrollOffset,
        scrollUpdateWasRequested
      } = this.state;
      this._callOnScroll(
        scrollDirection,
        scrollOffset,
        scrollUpdateWasRequested
      );
    }
  }

  _getItemStyle = index => {
    const { direction, itemSize } = this.props;
    const itemStyleCache = this._getItemStyleCache(itemSize);

    let style;
    if (itemStyleCache.hasOwnProperty(index)) {
      style = itemStyleCache[index];
    } else {
      itemStyleCache[index] = style = {
        position: "absolute",
        left: 0,
        top: direction === "vertical" ? index * itemSize : 0,
        height: direction === "vertical" ? itemSize : "100%",
        width: "100%"
      };
    }
    return style;
  };

  _getItemStyleCache = memoizeOne(_ => ({}));

  _getRangeToRender() {
    const { itemCount, overscanCount } = this.props;
    const { scrollDirection, scrollOffset } = this.state;

    const startIndex = getStartIndexForOffset(
      this.props,
      scrollOffset,
      this._instanceProps
    );
    const stopIndex = getStopIndexForStartIndex(
      this.props,
      startIndex,
      scrollOffset,
      this._instanceProps
    );

    const overscanBackward =
      scrollDirection === "backward" ? Math.max(1, overscanCount) : 1;
    const overscanForward =
      scrollDirection === "forward" ? Math.max(1, overscanCount) : 1;

    return [
      Math.max(0, startIndex - overscanBackward),
      Math.max(0, Math.min(itemCount - 1, stopIndex + overscanForward)),
      startIndex,
      stopIndex
    ];
  }

  _onScrollVertical = event => {
    const { scrollTop } = event.currentTarget;
    this.setState(prevState => {
      if (prevState.scrollOffset === scrollTop) {
        return null;
      }

      return {
        isScrolling: true,
        scrollDirection:
          prevState.scrollOffset < scrollTop ? "forward" : "backward",
        scrollOffset: scrollTop,
        scrollUpdateWasRequested: false
      };
    }, this._resetIsScrollingDebounced);
  };

  _outerRefSetter = ref => {
    const { outerRef } = this.props;
    this._outerRef = ref;

    if (typeof outerRef === "function") {
      outerRef(ref);
    } else if (
      outerRef != null &&
      typeof outerRef === "object" &&
      outerRef.hasOwnProperty("current")
    ) {
      outerRef.current = ref;
    }
  };

  _resetIsScrollingDebounced = () => {
    if (this._resetIsScrollingTimeoutId !== null) {
      clearTimeout(this._resetIsScrollingTimeoutId);
    }

    this._resetIsScrollingTimeoutId = setTimeout(
      this._resetIsScrolling,
      IS_SCROLLING_DEBOUNCE_INTERVAL
    );
  };

  _resetIsScrolling = () => {
    this._resetIsScrollingTimeoutId = null;

    this.setState({ isScrolling: false }, () => {
      this._getItemStyleCache(-1);
    });
  };
}

import * as React from "react";
import t from "prop-types";
import { subscribe, combineReducers } from "./utils";

const Context = React.createContext({
  listen: console.log,
  emit: console.warn,
  store: {}
});
class ReactFlexContext extends React.Component {
  constructor(props) {
    super(props);
    this.emitter = {};

    // adding actions
    props.actions.map(this._addAction);

    this.reducer = props.reducer;

    this.state = props.initialValue || this.reducer({}, { type: "@@init" });
  }
  _addAction = fn => {
    if (Array.isArray(fn.eventName)) {
      fn.eventName.forEach(name => {
        subscribe(name, fn, this.emitter);
      });
    } else {
      subscribe(fn.eventName, fn, this.emitter);
    }
  };
  /**
   * emit action to be utelized by actionCreator or by UI
   */
  emit = (event, data) => {
    console.log("should emit event", this);
    if (!this.emitter[event]) return;
    console.log(event, data);
    this.emitter[event].map(async fn => {
      const action = await fn(event, data, this.emit, () => this.state);
      if (action && action.type) {
        // call reducer
        const newStore = this.reducer(this.state, action);
        this.setState(newStore);
      }
    });
  };

  /**
   * used by ui to listen to events
   */
  listen = (eventName, cb) => {
    return subscribe(eventName, cb, this.emitter);
  };

  componentDidUpdate() {
    this.props.onChange && this.props.onChange(this.state, this.stack);
  }

  render() {
    const { emit, listen } = this;
    return (
      <Context.Provider
        value={{
          store: this.state,
          emit,
          listen,
          selectors: this.props.selectors
        }}
      >
        {this.props.children}
      </Context.Provider>
    );
  }
}

ReactFlexContext.displayName = "Core";
ReactFlexContext.propTypes = {
  reducer: t.func.isRequired,
  actions: t.arrayOf(t.func).isRequired,
  onChange: t.func,
  initalValue: t.any
};
ReactFlexContext.defaultProps = {
  reducer: console.log,
  actions: [],
  onChange: console.info
};

const Connect = Context.Consumer;
const Provider = ReactFlexContext;

function __sdk(props, selector, passProps) {
  const { emit, listen, store } = props;
  const state = { emit, listen };
  if (selector)
    Object.assign(state, selector(store, props.selectors, passProps));
  else state.store = store;

  return state;
}
const withCore = Component =>
  React.forwardRef((props, ref) => (
    <Connect>
      {data => (
        <Component
          ref={ref}
          {...props}
          {...__sdk(data, Component.stateToProps, props)}
        />
      )}
    </Connect>
  ));

export {
  combineReducers,
  subscribe,
  withCore,
  Connect,
  ReactFlexContext as Provider
};
export default ReactFlexContext;
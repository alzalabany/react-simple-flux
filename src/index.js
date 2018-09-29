import * as React from "react";
import t from "prop-types";
import { subscribe, combineReducers } from "./utils";

const debug = console.log;
const Context = React.createContext({
  listen: console.log,
  emit: console.warn,
  store: {}
});

class ReactSimpleFlux extends React.Component {
  constructor(props) {
    super(props);
    this.emitter = {};

    // adding actions
    props.actions.map(this._addAction);

    this.reducer = props.reducer;

    this.state = this.reducer(props.initialState || {}, {
      type: "/simpleflux/@@init/"
    });
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
    return new Promise(resolve => {
      debug("should emit event", this);
      if (!this.emitter[event])
        return resolve({ ok: false, reason: "NO_LISTENERS" }); // no events listening !
      debug(event, data);
      this.emitter[event].map(async fn => {
        const action = await fn(event, data, this.emit, () => this.state);
        if (action && action.type) {
          // call reducer
          const newStore = this.reducer(this.state, action);
          this.setState(newStore);
          // @@BUG.. should setState once at end..
        }
      });
    });
  };

  /**
   * used by ui to listen to events
   */
  listen = (eventName, cb) => {
    return subscribe(eventName, cb, this.emitter);
  };

  componentDidUpdate() {
    // A hook for persisting to storage or whatever
    // --------------------------------------------
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

ReactSimpleFlux.displayName = "Core";
ReactSimpleFlux.propTypes = {
  reducer: t.func.isRequired,
  actions: t.arrayOf(t.func).isRequired,
  onChange: t.func,
  initalValue: t.any
};
ReactSimpleFlux.defaultProps = {
  reducer: console.log,
  actions: [],
  onChange: console.info
};

const Connect = Context.Consumer;

const withCore = Component => {
  const selectProps = Component.stateToProps;
  return React.forwardRef((props, ref) => {
    const extraProps =
      typeof selectProps === "function"
        ? selectProps(store, props.selectors)
        : { store, selectors };

    return (
      <Connect>
        {data => (
          <Component
            {...props}
            {...extraProps}
            ref={ref}
            emit={data.emit}
            listen={data.listen}
          />
        )}
      </Connect>
    );
  });
};

export {
  combineReducers,
  subscribe,
  withCore,
  Connect,
  ReactSimpleFlux as Provider
};
export default ReactSimpleFlux;

import * as React from 'react';
import { connectViaExtension, extractState } from 'remotedev';
import t from 'prop-types';
import { isFunction, subscribe, combineReducers, proxyArgToFns } from './utils';
import {INIT_ACTION} from './types';


const remotedev = connectViaExtension();
const noob = () => null;
const Context = React.createContext({
  listen: noob,
  emit: noob,
  store: {},
});

class ReactSimpleFlux extends React.Component {
  static defaultProps = {
    actions: [],
    reducer: () => console.warn('no reducer supplied'),
  };

  constructor(props) {
    super(props);
    this.emitter = {};

    // adding actions
    if (!props.actions || props.actions.length < 1) { console.warn('no actions supplied'); }

    Array.from(props.actions)
      .filter(i => !!i)
      .map(fn => subscribe(fn.eventName || '*', fn, this.emitter));

    this.reducer = props.reducer;

    this.state = this.reducer(props.initialState || {}, {
      type: INIT_ACTION,
    });

    remotedev.init(this.state, { name: 'iSchool Flux' });
  }

  componentDidMount() {
    // Subscribe to change state (if need more than just logging)
    remotedev.subscribe((message) => {
      // Helper when only time travelling needed
      const state = extractState(message);
      this.setState(state);
    });
  }

  componentDidUpdate() {
    // A hook for persisting to storage or whatever
    // @@todo: explore option to remove this and added it as callback to setState to avoid calling this on initalMount !
    // --------------------------------------------
    const { onChange } = this.props;

    if (isFunction(onChange)) {
      onChange(this.state);
    }
  }

  /**
   * return current AppState
   * @todo return a copy of state not actual, to prevent mutation.
   */
  getState = () => this.state;

  /**
   * emit action to be utelized by actionCreator or by UI
   */
   emit = (event, data = {}) => {
     let actionCreators = [];

     if (Array.isArray(this.emitter['*'])) {
       actionCreators = this.emitter['*'];
     }

     if (Array.isArray(this.emitter[event])) {
       actionCreators = actionCreators.concat(this.emitter[event]);
     }

     remotedev.send({ type: `@@${event}`, ...data }, this.state);

     const promises = actionCreators.map(
       async fn => await fn(event, data, this.emit, this.getState),
     );

     return new Promise(resolve => Promise.all(promises)
       .then(result => result.filter(r => r && typeof r.type === 'string'))
       .then(a => a.reduce((s, aa) => this.reducer(s, aa), this.state))
       .then((newState) => {
         // Send changes to the remote monitor
         remotedev.send({ type: event, ...data }, newState);

         // resolve promise
         if (newState && newState !== this.state) {
           this.setState(newState, () => resolve(this.state));
         } else {
           return resolve(newState);
         }
       })
       .catch((e) => {
         console.error(
           `something bad happened while executing event:${event}`,
           data,
         );
         console.info(promises, e);
         return resolve(this.state);
       }));
   };

  /**
   * used by ui to listen to events
   */
  listen = (eventName, cb) => subscribe(eventName, cb, this.emitter);


  render() {
    const { emit, listen, props } = this;

    return (
      <Context.Provider
        value={{
          store: this.state,
          emit,
          listen,
          selectors: props.selectors, // just a proxy to avoid import X form '../../../sdk/MODULE/selectors' shit..
        }}
      >
        {this.props.children}
      </Context.Provider>
    );
  }
}

ReactSimpleFlux.displayName = 'Core';
ReactSimpleFlux.propTypes = {
  reducer: t.func.isRequired,
  actions: t.arrayOf(t.func).isRequired,
  initalState: t.any,
  onChange: t.func,
};

const Connect = Context.Consumer;

function withFlux(Component) {
  return function WrapperComponent(props) {
    return (
      <Connect>
        {(data) => {
          const { store } = data;
          const selectors = proxyArgToFns(data.selectors, data.store);
          return (
            <Component
              {...props}
              {...(isFunction(Component.stateToProps)
                ? Component.stateToProps(store, selectors, props)
                : { store })}
              selectors={selectors}
              emit={data.emit}
              listen={data.listen}
            />
          );
        }}
      </Connect>
    );
  };
}

export {
  combineReducers,
  subscribe,
  withFlux,
  Connect,
  ReactSimpleFlux as Provider,
};
export default ReactSimpleFlux;

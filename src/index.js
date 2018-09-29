import * as React from "react";
import t from "prop-types";
import { subscribe, combineReducers } from "./utils";

const noob = ()=>null;
const Context = React.createContext({
  listen: noob,
  emit: noob,
  store: {}
});

class ReactSimpleFlux extends React.Component {

  constructor(props) {
    super(props);
    this.emitter = {};

    // adding actions
    props.actions.map(fn=>subscribe(fn.eventName, fn, this.emitter));

    this.reducer = props.reducer;

    this.state = this.reducer(props.initialState || {}, {
      type: "/simpleflux/@@init/"
    });
  }

  /**
   * return current AppState
   * @todo return a copy of state not actual, to prevent mutation.
   */
  getState = () => this.state;

  /**
   * emit action to be utelized by actionCreator or by UI
   */
  emit = (event, data) => {

      let actionCreators = [];

      if( Array.isArray(this.emitter['*']) ){
        actionCreators = this.emitter['*'];
      }

      if(Array.isArray(this.emitter[event])){
        actionCreators = actionCreators.concat(this.emitter[event]);
      }

      let promises = actionCreators.map(async fn => await fn(event, data, this.emit, this.getState) );

      return Promise.all(promises)
           .then(result=>result.filter(r=>r && typeof r.type==='string'))
           .then(actions=>actions.reduce((state, action)=>this.reducer(state, action),this.state)
           .then(newState=>{
            if(newState && newState !== this.state){
              this.setState(newState);
            }
            return newState;
           })
           .catch(e=>{
            console.error('something bad happened while executing event:'+event, data);
            console.info(promises);
           })
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
  initalState: t.any
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

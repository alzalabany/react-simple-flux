import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import SimpleFlux,{combineReducers} from 'react-simple-flux'

function countReducer(state=countReducer.initialState, action){
  console.log('reducing', state, action);

  if(action && action.type ==='add')
      return {
        count: state.count ? state.count + action.payload : action.payload
      }

  return state;
}
countReducer.initialState = {count:0};

const rootReducer = combineReducers({
  slice1: countReducer,
  nested: combineReducers({countReducer, countReducer2:countReducer})
});

function sample(event, data, emit, getState){
  emit('addStart');
  // do async stuff
  setTimeout(function() { emit('addEnd'); }, 1000);
  return {
    type: 'add',
    payload: data,
  }
}
sample.eventName = ['add', 'subtract'];

ReactDOM.render(<SimpleFlux reducer={rootReducer} actions={[console.warn, sample]}>
                  <App />
                </SimpleFlux>, document.getElementById('root'));
registerServiceWorker();

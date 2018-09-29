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
  const data = await new Promise(resolve=>{
    setTimeout(function() {
      emit('addEnd');
      resolve({
        type: 'add',
        payload: data,
      });
    }, 1000);
  })

  return data; // this will go to reducer
}
sample.eventName = ['add', 'subtract'];

function loggerExample(event, data){
  console.log('you emitteed an event named:'+event, data);

  // call api to store this event !!;
  // api.post('/log',{event, data});


  return null; // return null to avoid calling reducer or updating state;
}
sample.eventName = '*' // listen to all events :)

ReactDOM.render(<SimpleFlux reducer={rootReducer} actions={[loggerExample, sample]}>
                  <App />
                </SimpleFlux>, document.getElementById('root'));
registerServiceWorker();

# React Simple Flux

a simple -200line of code- Facebook Flux pattern implementation, just like Redux !.

it use React's 16.3 > new Contect Api mix it with Event Subscription model,to focus on separation of concerns while building modern complex react applications !

## Components

just like redux we have

### Action creator

it create an action (simple object with a type) and send it to the reducer.

### Reducer

receive an action and return a new version of App State

### Connected Component / smart+or-dump components

someone who responde to user actions by emitting an event !.

## So how it works ?

we give Action creators and connected components some super powers. so Typical life cycle is as so.

- _On UI part_ User Create An Event(click on button, or scroll, or whatever)
- Component Respond to that action by calling this.props.emit("EVENT_NAME",eventData);
- _On SDK side_ Actions listening for this "EVENT_NAME" will get triggered -asyncly-
- Action can Do 2 things now -since this can be async function-
  - return plain action -an object with type: prop-
  - emit another event (which will reset this cycle)
- Reducer receive event returned by ActionCreator and change state !
- All connected components get notified !

Why we think this is better ?

- UI designers now need to worry about just Emitting Events, no more complex bindActionCreator, or magical functions gets imported and injected into our component
- App developers can develope whole SDK in conjunction with backend, without worrying about front end or presentation.
- Its much faster -and safer- to run only reducers who subscribe to an event, not all reducers in chain !

## Example

_index.js_

```jsx
import { actions, rootReducer, selectors } from "./sdk";

// or whatever logic you want to persist !
const loadedFromDisk = JSON.parse(localStorage.myApp || "{}");
const saveToDisk = state =>
  localStorage.setItem("myApp", JSON.stringify(state));

React.Render(
  <Provider
    reducer={rootReducer}
    actions={actions}
    selectors={selectors}
    onChange={saveToDisk}
    initalState={loadedFromDisk}
  >
    <MyApp />
  </Provider>,
  rootEl
);
```

your sdk/index.js would look something like

```jsx
import Users from "./auth";
import Todos from "./todos";
import { combineReducers } from "react-simple-flux";

export const rootReducer = combineReducers({
  [User.types.mountKey]: Users.reducer,
  [Todos.types.mountKey]: Todos.reducer
});

export const selectors = [...Users.selectors, ...Todos.selectors];

export const actions = [...Users.actions, ...Todos.actions];
```

every time you create a new module inside sdk folder, just add a referenec for it in you sdk/index.js file so that it would be included in your app.

A module folder recommended folder structure would be

- index.js
- actions.js
- selectors.js
- types.js
- reducer.js

> Recommendation: create a small node/terminal tool that help you generate such boilerplate, for a better development experience !, we included a generator.js inside our ./src folder as an example.

index.js

```jsx
import reducer from "./reducer";
import actions from "./actions";
import * as selectors from "./selectors";
import * as types from "./types";

export default {
  reducer,
  actions,
  selectors,
  config
};
```

reducer.js

```jsx
import { ONLOAD } from "./types";
const initialState = {};

function userReducer(state = initialState, action, store) {
  return state;
}
userReducer.eventName = [ONLOAD];
userReducer.initialState = initialState;

export default userReducer;
```

actions.js

```jsx
import { ONLOAD } from "./types";
// import API from "../../api";

async function loadAction(eventName, data, emit, getState) {
  // - i can await an api call before i return !

  // -OR i can also re-emit an event
  // but careful not fall into a loop !

  // emit("API_STARTING",data);
  // const data = api.get();
  // emit("API_END",data);

  // very useful for showing spinner !

  return null; // since no object with {type:''} this will not trigger any reducer.
  // useful when api fail, no need to trigger reducers..

  // example if api success and you need to call reducers
  // return {
  //   type: ONLOAD,
  //   data: whatever
  // }
}
loadAction.eventName = ONLOAD;

export default [loadAction];
```

selectors.js

```jsx
```

## Todo

- consider moving logic to its own worker.
- improve HOC function, may be implementing `shouldComponentUpdate` if its proved to be worth it.

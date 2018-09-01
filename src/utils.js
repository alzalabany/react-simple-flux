export function subscribe(name, fn, eventStore) {
  if (Array.isArray(name)) return name.map(n => subscribe(n, fn, eventStore));

  if (!eventStore[name]) eventStore[name] = [];
  eventStore[name].push(fn);
  const idx = eventStore[name].length - 1;
  return () => eventStore[name].splice(idx, 1); // unsubscribe
}
export function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  return function combination(state = {}, action) {
    let hasChanged = false;
    const nextState = {};
    reducerKeys.forEach(key => {
      const reducer = reducers[key];
      const scope = reducer.eventName;
      const previousStateForKey = state[key];
      let nextStateForKey;
      if (scope && scope.indexOf(action.type) === -1) {
        nextStateForKey = previousStateForKey || reducer.initalState;
      } else {
        nextStateForKey = reducer(previousStateForKey, action, state);
      }

      if (typeof nextStateForKey === "undefined") {
        console.error("reducer returned undefined", key, scope, action);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    });
    return hasChanged ? nextState : state;
  };
}

export function subscribe(name, fn, eventStore) {
  if (Array.isArray(name)) return name.map(n => subscribe(n, fn, eventStore));

  if (!eventStore[name]) eventStore[name] = [];
  eventStore[name].push(fn);
  const idx = eventStore[name].length - 1;
  return () => eventStore[name].splice(idx, 1); // unsubscribe
}
export function combineReducers(reducers, debug) {
  const reducerKeys = Object.keys(reducers);
  const emptyState = {};
  return function combination(state = emptyState, action) {
    let hasChanged = false;
    const nextState = {};
    if (!action || typeof action.type !== "string") {
      console.error(
        "All actions must contain a type attribute, eg: { type: String, ... }, we will ignore your action",
        action,
        state
      );
      return state;
    }
    reducerKeys.forEach(key => {
      let nextStateForKey;
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const initalState = reducer.initalState || null;
      const scope = reducer.eventName;

      if (
        scope &&
        (scope !== action.type || scope.indexOf(action.type) === -1)
      ) {
        nextStateForKey = previousStateForKey || initalState;
      } else {
        nextStateForKey = reducer(previousStateForKey, action, state);
      }
      if (typeof nextStateForKey === "undefined") {
        console.error(
          "reducer named " +
            key +
            " returned undefined, you must return something !, we will just ignore your action for this key..."
        );
        nextStateForKey = previousStateForKey;
      }
      nextState[key] = nextStateForKey;
      if (debug) {
        if (nextStateForKey === previousStateForKey) {
          console.log(
            "Action of type " + action.type + " didNOT change your key:" + key,
            nextStateForKey
          );
        } else {
          console.log(
            "Action of type " + action.type + " changed your key:" + key
          );
          console.log("from", previousStateForKey);
          console.log("to", nextStateForKey);
        }
      }
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    });
    if (debug && hasChanged) {
      console.log("your state will change");
      console.log("from", state);
      console.log("to", nextState);
    }
    return hasChanged ? nextState : state;
  };
}

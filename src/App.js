import React, {Fragment, useRef, useState} from 'react';

let accessedProperties = [];
const derivationGraph = {};

const observable = (targetObject) => {
    const ObservableObject = {};

    const keys = Object.keys(targetObject);

    const id = Math.random();

    function getId(key) {
        return `Observable(${id}:${key})`;
    }

    keys.forEach(key => {
        const id = getId(key);

        ObservableObject[key] = targetObject[key];

        if (typeof targetObject[key] !== 'function') {
            Object.defineProperty(ObservableObject, key, {
                get() {
                    accessedProperties.push(id);

                    return targetObject[key];
                },

                set(value) {
                    targetObject[key] = value;

                    if (derivationGraph[id]) {
                        derivationGraph[id].forEach(fn =>  fn());
                    }
                }
            });
        }
    });

    return ObservableObject;
};

const createReaction = (whatShouldWeRunOnChange) => {
    return {
        track(fnWhereWeUseObservables) {
            accessedProperties = [];
            fnWhereWeUseObservables();

            console.log(derivationGraph);
            console.log(accessedProperties);

            accessedProperties.forEach(id => {
                derivationGraph[id] = derivationGraph[id] || [];

                if (derivationGraph[id].indexOf(whatShouldWeRunOnChange) < 0) {
                    derivationGraph[id].push(whatShouldWeRunOnChange);
                }
            });
        }
    }
};

const autorun = (cb) => {
    const reaction = createReaction(cb);

    reaction.track(cb);
};

const useForceUpdate = () => {
    const [, set] = useState(0);

    return () => set(val => val + 1);
};

const observer = (baseComponent) => {
    const Wrapper = () => {
        const forceUpdate = useForceUpdate();
        const reaction = useRef(null);

        if (!reaction.current) {
            reaction.current = createReaction(forceUpdate);
        }

        let result;

        reaction.current.track(() => {
            result = baseComponent();
        });

        return result;
    };

    return Wrapper;
};

const store = observable({
    count: 0,
    name: 'Unnamed',

    increment() {
        this.count += 1;
    }
});

autorun(() => {
    console.log('autorun count', store.count);
});

store.count = 1;

const App = () => {
    return (
        <Fragment>
            <h1>Counter {store.count}</h1>
            <button onClick={() => store.increment()}>Increment</button>
        </Fragment>
    );
};

export const ObserverApp = observer(App);

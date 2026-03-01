
export function forEachContiguousPair(array, fn) {
    "use strict";
    console.assert(array.length >= 2);
    for (let i = 0; i < array.length - 1; i++) {
        fn(array[i], array[i + 1]);
    }
}

export function buildEventTarget(name) {
    "use strict";
    const handlers = {};

    return {
        trigger(eventName, eventData) {
            if (handlers[eventName]) {
                handlers[eventName].forEach(handler => handler(eventData));
            }
        },
        on(eventName, handler) {
            if (!handlers[eventName]) {
                handlers[eventName] = [];
            }
            handlers[eventName].push(handler);
        },
        off(eventNameToRemove) {
            if (eventNameToRemove) {
                delete handlers[eventNameToRemove];
            } else {
                Object.keys(handlers).forEach(key => {
                    delete handlers[key];
                });
            }
        }
    };
}

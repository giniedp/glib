## Mouse input

The `Mouse` class tracks the mouse movement as well as pressed buttons.
Internally it listens to `mousemove`, `mousedown`, `mouseup` and `mousewheel` events and records
the state.

Additionally the mouse can be locked to an element ([see requestPointerLock](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock)). When locked, only mouse delta movements can be tracked but no cursor position.

In the example a simple DOM element (the red dot) is attached to the mouse coordinates
on each detected state change.


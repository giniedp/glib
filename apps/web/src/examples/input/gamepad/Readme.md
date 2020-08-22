# Gamepad input

The `Gamepads` class is a wrapper around the [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API).
Internally it listens for `gamepadconnected` (and `gamepaddisconnected`) events
and is able to automatically fetch current gamepad states.

Please connect a gamepad to your device to see the example.

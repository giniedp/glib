---
order: 0
---

# Overview

`@gglib/game` provides the basic building blocks for a real time application: an application host, a game loop and input handling.
It does not depend on a scene or entity model. `@gglib/components` builds on its loop and input classes.

## Game

`Game` is an optional base class that hosts an application. It creates the graphics `Device` and a `GameLoop`.
Subclasses override life cycle hooks:

- `onInitialize` runs once the device is ready.
- `onLoadContent` loads assets and is awaited before the loop starts.
- `onUpdate` and `onDraw` run every tick.
- `onUnloadContent` releases content when the game is destroyed.

## GameLoop

`GameLoop` drives updates and draws via `requestAnimationFrame`. It emits `onUpdate` and `onDraw` events with a `GameTime` that holds frame number, total time and delta time.
The loop runs with a variable time step by default. A fixed time step can be enabled for deterministic update logic. In that mode the loop catches up with multiple updates per frame and reports when it is running slowly.

## Input

`Keyboard`, `MouseInput` and `Gamepad` follow the same pattern. A state provider captures native browser input into a plain state object. The input class keeps the current and the previous state and is updated once per frame.
This allows simple queries like `isPressed` or `justPressed`.

Because state providers are replaceable, input can be captured on the main thread and transferred to a worker, for example with `MouseStateTransfer`.

`Gamepads`, `TouchPane` and `Orientation` are event based alternatives for game pad connections, touch and device orientation.

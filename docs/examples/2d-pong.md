---
aside: false
---

# Pong Game

This example implements the well known game Pong with the `ecs` package. It shows

- sprites without a texture as colored boxes
- an orthographic `CameraComponent` that fits the field into the view
- behavior components that read keyboard and gamepad input
- box colliders and collision events to bounce the ball

To play click on the game container so the iframe is focused
then use `W`/`S` keys to control the left paddle and `I`/`K`
keys to control the right paddle. Gamepads 1 and 2 work with the left stick.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

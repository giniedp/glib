---
title: Collision Debug Draw
aside: false
---

# Collision Debug Draw

The `DebugDrawSystem` draws lines and shapes in immediate mode. Call its methods during the update,
the lines are cleared at the start of each update tick. All lines are rendered with a single draw call.

- `line`, `ray`, `point` and `axes` for basic lines
- `box`, `orientedBox`, `sphere`, `cylinder` and `circle` for shapes, `volume` for any bounding volume
- `enabled` turns all drawing off, `depthTest: false` in the constructor draws on top of everything

The `CollisionSystem` uses it to draw the colliders when `debugDraw` is set. Colliders are green, overlapping
colliders are red. In this example there are no models, everything is drawn as debug lines: the colliders,
a floor grid, the axes of the ring entities and the collider under the mouse in yellow.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

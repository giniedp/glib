---
aside: false
---

# Ammo.js Physics

Integrates the [ammo.js](https://github.com/kripken/ammo.js) physics engine with the `ecs` package.

- click (without dragging) or press `Space` to shoot a ball
- drag with the left mouse button to look around, `W` `A` `S` `D` to move
- `Enter` resets the scene, the panel raises the wrecking ball

<Example src="game.ts" />

:::tabs variant:code
== example.ts
<ExampleCode src="game.ts"/>
== physics-proxy.ts
<ExampleCode src="physics-proxy.ts" />
== physics-constraints.ts
<ExampleCode src="physics-constraints.ts" />
== physics-world.ts
<ExampleCode src="physics-world.ts" />
== game-object.ts
<ExampleCode src="game-object.ts" />
:::

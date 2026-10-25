---
order: 0
---

# Overview

`@gglib/ecs` is a small entity component system. It has no dependency on graphics and only defines how entities, components and systems are organized.
Ready to use components and systems live in `@gglib/components`.

This is a general purpose ECS, designed for convenience over performance. It works well for examples, prototypes and small applications. It is not intended for serious games.

## World

The `GameWorld` holds all entities and systems. It drives the frame by calling `update` and `render` on its systems.
It also acts as a service container. Any object, for example the graphics device or a content loader, can be registered by type and looked up later.

## Entities

A `GameEntity` is a container for components. Entities are created with `world.createEntity`.
Parent and child relations are expressed through the transform component, so a hierarchy is formed by transforms, not by entities.

Entities follow a fixed life cycle:

- **initialize** runs once and lets components resolve references to other components and systems.
- **activate** and **deactivate** can be called multiple times, for example to pause or to stream regions in and out.
- **destroy** deactivates the entity and cleans up all components.

## Components

Components are plain class instances attached to an entity. They hold data and may implement the life cycle hooks `initialize`, `activate`, `deactivate` and `destroy`.
Components are looked up by type. A component can also be registered under an additional token, for example as the entity transform.

## Systems

A `GameSystem` implements logic that runs for many entities, with `update` and `render` called once per frame.
Systems are initialized in the order they are added. They can depend on other systems through the world.

The `order` of a system decides when it updates and renders, not the time it was added. `SystemOrder` names the
phases of a frame: `Input`, `Time`, `Default` (game logic, the default for custom systems), `Behavior`, `Physics`,
`Scene`, `Effects` and `Render`. Systems with the same order run in the order they were added, values in between
work too, e.g. `SystemOrder.Default + 1`.

```ts
class SteeringSystem extends GameSystem {
  // after the input, before the behaviors
  public override order = SystemOrder.Default
}
```

`EcsGame` calls `onCreate` at the start of `run()`, after the constructor of the game. Add custom systems there, the
game adds the default systems that are still missing.

## Queries

A query selects entities by their component types, with required, optional and rejected types.
Entities are grouped into archetypes by their set of component types, so queries only check archetypes, not individual entities. Queries are cached and stay up to date as entities change.
A query can be scoped to all, initialized or active entities.

## Components Package

`@gglib/components` builds on top of this package and connects it with the other gglib packages.
`EcsGame` creates a device, a world, a content loader and a renderer and runs the game loop. Components cover transforms, cameras, models, sprites, lights, particles, audio, collision and constraints.

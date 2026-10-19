---
title: Collision System
aside: false
---

# Collision System

The `CollisionSystem` detects overlapping `ColliderComponent`s and answers ray and overlap queries.
Collisions are only detected, never resolved: the system reports that two colliders touch, moving them apart
is up to the game logic. Use a physics engine if objects should bounce off each other.

A collider has one shape in local space of its entity: `sphere`, `box` or `cylinder` (along the local y axis).
Box and cylinder follow the rotation and scale of the entity. Use the helpers `sphereCollider`, `boxCollider`
and `cylinderCollider` to create them.

- `onCollisionEnter` and `onCollisionExit` are emitted on both entities. Exit is also emitted when a collider is disabled,
  deactivated or destroyed.
- `onCollisionStay` is emitted every frame while overlapping, only for colliders with `emitStay: true`.
- Two colliders are checked if `a.layer & b.mask` and `b.layer & a.mask` are both non zero. The entity hierarchy is ignored.
- `raycast`, `raycastAll`, `overlapPoint` and `overlapSphere` query the colliders, e.g. for picking with `CameraComponent.createRay`.

The system is not added by default. Add it in `onInitialize`, so it runs after the behaviors moved the entities.

In this example the moving sphere turns the shapes red while they overlap, the shape under the mouse turns yellow.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

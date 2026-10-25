---
title: Sprite Name Plates
aside: false
---

# Sprite Name Plates

Sprites are quads in 3D space, so they can be attached to any entity. Here every animal carries a name plate
with a health bar above its head while it walks around a field of blocks.

- The scenery is built from glTF block models. Each model is loaded once, every placement is an instance that shares
  its meshes and materials, so the renderer draws all blocks of a kind with one instanced draw.
- Each animal has its own model instance and an `AnimationPlayer` that loops the `walk` clip.

- The plate is a child entity with a `CopyRotationConstraint` that copies the world rotation of the camera,
  so the plate always faces the screen. The sprites are children of the plate and turn with it.
- The root of an animal only moves, the body is a separate child that turns towards the walking direction.
  This way the plate does not inherit the rotation of the body.
- All names are drawn once into a canvas, which becomes one texture. Each name sprite shows its region of that
  texture, so all names are one draw call. The health bars have no texture and are one more draw call.
- The fill of the health bar has its pivot at the left edge, the bar shrinks by setting its `width`.
  It sits slightly in front of the background, so both don't fight over the same depth.
- Plates write depth like all sprites, so they are hidden behind other characters and ordered correctly among each other.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

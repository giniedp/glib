---
title: Sprite Component
aside: false
---

# Sprite Component

A `SpriteComponent` draws a textured quad in the local XY plane of its entity. Position, rotation and scale come from
the entity transform. The component only holds data, the `SpriteSystem` renders all active sprites every frame, so
changing a field is all it takes.

- `setTexture(texture, x, y, width, height)` selects a region of a sprite sheet in pixels. Without a texture a white
  quad is drawn, tinted by `color`.
- `width` and `height` are in local units, `setSizeFromSource(pixelsPerUnit)` derives them from the source rectangle.
- Source rectangle and pivot are in image space, `(0, 0)` is the top left. The default pivot is the center,
  `setPivot(0.5, 1)` puts it at the feet.
- `setSlice(top, right, bottom, left)` turns the sprite into a 9-slice. The border size in local units is
  pixels / `pixelsPerUnit`, so borders keep their size when the sprite is resized.
- `tilesX` and `tilesY` repeat the image, or only the center of a 9-slice.
- `flipX` and `flipY` mirror the sprite around its center.

The `SpriteSystem` batches sprites by texture, each texture is one draw call. Sprites write depth and discard pixels
below the `alphaCutoff` (default `0.5`), so they are ordered by depth across textures. Move the blue circle in the
example to see it. The system is added by `EcsGame` by default.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

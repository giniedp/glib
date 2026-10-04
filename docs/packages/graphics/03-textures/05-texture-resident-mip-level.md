---
title: Resident Mip Level
aside: false
order: 50
---

# Resident Mip Level

`texture.residentMipLevel` marks the first mip level of a texture that holds
data, for example while a streamed texture has only loaded its smaller levels.
When the texture is bound, sampling is limited to the levels from there on, so
the missing larger levels are never read. A single sprite is drawn as a tiled
plane, with a camera matrix instead of the screen projection. The camera looks
along the plane, so all mip levels are visible at once. Raise the resident mip
level and watch the detail near the camera disappear.

The level is read when the texture is set on a program, so the texture must be
set again after every change. The `SpriteBatch` does this on every draw
already.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

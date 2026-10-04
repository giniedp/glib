---
title: Texture Subresource
aside: false
order: 40
---

# Texture Subresource

`texture.subresource(baseMipLevel, mipLevelCount)` returns a `TextureView` on a
range of mip levels that can be bound to a shader input instead of the whole
texture. Here a mipmapped texture is drawn with a `SpriteBatch`, one sprite per
mip level, each sprite using the view of a different level.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

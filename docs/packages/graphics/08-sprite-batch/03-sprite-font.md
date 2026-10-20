---
title: Sprite Font
aside: false
order: 30
---

# Sprite Font

A `SpriteFont` is a bitmap font in the spirit of XNA: one texture with all glyphs, plus the metrics to place them.
`createSpriteFont` generates it at runtime by drawing the characters with canvas, so any CSS font works, including web
fonts (it waits until they are loaded).

```ts
const font = await createSpriteFont(device, { family: 'Georgia', size: 32, kerning: true })

spriteBatch.begin()
spriteBatch.drawString(font, 'Hello World', 20, 20, Color.White)
spriteBatch.end()
```

- `drawString(font, text, x, y, color, { originX, originY, scale, rotation, depth })` adds one sprite per character.
  The origin is given in unscaled text pixels and lands on `x, y`. Scale and rotation are applied around it.
- `measureString(text)` returns the width of the widest line and the height of all lines, e.g. to center text with
  `originX = size.x / 2`.
- `\n` starts a new line, `lineSpacing` is the distance between lines and `spacing` adds space between characters.
- `characters` limits the generated glyphs, ASCII by default. Missing characters are drawn as `defaultCharacter`
  (`?`), or skipped if it is `null`.
- `kerning: true` measures all character pairs once, `outline` strokes the glyphs in a fixed color.

The glyphs are white, so the color tints them. Draw with alpha blending. Bitmap text gets blurry when it is scaled
up, so generate the font at the size it is shown with and keep `scale` around `1`.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

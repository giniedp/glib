# Shader Annotations

Glib allows to annotate the GLSL code with special comments to add metadata
to `uniform` declarations. The annotation must
be in a comment right before the `uniform` declaration e.g.

```
// @binding view
uniform mat4 uView;
```

This will change the name of the uniform in javascript world, so instead
setting the variable by its uniform name

```
program.setUniform(`uView`, view)
```

we have to use its annotated binding name

```
program.setUniform(`view`, view)
```

The following annotations are available

**@binding**
Changes a uniforms accessor in javascript as seen above.

**@default**
Sets a default value on the uniform. Vectors must be set with an array suntax

```
// @default [1, 1, 1]
uniform vec3 uColor;
```

**@filter**
Usable for texture samplers only and allows to define a default sampling method e.g.

```glsl
// @filter LinearWrap
uniform sampler2d uTexture
```

**@register**
Usable for texture samplers only and allows to define the default sampler register for a texture

```glsl
// @register 2
uniform sampler2d uTexture;
```

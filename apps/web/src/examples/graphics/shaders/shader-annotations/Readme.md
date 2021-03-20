## Shader Annotations

Glib allows to annotate the GLSL code with special comments to add metadata
to `uniform` declarations. The annotation must
be in a comment right before the `uniform` declaration for example:

```
// @binding view
uniform mat4 uView;
```

This adds the metadata `binding` with the value `view` to that uniform

The following annotations are available

**@binding**
Changes a uniforms name to the given value as seen above.

```
// @binding view
uniform mat4 uView;
```

Now in javascrip instead of using `uView` we can set the uniform by its binding name `view`

```
program.setUniform(`view`, value)
```

**@default**
Sets a default value on the uniform. Vectors must be set with an array syntax

```
// @default [1, 1, 1]
uniform vec3 uColor;
```

**@filter**
Sets a samling method (texture samplers only)

```glsl
// @filter LinearWrap
uniform sampler2d uTexture
```

**@register**
Assigns a register index to a texture sampler

```glsl
// @register 2
uniform sampler2d uTexture;
```

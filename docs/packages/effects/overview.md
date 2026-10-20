---
order: 0
---

# Overview

`@gglib/effects` is a collection of ready to use shaders and materials built on top of `@gglib/graphics`.
Most effects ship with a GLSL and a WGSL implementation and run on both backends.
The package is a work in progress. The set of effects grows over time.

## Materials

Materials are drawn with geometry. They expose their inputs as typed properties.

- `CommonMaterial` is the general purpose PBR material. It supports texture maps, lights, fog and image based lighting. Most features are toggled by flags.
- Smaller materials cover special cases, for example a skybox or debug lines.
- `SpriteMaterial` and `ParticleMaterial` are the counterparts for sprites and particles.

## Image Effects

Image effects read one texture and write into another texture or the screen. Each effect does one job and is configured by plain properties and an operator.
They are meant to be chained into a post processing pipeline, for example bloom:

extract → downsample → upsample → combine → tonemap

Other effects cover tasks like MSAA resolve, anti aliasing or a vignette.

## Precomputation

Some effects generate textures once, instead of every frame.

- **Image based lighting.** Converts a panorama into a cubemap and filters it into irradiance and radiance maps. Also generates the BRDF lookup table.
- **Atmosphere.** Renders a physically based sky that can serve as background and as IBL source.

## Lifetime

Effects own their shader programs and follow the resource ownership of `@gglib/graphics`.
Shader modules are shared between instances of the same effect.

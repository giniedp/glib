---
title: HDR Pipeline
order: 100
aside: false
---

# HDR Pipeline

Shows how to compose the individual post processing effects (`ExtractEffect`, `DownsampleEffect`,
`UpsampleEffect`, `CombineEffect`, `TonemapEffect`) into a full bloom + tonemap pipeline:

1. **Scene** - the HDR source texture is drawn into a floating point render target.
2. **Extract** - bright pixels above a threshold are cut out (the "glow").
3. **Downsample / Upsample** - the extracted glow is repeatedly downsampled, then upsampled back up
   again, blending each step additively. This dual filtering approach produces a cheap, wide blur.
4. **Combine** - the blurred glow is added back onto the original scene.
5. **Tonemap** - the combined HDR result is mapped down to displayable LDR output.

The `output` dropdown lets you inspect the texture at each stage. Every stage writes into its own
render target - more than a real pipeline would need - purely so the intermediate buffers can be
selected and viewed here.

:::tabs
== WebGPU
<Example platform="webgpu" />
== WebGL
<Example platform="webgl2" />
:::

## Source

<ExampleCode />

import { TonemapOperator } from '@gglib/effects'
import {
  BlendState,
  Color,
  CommonInputs,
  FALSE,
  RenderVariant,
  TextureUsage,
  TRUE,
  type Device,
  type TextureDescriptor,
} from '@gglib/graphics'
import {
  bloomPass,
  FxaaPass,
  groupPass,
  RenderChannel,
  renderChannel,
  renderInputsPass,
  RenderItemFlags,
  RenderListMode,
  RenderSortPriority,
  tonemapPass,
  type RenderPass,
  type RenderPipelineOptions,
} from '@gglib/render'
import { InputSlots, MaterialLayerMasks, NwRenderVariant } from '../material'
import { GBUFFER_DESCRIPTORS, GBufferChannel } from './GBufferChannels'
import { describePass, optionalPass } from './PassInfo'
import { GBufferDebugPass } from './passes/gbuffer/GBufferDebugPass'
import { CopyPass, NwCopyChannel } from './passes/CopyPass'
import { GeometryPass } from './passes/GeometryPass'
import { LightingPass } from './passes/lighting/LightingPass'
import { MaterialDebugPass } from './passes/MaterialDebugPass'
import { SmaaPass } from './passes/smaa/SmaaPass'
import { Cmaa2Pass } from './passes/cmaa2/Cmaa2Pass'
import { FilmMappingPass } from './passes/filmmapping/FilmMappingPass'
import { LuminancePass } from './passes/exposure/LuminancePass'
import { FogPass } from './passes/fog/FogPass'
import { SunShaftsPass } from './passes/sunshafts/SunShaftsPass'
import { NwRenderChannel, XeGtaoPass } from './passes/ssao/XeGtaoPass'

const WATER_VOLUME_LIST = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, {
  includeLayers: MaterialLayerMasks.WaterVolume,
})
const TRANSPARENT_LIST = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, {
  excludeLayers: MaterialLayerMasks.WaterVolume,
})

/**
 * Opaque items without a GBuffer effect (sky, unlit, debug), drawn forward after the deferred lighting
 */
const FORWARD_OPAQUE_LIST = new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque, {
  excludeVariant: RenderVariant.GBuffer,
})

/**
 * Scratch target for the linear depth output of transparent materials.
 * Transparent materials write a second (linear depth) output, which needs an attachment, but nothing reads it.
 * It can't be LinearDepth, which they sample.
 */
const TransparentLinearDepth = renderChannel('nw_transparent_linear_depth')
const TRANSPARENT_LINEAR_DEPTH_DESC: Readonly<TextureDescriptor> = {
  name: 'NwRenderChannel.TransparentLinearDepth',
  type: '2d',
  format: 'r32float',
  width: 1,
  height: 1,
  depth: 1,
  sampleCount: 1,
  mipLevelCount: 1,
  usage: TextureUsage.RenderTarget | TextureUsage.TextureBinding,
}

/**
 * The viewer pipeline in the order of the game's frame (tmp/render-pipeline/plan.md, "Target pipeline"):
 * GBuffer → AO → deferred lighting → forward opaque leftovers → fog → transparents → post
 */
export function createRenderPipeline(device: Device): RenderPipelineOptions {
  const sunShafts = new SunShaftsPass(device)
  const luminance = new LuminancePass(device)

  const passes: RenderPass[] = [
    describePass(
      renderInputsPass({
        name: 'OpaqueInputs',
        // fog is applied by the FogPass
        values: [[InputSlots.Global.SkipFog, TRUE]],
      }),
      { note: 'opaque materials skip fog, the fog pass applies it' },
    ),
    groupPass({ name: 'Opaque', passes: createOpaquePasses(device) }),
    describePass(
      renderInputsPass({
        name: 'SceneInputs',
        textures: [
          [CommonInputs.View.SceneColorMap, RenderChannel.Color],
          [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
        ],
      }),
      { note: 'binds Color and LinearDepth as scene inputs' },
    ),
    optionalPass(new FogPass(device)),
    describePass(new MaterialDebugPass(), {
      note: 'material debug views of opaque surfaces, runs while a debug output is selected',
    }),
    groupPass({ name: 'Transparent', passes: createTransparentPasses(device) }),
    // mask and blur from the HDR scene
    optionalPass(sunShafts.generate, sunShafts),
    // scene luminance for the exposure of the film mapping, measured before bloom like the game
    describePass(luminance, { note: 'scene luminance for the film mapping exposure' }),
    optionalPass(
      bloomPass(device, {
        enabled: true,
        threshold: 1.5,
        knee: 0.5,
        intensity: 0.6,
        steps: 10,
        mode: 'jimnez',
      }),
    ),
    new FilmMappingPass(
      device,
      tonemapPass(device, {
        enabled: true,
        exposure: 1,
        operator: TonemapOperator.ACES_NARKOWICZ,
        whitePoint: 10.0,
        srgb: true,
      }),
      luminance,
    ),
    // blended into the tone mapped image, like the HDR final pass of the original
    describePass(sunShafts.apply, { note: 'blends the sun shafts into the image, toggled with Sun Shafts' }),
    // post AA on the final image, like the game's SMAA after its tonemap. The config `antialiasing` enables one of them.
    describePass(new SmaaPass(device), { note: 'toggled by the config antialiasing' }),
    describePass(new FxaaPass(device, { name: 'FXAA', quality: 0.5 }), { note: 'toggled by the config antialiasing' }),
    describePass(new Cmaa2Pass(device), { note: 'toggled by the config antialiasing' }),
    // shows a decoded attribute of the scene GBuffer in place of the image
    optionalPass(
      new GBufferDebugPass(device, {
        enabled: false,
        a: GBufferChannel.A,
        b: GBufferChannel.B,
        c: GBufferChannel.C,
        linearDepth: RenderChannel.LinearDepth,
      }),
    ),
  ]
  return { passes }
}

/**
 * Deferred opaque stage, in the game's order:
 * 1. GBuffer pass, writes GBuffer A/B/C, LinearDepth (0 without geometry) and Depth
 * 2. AO from the depth and the GBuffer normals
 * 3. lighting: lights the GBuffer, applies the AO, writes Color
 * 4. emissive variant
 * 5. forward opaque items: the sky (writes the far plane into LinearDepth where no geometry is), unlit, debug
 */
function createOpaquePasses(device: Device): RenderPass[] {
  return [
    new GeometryPass({
      name: 'GBufferPass',
      list: RenderListMode.Opaque,
      variant: RenderVariant.GBuffer,
      depth: RenderChannel.Depth,
      clearDepth: true,
      descriptors: GBUFFER_DESCRIPTORS,
      channels: [
        { clear: Color.TransparentBlack, render: GBufferChannel.A },
        { clear: Color.TransparentBlack, render: GBufferChannel.B },
        { clear: Color.TransparentBlack, render: GBufferChannel.C },
        { clear: Color.TransparentBlack, render: RenderChannel.LinearDepth },
      ],
    }),
    // AO before the lighting (plan phase 5), from the depth and the GBuffer normals
    optionalPass(new XeGtaoPass(device, { normals: GBufferChannel.A })),
    new LightingPass(device, {
      a: GBufferChannel.A,
      b: GBufferChannel.B,
      c: GBufferChannel.C,
      linearDepth: RenderChannel.LinearDepth,
      ao: NwRenderChannel.AmbientOcclusion,
      output: RenderChannel.Color,
    }),
    // emittance of the opaque surfaces, the materials with emittance register the variant
    optionalPass(
      new GeometryPass({
        name: 'EmissivePass',
        list: RenderListMode.Opaque,
        variant: NwRenderVariant.Emissive,
        depth: RenderChannel.Depth,
        clearDepth: false,
        channels: [{ clear: null, render: RenderChannel.Color, blend: BlendState.AdditivePure }],
      }),
    ),
    optionalPass(
      new GeometryPass({
        name: 'ForwardOpaquePass',
        list: FORWARD_OPAQUE_LIST,
        depth: RenderChannel.Depth,
        clearDepth: false,
        channels: [
          { clear: null, render: RenderChannel.Color },
          { clear: null, render: RenderChannel.LinearDepth },
        ],
      }),
    ),
  ]
}

function createTransparentPasses(device: Device): RenderPass[] {
  return [
    // the transparent passes render into Color, so they sample a copy
    describePass(new CopyPass(device, { name: 'SceneColorCopy', input: RenderChannel.Color }), {
      note: 'copy of the scene color that transparent materials sample',
    }),
    describePass(
      renderInputsPass({
        name: 'TransparentInputs',
        values: [[InputSlots.Global.SkipFog, FALSE]],
        textures: [
          [CommonInputs.View.SceneColorMap, NwCopyChannel.SceneColor],
          [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
        ],
      }),
      { note: 'transparent materials apply fog, binds scene color and depth' },
    ),
    // water volumes (rivers) before all other transparent geometry, like the WATER_VOLUMES list of the original
    // that is rendered before the TRANSPARENT_AW list. Waterfalls and other transparent meshes end up on top.
    optionalPass(
      groupPass({
        name: 'Water Volumes',
        enabled: true,
        passes: [createTransparentPass('WaterVolumePass', WATER_VOLUME_LIST)],
      }),
    ),
    createTransparentPass('TransparentPass', TRANSPARENT_LIST),
  ]
}

function createTransparentPass(name: string, list: RenderListMode) {
  return new GeometryPass({
    name,
    list,
    depth: RenderChannel.Depth,
    clearDepth: false, // render on top
    inputs: [NwCopyChannel.SceneColor, RenderChannel.LinearDepth],
    descriptors: { [TransparentLinearDepth]: TRANSPARENT_LINEAR_DEPTH_DESC },
    channels: [
      {
        clear: null, // render on top
        render: RenderChannel.Color,
        blend: BlendState.Alpha,
      },
      {
        // cleared by each pass (content is never read), so the passes don't depend on each other
        clear: Color.TransparentBlack,
        render: TransparentLinearDepth,
        blend: BlendState.Opaque,
      },
    ],
  })
}

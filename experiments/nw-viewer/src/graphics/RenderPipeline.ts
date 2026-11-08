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
  groupPass,
  RenderChannel,
  renderChannel,
  renderInputsPass,
  RenderItemFlags,
  RenderListMode,
  RenderSortPriority,
  tonemapPass,
  type GroupPass,
  type RenderPass,
  type RenderPipelineOptions,
} from '@gglib/render'
import { InputSlots, MaterialLayerMasks, NwRenderVariant } from '../material'
import { GBUFFER_DESCRIPTORS, GBufferChannel } from './GBufferChannels'
import { GBufferDebugPass } from './passes/gbuffer/GBufferDebugPass'
import { CopyPass, NwCopyChannel } from './passes/CopyPass'
import { DepthMsaaResolvePass } from './passes/DepthMsaaResolvePass'
import { DepthResolveEffect } from './passes/DepthResolveEffect'
import { GeometryPass } from './passes/GeometryPass'
import { LightingPass } from './passes/lighting/LightingPass'
import { FilmMappingPass } from './passes/filmmapping/FilmMappingPass'
import { LuminancePass } from './passes/exposure/LuminancePass'
import { FogPass, type FogPassTarget } from './passes/fog/FogPass'
import { AmbientOcclusionApplyPass } from './passes/ssao/AmbientOcclusionApplyPass'
import { SunShaftsPass } from './passes/sunshafts/SunShaftsPass'
import { XeGtaoPass } from './passes/ssao/XeGtaoPass'

export type MsaaSamples = 1 | 4

const WATER_VOLUME_LIST = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, {
  includeLayers: MaterialLayerMasks.WaterVolume,
})
const TRANSPARENT_LIST = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, {
  excludeLayers: MaterialLayerMasks.WaterVolume,
})

/**
 * Scratch target for the linear depth output of transparent materials without MSAA.
 * Transparent materials write a second (linear depth) output, which needs an attachment, but nothing reads it
 * (with MSAA it goes into the unresolved LinearDepthMsaa). It can't be LinearDepth, which they sample.
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
 * The render targets of the scene geometry for one MSAA sample count
 */
interface SceneTargets {
  /**
   * Targets the geometry is rendered into
   */
  color: RenderChannel
  linearDepth: RenderChannel
  depth: RenderChannel
  /**
   * Single sample targets the geometry targets are resolved into (null: rendered into them directly)
   */
  resolveColor: RenderChannel | null
  resolveLinearDepth: RenderChannel | null
  /**
   * Color channels that hold the opaque scene and receive AO and fog
   */
  sceneColors: RenderChannel[]
  /**
   * Color + linear depth pairs the fog is applied to
   */
  fog: FogPassTarget[]
  /**
   * Scene color input of transparent materials. Must not be the channel they render into.
   */
  sceneColorInput: RenderChannel
  /**
   * Target of the second (linear depth) output of transparent materials, and its clear
   */
  transparentLinearDepth: RenderChannel
  transparentLinearDepthClear: Color | null
}

const MSAA_TARGETS: SceneTargets = {
  color: RenderChannel.ColorMsaa,
  linearDepth: RenderChannel.LinearDepthMsaa,
  depth: RenderChannel.DepthMsaa,
  resolveColor: RenderChannel.Color,
  resolveLinearDepth: RenderChannel.LinearDepth,
  sceneColors: [RenderChannel.ColorMsaa, RenderChannel.Color],
  fog: [
    { color: RenderChannel.ColorMsaa, depth: RenderChannel.LinearDepthMsaa },
    { color: RenderChannel.Color, depth: RenderChannel.LinearDepth },
  ],
  sceneColorInput: RenderChannel.Color,
  transparentLinearDepth: RenderChannel.LinearDepthMsaa,
  transparentLinearDepthClear: null, // render on top
}

const SINGLE_TARGETS: SceneTargets = {
  color: RenderChannel.Color,
  linearDepth: RenderChannel.LinearDepth,
  depth: RenderChannel.Depth,
  resolveColor: null,
  resolveLinearDepth: null,
  sceneColors: [RenderChannel.Color],
  fog: [{ color: RenderChannel.Color, depth: RenderChannel.LinearDepth }],
  sceneColorInput: NwCopyChannel.SceneColor,
  transparentLinearDepth: TransparentLinearDepth,
  // cleared by each pass (content is never read), so the passes don't depend on each other
  transparentLinearDepthClear: Color.TransparentBlack,
}

/**
 * How opaque geometry is lit
 * - forward: lit by the materials in one geometry pass
 * - deferred: GBuffer pass, lighting compute pass, forward pass for opaque items without a GBuffer effect
 */
export type PipelineMode = 'forward' | 'deferred'

export interface PipelineState {
  msaa: MsaaSamples
  pipeline: PipelineMode
}

/**
 * Opaque items without a GBuffer effect (unlit, debug), drawn forward after the deferred lighting
 */
const FORWARD_OPAQUE_LIST = new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque, {
  excludeVariant: RenderVariant.GBuffer,
  excludeLayers: MaterialLayerMasks.Sky,
})

/**
 * The sky, drawn before the deferred lighting, which composes it into pixels and samples without geometry
 */
const SKY_LIST = new RenderListMode(RenderSortPriority.State, RenderItemFlags.Opaque, {
  excludeVariant: RenderVariant.GBuffer,
  includeLayers: MaterialLayerMasks.Sky,
})

/**
 * GBuffer targets of the deferred pipeline for one MSAA sample count
 */
interface DeferredTargets {
  samples: MsaaSamples
  a: RenderChannel
  b: RenderChannel
  c: RenderChannel
  linearDepth: RenderChannel
  depth: RenderChannel
}

const DEFERRED_MSAA_TARGETS: DeferredTargets = {
  samples: 4,
  a: GBufferChannel.AMsaa,
  b: GBufferChannel.BMsaa,
  c: GBufferChannel.CMsaa,
  linearDepth: RenderChannel.LinearDepthMsaa,
  depth: RenderChannel.DepthMsaa,
}

const DEFERRED_SINGLE_TARGETS: DeferredTargets = {
  samples: 1,
  a: GBufferChannel.A,
  b: GBufferChannel.B,
  c: GBufferChannel.C,
  linearDepth: GBufferChannel.LinearDepth,
  depth: RenderChannel.Depth,
}

/**
 * Switches pass groups at runtime: MSAA or single sampled scene targets, forward or deferred opaque lighting.
 * The frame graph is built each frame from the enabled passes, so toggling needs no rebuild.
 */
export class PipelineSwitch {
  private groups: Array<{ group: GroupPass; active: (state: PipelineState) => boolean }> = []
  private current: PipelineState

  public constructor(state: PipelineState) {
    this.current = { ...state }
  }

  public get state(): Readonly<PipelineState> {
    return this.current
  }

  /**
   * Sample count of the scene targets
   */
  public get samples(): MsaaSamples {
    return sceneSamples(this.current)
  }

  /**
   * Creates a group with the MSAA and the single sampled variant of the passes, of which only one is enabled.
   * Selects by the configured MSAA, for the geometry of the deferred GBuffer.
   */
  public selectMsaa(name: string, msaa: RenderPass[], single: RenderPass[]): GroupPass {
    return groupPass({
      name,
      passes: [
        this.track(`${name} MSAA`, (it) => it.msaa === 4, msaa),
        this.track(`${name} No MSAA`, (it) => it.msaa === 1, single),
      ],
    })
  }

  /**
   * Creates a group with the MSAA and the single sampled variant of the passes, of which only one is enabled.
   * Selects by the sample count of the scene targets ({@link samples}).
   */
  public select(name: string, msaa: RenderPass[], single: RenderPass[]): GroupPass {
    return groupPass({
      name,
      passes: [
        this.track(`${name} MSAA`, (it) => sceneSamples(it) === 4, msaa),
        this.track(`${name} No MSAA`, (it) => sceneSamples(it) === 1, single),
      ],
    })
  }

  /**
   * Creates a group with the passes of each pipeline mode, of which only one is enabled
   */
  public selectPipeline(name: string, forward: RenderPass[], deferred: RenderPass[]): GroupPass {
    return groupPass({
      name,
      passes: [
        this.track(`${name} Forward`, (it) => it.pipeline === 'forward', forward),
        this.track(`${name} Deferred`, (it) => it.pipeline === 'deferred', deferred),
      ],
    })
  }

  public set(state: Partial<PipelineState>) {
    Object.assign(this.current, state)
    for (const it of this.groups) {
      it.group.enabled = it.active(this.current)
    }
  }

  private track(name: string, active: (state: PipelineState) => boolean, passes: RenderPass[]) {
    const group = groupPass({ name, passes, enabled: active(this.current) })
    this.groups.push({ group, active })
    return group
  }
}

/**
 * Sample count of the scene targets after the opaque geometry. The deferred pipeline resolves in the lighting pass
 * and renders everything after it single sampled (plan step 4.3), only its GBuffer is multisampled.
 */
function sceneSamples(state: PipelineState): MsaaSamples {
  return state.pipeline === 'deferred' ? 1 : state.msaa
}

export interface NwRenderPipelineOptions {
  /**
   * Initial MSAA sample count of the scene geometry. WebGPU supports 1 and 4.
   */
  msaa?: MsaaSamples
  /**
   * Initial pipeline mode. Defaults to forward.
   */
  pipeline?: PipelineMode
}

export interface NwRenderPipeline extends RenderPipelineOptions {
  /**
   * Toggles MSAA and the pipeline mode at runtime
   */
  modes: PipelineSwitch
}

export function createRenderPipeline(device: Device, options?: NwRenderPipelineOptions): NwRenderPipeline {
  const modes = new PipelineSwitch({ msaa: options?.msaa ?? 4, pipeline: options?.pipeline ?? 'forward' })
  const multi = createScenePasses(device, MSAA_TARGETS)
  const single = createScenePasses(device, SINGLE_TARGETS)
  const sunShafts = new SunShaftsPass(device)
  const luminance = new LuminancePass(device)

  const passes: RenderPass[] = [
    renderInputsPass({
      name: 'OpaqueInputs',
      // fog is applied by the FogPass
      values: [[InputSlots.Global.SkipFog, TRUE]],
    }),
    modes.selectPipeline(
      'Opaque',
      [modes.select('Forward Opaque', multi.opaque, single.opaque)],
      [
        modes.selectMsaa(
          'Deferred Opaque',
          createDeferredOpaquePasses(device, DEFERRED_MSAA_TARGETS),
          createDeferredOpaquePasses(device, DEFERRED_SINGLE_TARGETS),
        ),
      ],
    ),
    renderInputsPass({
      name: 'SceneInputs',
      textures: [
        [CommonInputs.View.SceneColorMap, RenderChannel.Color],
        [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
      ],
    }),
    groupPass({
      name: 'Ambient Occlusion',
      enabled: true,
      passes: [new XeGtaoPass(device), modes.select('AO Apply', multi.aoApply, single.aoApply)],
    }),
    modes.select('Fog', multi.fog, single.fog),
    modes.select('Transparent', multi.transparent, single.transparent),
    // mask and blur from the HDR scene
    sunShafts.generate,
    // scene luminance for the exposure of the film mapping, measured before bloom like the game
    luminance,
    bloomPass(device, {
      enabled: true,
      threshold: 1.5,
      knee: 0.5,
      intensity: 0.6,
      steps: 10,
      mode: 'jimnez',
    }),
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
    sunShafts.apply,
    groupPass({
      name: 'GBuffer Debug',
      enabled: false,
      passes: createGBufferDebugPasses(device),
    }),
  ]
  return { passes, modes }
}

/**
 * Deferred opaque stage (plan steps 4.1-4.3) for one GBuffer sample count:
 * 1. GBuffer pass (multisampled with MSAA)
 * 2. with MSAA: depth resolve into the single sample Depth, which the passes after the lighting test against
 * 3. sky into its own color target, tested against the single sample depth (drawn where any sample has no geometry)
 * 4. lighting: lights, composes the sky, resolves Color and LinearDepth
 * 5. emissive variant and the remaining forward opaque items, single sampled
 *
 * Writes the same channels as the single sampled forward opaque pass (Color, LinearDepth, Depth).
 */
function createDeferredOpaquePasses(device: Device, targets: DeferredTargets): RenderPass[] {
  const passes: RenderPass[] = [
    new GeometryPass({
      name: 'GBufferPass',
      list: RenderListMode.Opaque,
      variant: RenderVariant.GBuffer,
      depth: targets.depth,
      clearDepth: true,
      descriptors: GBUFFER_DESCRIPTORS,
      channels: [
        { clear: Color.TransparentBlack, render: targets.a },
        { clear: Color.TransparentBlack, render: targets.b },
        { clear: Color.TransparentBlack, render: targets.c },
        { clear: Color.TransparentBlack, render: targets.linearDepth },
      ],
    }),
  ]
  if (targets.samples > 1) {
    passes.push(new DepthMsaaResolvePass(device, { input: targets.depth, output: RenderChannel.Depth }))
  }
  passes.push(
    new GeometryPass({
      name: 'SkyPass',
      list: SKY_LIST,
      depth: RenderChannel.Depth,
      clearDepth: false,
      descriptors: { ...GBUFFER_DESCRIPTORS, [TransparentLinearDepth]: TRANSPARENT_LINEAR_DEPTH_DESC },
      channels: [
        { clear: Color.TransparentBlack, render: GBufferChannel.SkyColor },
        // the sky writes its depth as a second output, the lighting pass writes the scene linear depth
        { clear: Color.TransparentBlack, render: TransparentLinearDepth },
      ],
    }),
    new LightingPass(device, {
      samples: targets.samples,
      a: targets.a,
      b: targets.b,
      c: targets.c,
      linearDepth: targets.linearDepth,
      sky: GBufferChannel.SkyColor,
      output: RenderChannel.Color,
      outputDepth: RenderChannel.LinearDepth,
    }),
  )
  passes.push(
    // emittance of the opaque surfaces, the materials with emittance register the variant
    new GeometryPass({
      name: 'EmissivePass',
      list: RenderListMode.Opaque,
      variant: NwRenderVariant.Emissive,
      depth: RenderChannel.Depth,
      clearDepth: false,
      channels: [{ clear: null, render: RenderChannel.Color, blend: BlendState.AdditivePure }],
    }),
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
  )
  return passes
}

/**
 * GBuffer pass next to the forward pipeline (own depth, single sample) and a view of the decoded attributes.
 * Replaced by the deferred pipeline in phase 4.
 */
function createGBufferDebugPasses(device: Device): RenderPass[] {
  return [
    new GeometryPass({
      name: 'GBufferPass',
      list: RenderListMode.Opaque,
      variant: RenderVariant.GBuffer,
      depth: GBufferChannel.DebugDepth,
      clearDepth: true,
      descriptors: GBUFFER_DESCRIPTORS,
      channels: [
        { clear: Color.TransparentBlack, render: GBufferChannel.A },
        { clear: Color.TransparentBlack, render: GBufferChannel.B },
        { clear: Color.TransparentBlack, render: GBufferChannel.C },
        { clear: Color.TransparentBlack, render: GBufferChannel.DebugLinearDepth },
      ],
    }),
    new GBufferDebugPass(device, {
      a: GBufferChannel.A,
      b: GBufferChannel.B,
      c: GBufferChannel.C,
      linearDepth: GBufferChannel.DebugLinearDepth,
    }),
  ]
}

/**
 * The passes that depend on the sample count of the scene targets
 */
function createScenePasses(device: Device, targets: SceneTargets) {
  return {
    opaque: [createOpaquePass(device, targets)],
    aoApply: [new AmbientOcclusionApplyPass(device, { targets: targets.sceneColors })],
    fog: [new FogPass(device, { targets: targets.fog })],
    transparent: createTransparentPasses(device, targets),
  }
}

function createOpaquePass(device: Device, targets: SceneTargets) {
  // linear depth is resolved with max, averaging depths across edges gives depths of no surface
  const depthResolver = targets.resolveLinearDepth ? new DepthResolveEffect(device, { operator: 'max' }) : undefined
  return new GeometryPass({
    name: 'OpaquePass',
    list: RenderListMode.Opaque,
    depth: targets.depth,
    clearDepth: true,
    channels: [
      {
        clear: Color.TransparentBlack,
        render: targets.color,
        resolve: targets.resolveColor,
      },
      {
        clear: Color.TransparentBlack,
        render: targets.linearDepth,
        resolve: targets.resolveLinearDepth,
        resolver: depthResolver,
      },
    ],
  })
}

function createTransparentPasses(device: Device, targets: SceneTargets): RenderPass[] {
  const passes: RenderPass[] = []
  if (targets.sceneColorInput === NwCopyChannel.SceneColor) {
    // the transparent passes render into Color, so they sample a copy
    passes.push(new CopyPass(device, { name: 'SceneColorCopy', input: RenderChannel.Color }))
  }
  passes.push(
    renderInputsPass({
      name: 'TransparentInputs',
      values: [[InputSlots.Global.SkipFog, FALSE]],
      textures: [
        [CommonInputs.View.SceneColorMap, targets.sceneColorInput],
        [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
      ],
    }),
    // water volumes (rivers) before all other transparent geometry, like the WATER_VOLUMES list of the original
    // that is rendered before the TRANSPARENT_AW list. Waterfalls and other transparent meshes end up on top.
    groupPass({
      name: 'Water Volumes',
      enabled: true,
      // with MSAA the color is resolved by the transparent pass
      passes: [createTransparentPass(targets, 'WaterVolumePass', WATER_VOLUME_LIST, null)],
    }),
    createTransparentPass(targets, 'TransparentPass', TRANSPARENT_LIST, targets.resolveColor),
  )
  return passes
}

function createTransparentPass(
  targets: SceneTargets,
  name: string,
  list: RenderListMode,
  resolveColor: RenderChannel | null,
) {
  return new GeometryPass({
    name,
    list,
    depth: targets.depth,
    clearDepth: false, // render on top
    inputs: [targets.sceneColorInput, RenderChannel.LinearDepth],
    descriptors: { [TransparentLinearDepth]: TRANSPARENT_LINEAR_DEPTH_DESC },
    channels: [
      {
        clear: null, // render on top
        render: targets.color,
        blend: BlendState.Alpha,
        resolve: resolveColor,
      },
      {
        clear: targets.transparentLinearDepthClear,
        render: targets.transparentLinearDepth,
        blend: BlendState.Opaque,
        resolve: null,
      },
    ],
  })
}

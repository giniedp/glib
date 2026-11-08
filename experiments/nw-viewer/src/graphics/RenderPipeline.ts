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
import { InputSlots, MaterialLayerMasks } from '../material'
import { GBUFFER_DESCRIPTORS, GBufferChannel } from './GBufferChannels'
import { GBufferDebugPass } from './passes/gbuffer/GBufferDebugPass'
import { CopyPass, NwCopyChannel } from './passes/CopyPass'
import { DepthResolveEffect } from './passes/DepthResolveEffect'
import { GeometryPass } from './passes/GeometryPass'
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
 * Switches between pass groups for MSAA and for single sampled rendering at runtime.
 * The frame graph is built each frame from the enabled passes, so toggling needs no rebuild.
 */
export class MsaaSwitch {
  private groups: Array<{ group: GroupPass; samples: MsaaSamples }> = []
  private current: MsaaSamples

  public constructor(samples: MsaaSamples) {
    this.current = samples
  }

  public get samples(): MsaaSamples {
    return this.current
  }

  /**
   * Creates a group with the MSAA and the single sampled variant of the passes, of which only one is enabled
   */
  public select(name: string, msaa: RenderPass[], single: RenderPass[]): GroupPass {
    return groupPass({
      name,
      passes: [this.track(`${name} MSAA`, 4, msaa), this.track(`${name} No MSAA`, 1, single)],
    })
  }

  public set(samples: MsaaSamples) {
    this.current = samples
    for (const it of this.groups) {
      it.group.enabled = it.samples === samples
    }
  }

  private track(name: string, samples: MsaaSamples, passes: RenderPass[]) {
    const group = groupPass({ name, passes, enabled: samples === this.current })
    this.groups.push({ group, samples })
    return group
  }
}

export interface NwRenderPipelineOptions {
  /**
   * Initial MSAA sample count of the scene geometry. WebGPU supports 1 and 4.
   */
  msaa?: MsaaSamples
}

export interface NwRenderPipeline extends RenderPipelineOptions {
  /**
   * Toggles MSAA at runtime
   */
  msaa: MsaaSwitch
}

export function createRenderPipeline(device: Device, options?: NwRenderPipelineOptions): NwRenderPipeline {
  const msaa = new MsaaSwitch(options?.msaa ?? 4)
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
    msaa.select('Opaque', multi.opaque, single.opaque),
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
      passes: [new XeGtaoPass(device), msaa.select('AO Apply', multi.aoApply, single.aoApply)],
    }),
    msaa.select('Fog', multi.fog, single.fog),
    msaa.select('Transparent', multi.transparent, single.transparent),
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
  return { passes, msaa }
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

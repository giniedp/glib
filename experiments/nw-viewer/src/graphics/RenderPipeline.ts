import { TonemapOperator } from '@gglib/effects'
import { BlendState, Color, CommonInputs, FALSE, TRUE, type Device } from '@gglib/graphics'
import {
  bloomPass,
  GeometryPass,
  groupPass,
  RenderChannel,
  renderInputsPass,
  RenderItemFlags,
  RenderListMode,
  RenderSortPriority,
  tonemapPass,
  type RenderPipelineOptions,
} from '@gglib/render'
import { InputSlots, MaterialLayerMasks } from '../material'
import { DepthResolveEffect } from './DepthResolveEffect'
import { FogPass } from './fog/FogPass'
import { AmbientOcclusionApplyPass } from './ssao/AmbientOcclusionApplyPass'
import { SunShaftsPass } from './sunshafts/SunShaftsPass'
import { XeGtaoPass } from './ssao/XeGtaoPass'

const WATER_VOLUME_LIST = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, {
  includeLayers: MaterialLayerMasks.WaterVolume,
})
const TRANSPARENT_LIST = new RenderListMode(RenderSortPriority.Depth, RenderItemFlags.Transparent, {
  excludeLayers: MaterialLayerMasks.WaterVolume,
})

export function createRenderPipeline(device: Device): RenderPipelineOptions {
  const sunShafts = new SunShaftsPass(device)
  return {
    passes: [
      renderInputsPass({
        name: 'OpaqueInputs',
        // fog is applied by the FogPass
        values: [[InputSlots.Global.SkipFog, TRUE]],
      }),
      new GeometryPass({
        name: 'OpaquePass',
        list: RenderListMode.Opaque,
        depth: RenderChannel.DepthMsaa,
        clearDepth: true,
        channels: [
          {
            clear: Color.TransparentBlack,
            render: RenderChannel.ColorMsaa,
            resolve: RenderChannel.Color,
          },
          {
            clear: Color.TransparentBlack,
            render: RenderChannel.LinearDepthMsaa,
            resolve: RenderChannel.LinearDepth,
            resolver: new DepthResolveEffect(device, { operator: 'max' }),
          },
        ],
      }),
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
        passes: [new XeGtaoPass(device), new AmbientOcclusionApplyPass(device)],
      }),
      new FogPass(device),
      renderInputsPass({
        name: 'TransparentInputs',
        values: [[InputSlots.Global.SkipFog, FALSE]],
        textures: [
          [CommonInputs.View.SceneColorMap, RenderChannel.Color],
          [CommonInputs.View.SceneDepthMap, RenderChannel.LinearDepth],
        ],
      }),
      // water volumes (rivers) before all other transparent geometry, like the WATER_VOLUMES list of the original
      // that is rendered before the TRANSPARENT_AW list. Waterfalls and other transparent meshes end up on top.
      groupPass({
        name: 'Water Volumes',
        enabled: true,
        passes: [
          new GeometryPass({
            name: 'WaterVolumePass',
            list: WATER_VOLUME_LIST,
            depth: RenderChannel.DepthMsaa,
            clearDepth: false, // render on top
            inputs: [RenderChannel.Color, RenderChannel.LinearDepth],
            channels: [
              {
                clear: null, // render on top
                render: RenderChannel.ColorMsaa,
                blend: BlendState.Alpha,
                resolve: null, // resolved by the transparent pass
              },
              {
                clear: null, // render on top
                render: RenderChannel.LinearDepthMsaa,
                blend: BlendState.Opaque,
                resolve: null,
              },
            ],
          }),
        ],
      }),
      new GeometryPass({
        name: 'TransparentPass',
        list: TRANSPARENT_LIST,
        depth: RenderChannel.DepthMsaa,
        clearDepth: false, // render on top
        inputs: [RenderChannel.Color, RenderChannel.LinearDepth],
        channels: [
          {
            clear: null, // render on top
            render: RenderChannel.ColorMsaa,
            blend: BlendState.Alpha,
            resolve: RenderChannel.Color,
          },
          {
            clear: null, // render on top
            render: RenderChannel.LinearDepthMsaa,
            blend: BlendState.Opaque,
            resolve: null,
          },
        ],
      }),
      // mask and blur from the HDR scene
      sunShafts.generate,
      bloomPass(device, {
        enabled: true,
        threshold: 1.5,
        knee: 0.5,
        intensity: 0.6,
        steps: 10,
        mode: 'jimnez',
      }),
      tonemapPass(device, {
        enabled: true,
        exposure: 1,
        operator: TonemapOperator.ACES_NARKOWICZ,
        whitePoint: 10.0,
        srgb: true,
      }),
      // blended into the tone mapped image, like the HDR final pass of the original
      sunShafts.apply,
    ],
  }
}

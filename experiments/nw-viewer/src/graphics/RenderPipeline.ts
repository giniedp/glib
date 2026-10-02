import { TonemapOperator } from '@gglib/effects'
import { BlendState, Color, CommonInputs, FALSE, TRUE, type Device } from '@gglib/graphics'
import {
  bloomPass,
  GeometryPass,
  groupPass,
  RenderChannel,
  renderInputsPass,
  RenderListMode,
  tonemapPass,
  type RenderPipelineOptions,
} from '@gglib/render'
import { InputSlots } from '../material'
import { DepthResolveEffect } from './DepthResolveEffect'
import { FogPass } from './fog/FogPass'
import { AmbientOcclusionApplyPass } from './ssao/AmbientOcclusionApplyPass'
import { XeGtaoPass } from './ssao/XeGtaoPass'

export function createRenderPipeline(device: Device): RenderPipelineOptions {
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
      }),
      new GeometryPass({
        name: 'TransparentPass',
        list: RenderListMode.Transparent,
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
    ],
  }
}

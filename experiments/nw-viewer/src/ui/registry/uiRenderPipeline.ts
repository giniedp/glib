import { TonemapOperator } from '@gglib/effects'
import { BloomPass, GroupPass, RenderPipeline, TonemapPass, type RenderPass } from '@gglib/render'
import type { Children, FactoryComponent } from 'mithril'
import { uiBoolWidget, uiGroup, uiScalarWidget, uiSelect } from 'tweak-ui'
import { AmbientOcclusionApplyPass } from '../../graphics/ssao/AmbientOcclusionApplyPass'
import { XeGtaoPass } from '../../graphics/ssao/XeGtaoPass'
import icon from '../icons/list-tree.svg?raw'
import { type UiAnnotation } from './types'

export const RenderPipelineProps: FactoryComponent<{ data: RenderPipeline }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      return data.passes.map(renderPassProps)
    },
  }
}

function renderPassProps(pass: RenderPass): Children {
  const children = [
    'enabled' in pass ? uiBoolWidget({ value: pass as { enabled: boolean }, field: 'enabled' }) : null,
    ...renderPassFields(pass),
  ].filter((it) => !!it)
  if (!children.length) {
    return null
  }
  return uiGroup({ title: pass.name, collapsible: true, collapsed: true }, children)
}

function renderPassFields(pass: RenderPass): Children[] {
  if (pass instanceof GroupPass) {
    return pass.passes.map(renderPassProps)
  }
  if (pass instanceof XeGtaoPass) {
    return [
      uiSelect({ value: pass, field: 'quality', options: ['low', 'medium', 'high', 'ultra'] }),
      uiScalarWidget({ value: pass, field: 'denoisePasses', min: 0, max: 3, step: 1, range: true }),
      uiScalarWidget({ value: pass, field: 'radius', min: 0.01, max: 5, step: 0.01, range: true }),
      uiScalarWidget({ value: pass, field: 'radiusMultiplier', min: 0.3, max: 3, step: 0.001, range: true }),
      uiScalarWidget({ value: pass, field: 'falloffRange', min: 0, max: 1, step: 0.001, range: true }),
      uiScalarWidget({ value: pass, field: 'sampleDistributionPower', min: 1, max: 3, step: 0.01, range: true }),
      uiScalarWidget({ value: pass, field: 'thinOccluderCompensation', min: 0, max: 0.7, step: 0.01, range: true }),
      uiScalarWidget({ value: pass, field: 'finalValuePower', min: 0.5, max: 5, step: 0.01, range: true }),
      uiScalarWidget({ value: pass, field: 'depthMipSamplingOffset', min: 0, max: 30, step: 0.1, range: true }),
      uiScalarWidget({ value: pass, field: 'denoiseBlurBeta', min: 0, max: 10, step: 0.1, range: true }),
      uiScalarWidget({ value: pass, field: 'maxDistance', min: 0, step: 1 }),
    ]
  }
  if (pass instanceof AmbientOcclusionApplyPass) {
    return [uiScalarWidget({ value: pass, field: 'strength', min: 0, max: 2, step: 0.01, range: true })]
  }
  if (pass instanceof BloomPass) {
    return [
      uiSelect({ value: pass, field: 'mode', options: ['kawase', 'jimnez'] }),
      uiScalarWidget({ value: pass, field: 'threshold', min: 0, max: 10, step: 0.01, range: true }),
      uiScalarWidget({ value: pass, field: 'knee', min: 0, max: 1, step: 0.01, range: true }),
      uiScalarWidget({ value: pass, field: 'intensity', min: 0, max: 2, step: 0.01, range: true }),
      uiScalarWidget({ value: pass, field: 'steps', min: 1, max: 16, step: 1, range: true }),
    ]
  }
  if (pass instanceof TonemapPass) {
    return [
      uiSelect({ value: pass, field: 'operator', options: TonemapOperator }),
      uiScalarWidget({ value: pass, field: 'exposure', min: 0, max: 10, step: 0.01, range: true }),
      uiScalarWidget({ value: pass, field: 'whitePoint', min: 0, max: 20, step: 0.1, range: true }),
      uiBoolWidget({ value: pass, field: 'srgb' }),
    ]
  }
  return []
}

export default {
  icon: () => icon,
  label: () => 'Render Pipeline',
  propsComponent: RenderPipelineProps,
} satisfies UiAnnotation<RenderPipeline>

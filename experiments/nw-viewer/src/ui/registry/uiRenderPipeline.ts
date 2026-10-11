import { TonemapOperator } from '@gglib/effects'
import type { Device, GpuTimer } from '@gglib/graphics'
import { BloomPass, GroupPass, RenderPipeline, TonemapPass, type RenderPass } from '@gglib/render'
import type { Children, FactoryComponent } from 'mithril'
import { uiBoolWidget, uiGroup, uiPollWidget, uiScalarWidget, uiSelect } from 'tweak-ui'
import { AmbientOcclusionApplyPass } from '../../graphics/ssao/AmbientOcclusionApplyPass'
import { XeGtaoPass } from '../../graphics/ssao/XeGtaoPass'
import icon from '../icons/list-tree.svg?raw'
import { type UiAnnotation } from './types'

/**
 * Timers are kept per pass, so toggling a timer does not consume new device timer slots
 */
const passTimers = new WeakMap<RenderPass, GpuTimer>()

export const RenderPipelineProps: FactoryComponent<{ data: RenderPipeline; device?: Device }> = () => {
  return {
    view({ attrs: { data, device } }) {
      if (!data) {
        return null
      }
      return data.passes.map((pass) => renderPassProps(pass, device))
    },
  }
}

function renderPassProps(pass: RenderPass, device: Device): Children {
  const children = [
    'enabled' in pass ? uiBoolWidget({ value: pass as { enabled: boolean }, field: 'enabled' }) : null,
    ...renderTimerFields(pass, device),
    ...renderPassFields(pass, device),
  ].filter((it) => !!it)
  if (!children.length) {
    return null
  }
  return uiGroup({ title: pass.name, collapsible: true, collapsed: true }, children)
}

function renderTimerFields(pass: RenderPass, device: Device): Children[] {
  // groups are not executed by the pipeline, only their passes are
  if (!device || pass instanceof GroupPass) {
    return []
  }
  const ms = (value: number) => value.toFixed(2)
  return [
    uiBoolWidget({
      label: 'GPU timer',
      value: pass,
      binding: {
        get: () => !!pass.gpuTimer,
        set: (value: boolean) => {
          if (!value) {
            pass.gpuTimer = null
            return
          }
          if (!passTimers.has(pass)) {
            passTimers.set(pass, device.createGpuTimer({ name: pass.name }))
          }
          pass.gpuTimer = passTimers.get(pass)
          pass.gpuTimer.reset()
        },
      },
    }),
    pass.gpuTimer
      ? uiPollWidget({
          label: 'GPU ms',
          value: pass,
          binding: {
            get: () => {
              const timer = pass.gpuTimer
              if (!timer) {
                return '-'
              }
              return `${ms(timer.time)} avg ${ms(timer.average)} max ${ms(timer.max)}`
            },
          },
        })
      : null,
  ]
}

function renderPassFields(pass: RenderPass, device: Device): Children[] {
  if (pass instanceof GroupPass) {
    return pass.passes.map((it) => renderPassProps(it, device))
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

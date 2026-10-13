import { TonemapOperator } from '@gglib/effects'
import type { Device, GpuTimer } from '@gglib/graphics'
import { BloomPass, GroupPass, RenderPipeline, TonemapPass, type RenderPass } from '@gglib/render'
import { For, Show, type JSX } from 'solid-js'
import { BoolWidget, Group, PollWidget, ScalarWidget, SelectWidget } from 'tweak-ui'
import { AmbientOcclusionApplyPass } from '../../graphics/ssao/AmbientOcclusionApplyPass'
import { XeGtaoPass } from '../../graphics/ssao/XeGtaoPass'
import icon from '../icons/list-tree.svg?raw'
import { usePanel, type UiPanel } from '../panel'
import { type UiAnnotation } from './types'

/**
 * Timers are kept per pass, so toggling a timer does not consume new device timer slots
 */
const passTimers = new WeakMap<RenderPass, GpuTimer>()

export function RenderPipelineProps(props: { data: RenderPipeline; device?: Device }) {
  const panel = usePanel()
  return (
    <For each={panel.pull(() => props.data?.passes ?? [])}>
      {(pass) => <RenderPassProps pass={pass} device={props.device} />}
    </For>
  )
}

function RenderPassProps(props: { pass: RenderPass; device: Device }) {
  const panel = usePanel()
  const hasTimer = () => !!props.device && !(props.pass instanceof GroupPass)
  const hasFields = () => fieldPasses.some((type) => props.pass instanceof type)
  const hasContent = () => 'enabled' in props.pass || hasTimer() || hasFields()
  return (
    <Show when={hasContent()}>
      <Group title={props.pass.name} collapsible defaultCollapsed>
        <Show when={'enabled' in props.pass}>
          <BoolWidget {...panel.bind(props.pass as RenderPass & { enabled: boolean }, 'enabled')} />
        </Show>
        <Show when={hasTimer()}>
          <TimerFields pass={props.pass} device={props.device} />
        </Show>
        {renderPassFields(panel, props.pass, props.device)}
      </Group>
    </Show>
  )
}

/**
 * Toggles the GPU timer of a pass and shows its times.
 * Groups are not executed by the pipeline, only their passes are.
 */
function TimerFields(props: { pass: RenderPass; device: Device }) {
  const panel = usePanel()
  const ms = (value: number) => value.toFixed(2)
  function setEnabled(enabled: boolean) {
    const pass = props.pass
    if (!enabled) {
      pass.gpuTimer = null
    } else {
      if (!passTimers.has(pass)) {
        passTimers.set(pass, props.device.createGpuTimer({ name: pass.name }))
      }
      pass.gpuTimer = passTimers.get(pass)
      pass.gpuTimer.reset()
    }
    panel.redraw()
  }
  return (
    <>
      <BoolWidget label="GPU timer" value={panel.pull(() => !!props.pass.gpuTimer)} onInput={setEnabled} />
      <Show when={panel.pull(() => props.pass.gpuTimer)}>
        {(timer) => (
          <PollWidget label="GPU ms" value={`${ms(timer().time)} avg ${ms(timer().average)} max ${ms(timer().max)}`} />
        )}
      </Show>
    </>
  )
}

/**
 * Passes with fields, see {@link renderPassFields}
 */
const fieldPasses = [GroupPass, XeGtaoPass, AmbientOcclusionApplyPass, BloomPass, TonemapPass]

function renderPassFields(panel: UiPanel, pass: RenderPass, device: Device): JSX.Element {
  if (pass instanceof GroupPass) {
    return <For each={pass.passes}>{(it) => <RenderPassProps pass={it} device={device} />}</For>
  }
  if (pass instanceof XeGtaoPass) {
    return (
      <>
        <SelectWidget {...panel.bind(pass, 'quality')} options={['low', 'medium', 'high', 'ultra']} />
        <ScalarWidget {...panel.bind(pass, 'denoisePasses')} min={0} max={3} step={1} range />
        <ScalarWidget {...panel.bind(pass, 'radius')} min={0.01} max={5} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'radiusMultiplier')} min={0.3} max={3} step={0.001} range />
        <ScalarWidget {...panel.bind(pass, 'falloffRange')} min={0} max={1} step={0.001} range />
        <ScalarWidget {...panel.bind(pass, 'sampleDistributionPower')} min={1} max={3} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'thinOccluderCompensation')} min={0} max={0.7} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'finalValuePower')} min={0.5} max={5} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'depthMipSamplingOffset')} min={0} max={30} step={0.1} range />
        <ScalarWidget {...panel.bind(pass, 'denoiseBlurBeta')} min={0} max={10} step={0.1} range />
        <ScalarWidget {...panel.bind(pass, 'maxDistance')} min={0} step={1} />
      </>
    )
  }
  if (pass instanceof AmbientOcclusionApplyPass) {
    return <ScalarWidget {...panel.bind(pass, 'strength')} min={0} max={2} step={0.01} range />
  }
  if (pass instanceof BloomPass) {
    return (
      <>
        <SelectWidget {...panel.bind(pass, 'mode')} options={['kawase', 'jimnez']} />
        <ScalarWidget {...panel.bind(pass, 'threshold')} min={0} max={10} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'knee')} min={0} max={1} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'intensity')} min={0} max={2} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'steps')} min={1} max={16} step={1} range />
      </>
    )
  }
  if (pass instanceof TonemapPass) {
    return (
      <>
        <SelectWidget {...panel.bind(pass, 'operator')} options={TonemapOperator} />
        <ScalarWidget {...panel.bind(pass, 'exposure')} min={0} max={10} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'whitePoint')} min={0} max={20} step={0.1} range />
        <BoolWidget {...panel.bind(pass, 'srgb')} />
      </>
    )
  }
  return null
}

export default {
  icon: () => icon,
  label: () => 'Render Pipeline',
  propsComponent: RenderPipelineProps,
} satisfies UiAnnotation<RenderPipeline>

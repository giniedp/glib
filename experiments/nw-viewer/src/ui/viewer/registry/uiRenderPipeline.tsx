import { TonemapOperator } from '@gglib/effects'
import type { Device, GpuTimer } from '@gglib/graphics'
import {
  BloomPass,
  FunctionPass,
  FxaaPass,
  GroupPass,
  RenderPipeline,
  TonemapPass,
  type RenderPass,
} from '@gglib/render'
import { For, Show, type JSX } from 'solid-js'
import { BoolWidget, Group, PollWidget, ScalarWidget, SelectWidget } from 'tweak-ui'
import { getPassInfo } from '../../../graphics/PassInfo'
import { FilmMappingPass } from '../../../graphics/passes/filmmapping/FilmMappingPass'
import { GBufferDebugModes, GBufferDebugPass } from '../../../graphics/passes/gbuffer/GBufferDebugPass'
import { LightingPass } from '../../../graphics/passes/lighting/LightingPass'
import { LightingDebugModes } from '../../../graphics/passes/lighting/LightingPass.wgsl'
import { SsrPass } from '../../../graphics/passes/ssr/SsrPass'
import { SsrDebugModes } from '../../../graphics/passes/ssr/Ssr.wgsl'
import { XeGtaoPass } from '../../../graphics/passes/ssao/XeGtaoPass'
import { SmaaDebugModes, SmaaPass } from '../../../graphics/passes/smaa/SmaaPass'
import { Cmaa2DebugModes, Cmaa2Pass } from '../../../graphics/passes/cmaa2/Cmaa2Pass'
import icon from '../../icons/list-tree.svg?raw'
import { usePanel, type UiPanel } from '../panel'
import { type UiAnnotation } from './types'

/**
 * Timers are kept per pass, so toggling a timer does not consume new device timer slots
 */
const passTimers = new WeakMap<RenderPass, GpuTimer>()

/**
 * The render pipeline as a tree of the passes that run:
 * - only passes the frame works without (marked optional by the pipeline, see graphics/PassInfo) can be turned off
 * - input passes are listed read only
 */
export function RenderPipelineProps(props: { data: RenderPipeline; device?: Device }) {
  const panel = usePanel()
  return <PassList passes={panel.pull(() => props.data?.passes ?? [])} device={props.device} />
}

function PassList(props: { passes: RenderPass[]; device: Device }) {
  return <For each={props.passes}>{(pass) => <PassEntry pass={pass} device={props.device} />}</For>
}

function PassEntry(props: { pass: RenderPass; device: Device }): JSX.Element {
  if (props.pass instanceof GroupPass) {
    return <GroupEntry pass={props.pass} device={props.device} />
  }
  // input passes only set render inputs: no GPU work to time
  const device = props.pass instanceof FunctionPass ? null : props.device
  return <LeafEntry pass={props.pass} device={device} />
}

function GroupEntry(props: { pass: GroupPass; device: Device }) {
  return (
    <Group title={props.pass.name} collapsible defaultCollapsed>
      <PassFlags pass={props.pass} device={null} />
      <PassList passes={props.pass.passes} device={props.device} />
    </Group>
  )
}

function LeafEntry(props: { pass: RenderPass; device: Device | null }) {
  const panel = usePanel()
  return (
    <Group title={props.pass.name} collapsible defaultCollapsed>
      <PassFlags pass={props.pass} device={props.device} />
      {renderPassFields(panel, props.pass)}
    </Group>
  )
}

/**
 * Description, on/off toggle of optional passes, GPU timer
 */
function PassFlags(props: { pass: RenderPass; device: Device | null }) {
  const panel = usePanel()
  const info = getPassInfo(props.pass)
  return (
    <>
      <Show when={info?.note}>{(note) => <PassNote text={note()} />}</Show>
      <Show when={info?.toggle}>{(toggle) => <BoolWidget {...panel.bind(toggle(), 'enabled')} />}</Show>
      <Show when={props.device}>{(device) => <TimerFields pass={props.pass} device={device()} />}</Show>
    </>
  )
}

/**
 * The description of a pass, a full row
 */
function PassNote(props: { text: string }) {
  return <p class="nw-note nw-pass-note">{props.text}</p>
}

/**
 * Toggles the GPU timer of a pass and shows its times
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

function renderPassFields(panel: UiPanel, pass: RenderPass): JSX.Element {
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
  if (pass instanceof GBufferDebugPass) {
    return <SelectWidget {...panel.bind(pass, 'mode')} options={[...GBufferDebugModes]} />
  }
  if (pass instanceof LightingPass) {
    return (
      <>
        <SelectWidget {...panel.bind(pass, 'debug')} options={[...LightingDebugModes]} />
        <ScalarWidget {...panel.bind(pass, 'aoStrength')} min={0} max={1} step={0.01} range />
      </>
    )
  }
  if (pass instanceof SsrPass) {
    return (
      <>
        <SelectWidget {...panel.bind(pass, 'debug')} options={[...SsrDebugModes]} />
        <ScalarWidget {...panel.bind(pass, 'debugMip')} min={0} max={12} step={1} range />
      </>
    )
  }
  if (pass instanceof SmaaPass) {
    return (
      <>
        <SelectWidget {...panel.bind(pass, 'preset')} options={['low', 'medium', 'high', 'ultra']} />
        <SelectWidget {...panel.bind(pass, 'debug')} options={[...SmaaDebugModes]} />
        <ScalarWidget {...panel.bind(pass, 'threshold')} min={0.01} max={0.3} step={0.005} range />
        <ScalarWidget {...panel.bind(pass, 'maxSearchSteps')} min={1} max={64} step={1} range />
        <ScalarWidget {...panel.bind(pass, 'maxSearchStepsDiag')} min={0} max={20} step={1} range />
        <ScalarWidget {...panel.bind(pass, 'cornerRounding')} min={0} max={100} step={1} range />
        <BoolWidget {...panel.bind(pass, 'predication')} />
        <ScalarWidget {...panel.bind(pass, 'predicationThreshold')} min={0} max={0.1} step={0.001} range />
        <ScalarWidget {...panel.bind(pass, 'predicationScale')} min={1} max={5} step={0.1} range />
        <ScalarWidget {...panel.bind(pass, 'predicationStrength')} min={0} max={1} step={0.01} range />
      </>
    )
  }
  if (pass instanceof Cmaa2Pass) {
    return (
      <>
        <SelectWidget {...panel.bind(pass, 'preset')} options={['low', 'medium', 'high', 'ultra']} />
        <SelectWidget {...panel.bind(pass, 'debug')} options={[...Cmaa2DebugModes]} />
        <ScalarWidget {...panel.bind(pass, 'threshold')} min={0.01} max={0.3} step={0.005} range />
        <ScalarWidget {...panel.bind(pass, 'localContrastAdaptation')} min={0} max={0.5} step={0.01} range />
        <ScalarWidget {...panel.bind(pass, 'simpleShapeBluriness')} min={0} max={0.5} step={0.01} range />
        <BoolWidget {...panel.bind(pass, 'extraSharpness')} />
      </>
    )
  }
  if (pass instanceof FxaaPass) {
    return (
      <>
        <ScalarWidget {...panel.bind(pass, 'thresholdMin')} min={0} max={0.1} step={0.001} range />
        <ScalarWidget {...panel.bind(pass, 'thresholdMax')} min={0.03} max={0.35} step={0.001} range />
        <ScalarWidget {...panel.bind(pass, 'quality')} label="subpix" min={0} max={1} step={0.01} range />
      </>
    )
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
  if (pass instanceof FilmMappingPass) {
    return (
      <>
        <PassNote text="film mapping of the game, or the fallback with config tonemapper: aces" />
        <Group title={`Fallback: ${pass.fallback.name}`} collapsible defaultCollapsed>
          {renderPassFields(panel, pass.fallback)}
        </Group>
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

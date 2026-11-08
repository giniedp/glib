import { TonemapOperator } from '@gglib/effects'
import type { Device, GpuTimer } from '@gglib/graphics'
import { BloomPass, FunctionPass, GroupPass, RenderPipeline, TonemapPass, type RenderPass } from '@gglib/render'
import { For, Show, type JSX } from 'solid-js'
import { BoolWidget, Group, PollWidget, ScalarWidget, SelectWidget } from 'tweak-ui'
import { getPassInfo, getSwitchInfo } from '../../graphics/PassInfo'
import { FilmMappingPass } from '../../graphics/passes/filmmapping/FilmMappingPass'
import { GBufferDebugModes, GBufferDebugPass } from '../../graphics/passes/gbuffer/GBufferDebugPass'
import { LightingPass } from '../../graphics/passes/lighting/LightingPass'
import { LightingDebugModes } from '../../graphics/passes/lighting/LightingPass.wgsl'
import { AmbientOcclusionApplyPass } from '../../graphics/passes/ssao/AmbientOcclusionApplyPass'
import { XeGtaoPass } from '../../graphics/passes/ssao/XeGtaoPass'
import icon from '../icons/list-tree.svg?raw'
import { usePanel, type UiPanel } from '../panel'
import { type UiAnnotation } from './types'

/**
 * Timers are kept per pass, so toggling a timer does not consume new device timer slots
 */
const passTimers = new WeakMap<RenderPass, GpuTimer>()

/**
 * The render pipeline as a tree of the passes that run:
 * - groups switched by the pipeline modes (MSAA, forward/deferred) show only their active variant and its mode,
 *   they are controlled by the config, not here
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
  if (getSwitchInfo(props.pass)) {
    return <SwitchEntry pass={props.pass} device={props.device} />
  }
  if (props.pass instanceof GroupPass) {
    return <GroupEntry pass={props.pass} device={props.device} />
  }
  if (props.pass instanceof FunctionPass) {
    return <PollWidget label={props.pass.name} value={getPassInfo(props.pass)?.note ?? 'inputs'} />
  }
  return <LeafEntry pass={props.pass} device={props.device} />
}

/**
 * Follows the active variants of nested switched groups
 */
function resolveSwitch(pass: RenderPass): { modes: string[]; passes: RenderPass[] } {
  const modes: string[] = []
  let current = pass
  for (let info = getSwitchInfo(current); info; info = getSwitchInfo(current)) {
    const active = info.variants.find((it) => it.group.enabled)
    if (!active) {
      return { modes, passes: [] }
    }
    modes.push(active.label)
    const passes = active.group.passes
    if (passes.length !== 1 || !getSwitchInfo(passes[0])) {
      return { modes, passes }
    }
    current = passes[0]
  }
  return { modes, passes: [] }
}

/**
 * A group switched by the pipeline modes. Hidden when the active variant has no passes (e.g. the forward AO in
 * deferred mode, where the opaque stage computes AO).
 */
function SwitchEntry(props: { pass: RenderPass; device: Device }) {
  const panel = usePanel()
  const resolved = () => panel.pull(() => resolveSwitch(props.pass))
  const mode = () => resolved().modes.join(' · ')
  // a single pass is shown as the entry itself, not nested in a group of the same name
  const single = () => {
    const passes = resolved().passes
    return passes.length === 1 && !(passes[0] instanceof GroupPass) && !(passes[0] instanceof FunctionPass)
      ? passes[0]
      : null
  }
  return (
    <Show when={resolved().passes.length > 0}>
      <Show
        when={single()}
        keyed
        fallback={
          <Group title={props.pass.name} collapsible defaultCollapsed>
            <PollWidget label="mode" value={mode()} />
            <PassList passes={resolved().passes} device={props.device} />
          </Group>
        }
      >
        {(pass) => <LeafEntry pass={pass} device={props.device} mode={mode()} />}
      </Show>
    </Show>
  )
}

function GroupEntry(props: { pass: GroupPass; device: Device }) {
  return (
    <Group title={props.pass.name} collapsible defaultCollapsed>
      <PassFlags pass={props.pass} device={null} />
      <PassList passes={props.pass.passes} device={props.device} />
    </Group>
  )
}

function LeafEntry(props: { pass: RenderPass; device: Device; mode?: string }) {
  const panel = usePanel()
  return (
    <Group title={props.pass.name} collapsible defaultCollapsed>
      <Show when={props.mode}>{(mode) => <PollWidget label="mode" value={mode()} />}</Show>
      <PassFlags pass={props.pass} device={props.device} />
      {renderPassFields(panel, props.pass)}
    </Group>
  )
}

/**
 * Note, on/off toggle of optional passes, GPU timer
 */
function PassFlags(props: { pass: RenderPass; device: Device | null }) {
  const panel = usePanel()
  const info = getPassInfo(props.pass)
  return (
    <>
      <Show when={info?.note}>{(note) => <PollWidget label="info" value={note()} />}</Show>
      <Show when={info?.toggle}>{(toggle) => <BoolWidget {...panel.bind(toggle(), 'enabled')} />}</Show>
      <Show when={props.device}>{(device) => <TimerFields pass={props.pass} device={device()} />}</Show>
    </>
  )
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
  if (pass instanceof FilmMappingPass) {
    return (
      <>
        <PollWidget label="info" value="film mapping of the game, or the fallback with config tonemapper: aces" />
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

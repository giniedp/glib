import { mat4GetTranslation, vec3 } from '@gglib/math'
import { Index, Show } from 'solid-js'
import { BoolWidget, PollWidget, ScalarWidget, track } from 'tweak-ui'
import type { ProbeCubeLoader } from '../../content/ProbeCubeLoader'
import { PROBE_ATLAS_SLOTS, PROBE_SPECULAR_MIPS } from '../../graphics/probes/ProbeCubeAtlas'
import type { EnvProbeDebugSystem } from '../../game/probes/EnvProbeDebugSystem'
import { envProbeAttenuation } from '../../game/probes/envProbeAttenuation'
import type { EnvProbeSystem } from '../../game/probes/EnvProbeSystem'
import type { NwViewer } from '../../viewer'
import { usePanel } from '../panel'

interface Row {
  label: string
  text: string
}

const rowsEqual = (a: Row[], b: Row[]) =>
  a.length === b.length && a.every((row, i) => row.label === b[i].label && row.text === b[i].text)

const cubeName = (file: string | undefined) => file?.split('/').pop()?.replace('_cm.dds', '')

const cameraPosition = vec3()

/**
 * Active probes in blend order. `w` is the share of the probe at the camera position, as the shader would compute it.
 */
function probeRows(system: EnvProbeSystem, viewer: NwViewer): Row[] {
  mat4GetTranslation(viewer.camera.entity.getTransform().world, cameraPosition)
  let sum = 0
  return system.active.map((probe) => {
    const world = probe.entity.getTransform().world
    const attenuation = envProbeAttenuation(world, probe.extents, probe.config.falloff ?? 0, cameraPosition)
    const weight = (1 - sum) * attenuation
    sum += weight
    const area = probe.config.probeArea?.join('x')
    return {
      label: probe.isGlobal ? `${probe.entity.name} (global)` : probe.entity.name,
      text: `w=${weight.toFixed(2)} a=${attenuation.toFixed(2)} p${probe.priority} ${area} ${cubeName(probe.config.cubemap)}`,
    }
  })
}

function cubeRows(loader: ProbeCubeLoader): Row[] {
  return [...loader.cubes.values()].map((cube) => ({
    label: `Slot ${cube.slot}`,
    text: `${cube.state} ${cubeName(cube.file)}`,
  }))
}

export function EnvProbeSystemProps(props: {
  data: EnvProbeSystem
  cubes: ProbeCubeLoader
  debug: EnvProbeDebugSystem
  viewer: NwViewer
}) {
  const panel = usePanel()
  const rows = track(() => probeRows(props.data, props.viewer), { interval: 500, equals: rowsEqual })
  const slots = track(() => cubeRows(props.cubes), { interval: 500, equals: rowsEqual })
  return (
    <Show when={props.data}>
      <PollWidget label="Active" value={rows().length} />
      <Index each={rows()}>{(row) => <PollWidget label={row().label} value={row().text} />}</Index>
      <PollWidget label="Atlas" value={`${slots().length} / ${PROBE_ATLAS_SLOTS} slots`} />
      <Index each={slots()}>{(row) => <PollWidget label={row().label} value={row().text} />}</Index>
      <BoolWidget {...panel.bind(props.debug, 'enabled')} label="Mirror sphere" />
      <ScalarWidget {...panel.bind(props.debug, 'slot')} label="Slot" min={0} max={PROBE_ATLAS_SLOTS - 1} step={1} />
      <ScalarWidget {...panel.bind(props.debug, 'lod')} label="Lod" min={0} max={PROBE_SPECULAR_MIPS - 1} step={0.25} />
      <BoolWidget {...panel.bind(props.debug, 'diffuse')} label="Diffuse cube" />
    </Show>
  )
}

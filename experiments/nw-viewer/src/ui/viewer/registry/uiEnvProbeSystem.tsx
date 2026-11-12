import { Show } from 'solid-js'
import { BoolWidget, PollWidget, ScalarWidget } from 'tweak-ui'
import type { ProbeCubeLoader } from '../../../content/ProbeCubeLoader'
import type { EnvProbeDebugSystem } from '../../../game/probes/EnvProbeDebugSystem'
import type { EnvProbeSystem } from '../../../game/probes/EnvProbeSystem'
import { PROBE_ATLAS_SLOTS, PROBE_SPECULAR_MIPS } from '../../../graphics/probes/ProbeCubeAtlas'
import type { NwViewer } from '../../../viewer'
import { usePanel } from '../panel'

export function EnvProbeSystemProps({
  data,
  cubes,
  debug,
  viewer,
}: {
  data: EnvProbeSystem
  cubes: ProbeCubeLoader
  debug: EnvProbeDebugSystem
  viewer: NwViewer
}) {
  const panel = usePanel()
  const debugEnabled = panel.bind(debug, 'enabled')
  const debugSlot = panel.bind(debug, 'slot')
  const debugLod = panel.bind(debug, 'lod')
  const debugDiffuse = panel.bind(debug, 'diffuse')

  return (
    <Show when={data}>
      <PollWidget label="Active" value={data.active?.length} />
      <PollWidget label="Atlas" value={`${cubes.cubes.size} / ${PROBE_ATLAS_SLOTS} slots`} />

      <BoolWidget {...debugEnabled} label="Mirror sphere" />
      <Show when={debugEnabled.value}>
        <ScalarWidget {...debugSlot} label="Slot" min={0} max={PROBE_ATLAS_SLOTS - 1} step={1} />
        <ScalarWidget {...debugLod} label="Lod" min={0} max={PROBE_SPECULAR_MIPS - 1} step={0.25} />
        <BoolWidget {...debugDiffuse} label="Diffuse" />
      </Show>
    </Show>
  )
}

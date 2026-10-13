import { Index, Show } from 'solid-js'
import { BoolWidget, PollWidget, ScalarWidget, TextWidget } from 'tweak-ui'
import type { AudioSystem } from '../../audio/AudioSystem'
import icon from '../icons/timer.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`

/**
 * Edits a list of strings as comma separated text, applied to the audio system on commit
 */
function ListWidget(props: { label: string; system: AudioSystem; get: () => string[]; set: (list: string[]) => void }) {
  const panel = usePanel()
  return (
    <TextWidget
      label={props.label}
      value={panel.pull(() => props.get().join(', '))}
      onChange={(value) => {
        props.set(
          value
            .split(',')
            .map((it) => it.trim())
            .filter(Boolean),
        )
        props.system.applyConfig()
        panel.redraw()
      }}
    />
  )
}

/**
 * Edits a number of the audio config, applied to the audio system on commit
 */
function ConfigNumberWidget(props: {
  label: string
  system: AudioSystem
  get: () => number
  set: (value: number) => void
  min: number
  max: number
  step: number
}) {
  const panel = usePanel()
  return (
    <ScalarWidget
      label={props.label}
      value={panel.pull(props.get)}
      onChange={(value) => {
        props.set(value)
        props.system.applyConfig()
        panel.redraw()
      }}
      min={props.min}
      max={props.max}
      step={props.step}
    />
  )
}

export function AudioSystemProps(props: { data: AudioSystem }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => {
        const stats = () => data.engineStats
        const output = () => data.outputStats
        const override = (label: string, field: 'territory' | 'tract' | 'tod') => (
          <TextWidget
            label={label}
            value={panel.pull(() => data.overrides[field] ?? '')}
            onChange={(value) => {
              data.setOverrides({ ...data.overrides, [field]: value || undefined })
              panel.redraw()
            }}
          />
        )
        return (
          <>
            {/* enabling resumes the audio context, this runs in the input handler (user gesture) */}
            <BoolWidget {...panel.bind(data, 'enabled')} label="Enabled" />
            <ScalarWidget {...panel.bind(data, 'masterDb')} label="Master dB" min={-40} max={12} step={0.5} range />
            <PollWidget label="Context" value={output()?.state ?? '-'} />
            <PollWidget
              label="Output"
              value={output() ? `peak ${output().peak.toFixed(3)} rms ${output().rms.toFixed(4)}` : '-'}
            />
            <PollWidget label="Tract" value={stats()?.tract ?? '-'} />
            <PollWidget label="Territory" value={stats()?.territory ?? '-'} />
            <PollWidget label="POI" value={stats()?.poi ?? '-'} />
            <PollWidget label="TOD" value={stats()?.tod ?? '-'} />
            <PollWidget label="Banks" value={stats() ? `${stats().banksLoaded} (${mb(stats().bankBytes)})` : '-'} />
            <PollWidget label="Media" value={stats() ? `${stats().mediaDecoded} (${mb(stats().pcmBytes)} pcm)` : '-'} />
            <PollWidget label="Voices" value={output() ? `${output().voices} (${output().sources} sources)` : '-'} />
            <PollWidget label="Emitters" value={stats() ? `${stats().emittersActive} / ${stats().emitters}` : '-'} />
            <PollWidget label="Pending" value={stats()?.pending ?? '-'} />
            {override('Territory override', 'territory')}
            {override('Tract override', 'tract')}
            {override('TOD override', 'tod')}
            <ListWidget
              label="Beds"
              system={data}
              get={() => data.config.beds}
              set={(list) => (data.config.beds = list)}
            />
            <ListWidget
              label="Music"
              system={data}
              get={() => data.config.music}
              set={(list) => (data.config.music = list)}
            />
            <ConfigNumberWidget
              label="Music dB"
              system={data}
              get={() => data.config.musicDb}
              set={(value) => (data.config.musicDb = value)}
              min={-40}
              max={12}
              step={1}
            />
            <ListWidget
              label="Trigger allow"
              system={data}
              get={() => data.config.triggers.allow}
              set={(list) => (data.config.triggers.allow = list)}
            />
            <ListWidget
              label="Trigger skip"
              system={data}
              get={() => data.config.triggers.skip}
              set={(list) => (data.config.triggers.skip = list)}
            />
            <ListWidget
              label="Bank skip"
              system={data}
              get={() => data.config.banks.skip}
              set={(list) => (data.config.banks.skip = list)}
            />
            <ConfigNumberWidget
              label="Bank max MB"
              system={data}
              get={() => data.config.banks.maxSizeMB}
              set={(value) => (data.config.banks.maxSizeMB = value)}
              min={0}
              max={64}
              step={1}
            />
            <ConfigNumberWidget
              label="Emitter voices"
              system={data}
              get={() => data.config.maxEmitterVoices}
              set={(value) => (data.config.maxEmitterVoices = value)}
              min={0}
              max={64}
              step={1}
            />
            {/* the last log lines, newest first */}
            <Index each={Array.from({ length: 12 })}>
              {(_, i) => <PollWidget label={i === 0 ? 'Log' : ''} value={data.log[data.log.length - 1 - i] ?? ''} />}
            </Index>
          </>
        )
      }}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'Audio',
  propsComponent: AudioSystemProps,
} satisfies UiAnnotation<AudioSystem>

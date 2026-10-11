import type { FactoryComponent } from 'mithril'
import { uiBoolWidget, uiPollWidget, uiScalarWidget, uiStringWidget } from 'tweak-ui'
import type { AudioSystem } from '../../audio/AudioSystem'
import icon from '../icons/timer.svg?raw'
import { type UiAnnotation } from './types'

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`

function listBinding(system: AudioSystem, get: () => string[], set: (list: string[]) => void) {
  return {
    get: () => get().join(', '),
    set: (value: string) => {
      set(
        value
          .split(',')
          .map((it) => it.trim())
          .filter(Boolean),
      )
      system.applyConfig()
    },
  }
}

export const AudioSystemProps: FactoryComponent<{ data: AudioSystem }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      const stats = () => data.engineStats
      const output = () => data.outputStats
      const poll = (label: string, get: () => string | number | null | undefined) =>
        uiPollWidget({
          label,
          value: data,
          binding: { get: () => get() ?? '-' },
        })
      const override = (label: string, field: 'territory' | 'tract' | 'tod') =>
        uiStringWidget({
          label,
          value: data,
          binding: {
            get: () => data.overrides[field] ?? '',
            set: (value: string) => data.setOverrides({ ...data.overrides, [field]: value || undefined }),
          },
        })

      return [
        // enabling resumes the audio context, this runs in the click handler (user gesture)
        uiBoolWidget({ label: 'Enabled', value: data, field: 'enabled' }),
        uiScalarWidget({ label: 'Master dB', value: data, field: 'masterDb', min: -40, max: 12, step: 0.5, range: true }),
        poll('Context', () => output()?.state),
        poll('Output', () => (output() ? `peak ${output().peak.toFixed(3)} rms ${output().rms.toFixed(4)}` : null)),
        poll('Tract', () => stats()?.tract),
        poll('Territory', () => stats()?.territory),
        poll('POI', () => stats()?.poi),
        poll('TOD', () => stats()?.tod),
        poll('Banks', () => (stats() ? `${stats().banksLoaded} (${mb(stats().bankBytes)})` : null)),
        poll('Media', () => (stats() ? `${stats().mediaDecoded} (${mb(stats().pcmBytes)} pcm)` : null)),
        poll('Voices', () => (output() ? `${output().voices} (${output().sources} sources)` : null)),
        poll('Emitters', () => (stats() ? `${stats().emittersActive} / ${stats().emitters}` : null)),
        poll('Pending', () => stats()?.pending),
        override('Territory override', 'territory'),
        override('Tract override', 'tract'),
        override('TOD override', 'tod'),
        uiStringWidget({
          label: 'Beds',
          value: data,
          binding: listBinding(data, () => data.config.beds, (list) => (data.config.beds = list)),
        }),
        uiStringWidget({
          label: 'Music',
          value: data,
          binding: listBinding(data, () => data.config.music, (list) => (data.config.music = list)),
        }),
        uiScalarWidget({
          label: 'Music dB',
          value: data,
          binding: {
            get: () => data.config.musicDb,
            set: (value: number) => {
              data.config.musicDb = value
              data.applyConfig()
            },
          },
          min: -40,
          max: 12,
          step: 1,
        }),
        uiStringWidget({
          label: 'Trigger allow',
          value: data,
          binding: listBinding(data, () => data.config.triggers.allow, (list) => (data.config.triggers.allow = list)),
        }),
        uiStringWidget({
          label: 'Trigger skip',
          value: data,
          binding: listBinding(data, () => data.config.triggers.skip, (list) => (data.config.triggers.skip = list)),
        }),
        uiStringWidget({
          label: 'Bank skip',
          value: data,
          binding: listBinding(data, () => data.config.banks.skip, (list) => (data.config.banks.skip = list)),
        }),
        uiScalarWidget({
          label: 'Bank max MB',
          value: data,
          binding: {
            get: () => data.config.banks.maxSizeMB,
            set: (value: number) => {
              data.config.banks.maxSizeMB = value
              data.applyConfig()
            },
          },
          min: 0,
          max: 64,
          step: 1,
        }),
        uiScalarWidget({
          label: 'Emitter voices',
          value: data,
          binding: {
            get: () => data.config.maxEmitterVoices,
            set: (value: number) => {
              data.config.maxEmitterVoices = value
              data.applyConfig()
            },
          },
          min: 0,
          max: 64,
          step: 1,
        }),
        ...Array.from({ length: 12 }, (_, i) =>
          poll(i === 0 ? 'Log' : '', () => {
            const log = data.log
            return log[log.length - 1 - i] ?? ''
          }),
        ),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'Audio',
  propsComponent: AudioSystemProps,
} satisfies UiAnnotation<AudioSystem>

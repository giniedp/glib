import { createSignal, onCleanup, Show } from 'solid-js'
import { Button, Icon } from 'tweak-ui'
import { audioPreview } from '../../audio/preview'
import svgPlay from '../icons/play.svg?raw'
import svgStop from '../icons/stop.svg?raw'
import { triggerMedia, type TriggerMedia } from './audio'

/**
 * An audio trigger of a cell with a play button. Each click plays the next media the trigger can play (random
 * containers have several), a click while playing stops.
 */
export function AudioButton(props: { trigger: string }) {
  const [version, setVersion] = createSignal(0)
  onCleanup(audioPreview.onChange(() => setVersion((it) => it + 1)))
  const [media, setMedia] = createSignal<TriggerMedia[] | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  let next = 0

  const keyOf = (it: TriggerMedia) => `data:${props.trigger}#${it.id}`
  const playing = () => {
    version()
    const key = audioPreview.playback?.key
    return !!key && !!media()?.some((it) => keyOf(it) === key)
  }

  const toggle = async () => {
    if (playing()) {
      audioPreview.stop()
      return
    }
    try {
      const list = media() ?? (await triggerMedia(props.trigger))
      setMedia(list)
      if (!list.length) {
        setError('No media found for this trigger')
        return
      }
      const it = list[next++ % list.length]
      setError(null)
      await audioPreview.play(keyOf(it), it.load)
      const failed = audioPreview.errors.get(keyOf(it))
      if (failed) {
        setError(failed)
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    }
  }

  const title = () => {
    if (error()) {
      return error()!
    }
    const list = media()
    if (!list) {
      return 'Play'
    }
    return list.length > 1 ? `Play (${list.length} media, each click plays the next)` : 'Play'
  }

  return (
    <span class="nw-data-audio">
      <Button
        ghost
        square
        title={title()}
        classList={{ 'nw-error': !!error() }}
        icon={<Icon svg={playing() ? svgStop : svgPlay} />}
        onClick={() => void toggle()}
      />
      <span class="nw-data-text" classList={{ 'nw-data-dead': media()?.length === 0 }}>
        {props.trigger}
      </span>
      <Show when={(media()?.length ?? 0) > 1}>
        <span class="nw-muted">×{media()!.length}</span>
      </Show>
    </span>
  )
}

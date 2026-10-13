import type { GameSystem } from '@gglib/ecs'
import { Show } from 'solid-js'
import { BoolWidget } from 'tweak-ui'
import icon from '../icons/network-wired.svg?raw'
import { type UiAnnotation } from './types'

export function GameSystemProps(props: { data: GameSystem }) {
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <BoolWidget label="Updatable" value={!!data.update} readonly align="start" />
          <BoolWidget label="Renderable" value={!!data.render} readonly align="start" />
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'GameSystem',
  propsComponent: GameSystemProps,
} satisfies UiAnnotation<GameSystem>

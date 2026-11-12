import { createEffect, For } from 'solid-js'
import { Icon } from 'tweak-ui'
import svgXmark from '../icons/xmark.svg?raw'

export interface TabStripItem {
  id: number
  title: string
  /**
   * Shown on hover, e.g. the full path
   */
  tooltip?: string
  /**
   * Svg markup of the icon
   */
  icon?: string
  /**
   * A temporary tab, its title is italic
   */
  preview?: boolean
}

/**
 * A row of closable tabs, for documents. A click activates a tab, the × or a middle click closes it, a double click
 * keeps a temporary tab. The active tab is scrolled into view.
 */
export function TabStrip(props: {
  items: TabStripItem[]
  active: number | null
  onActivate: (id: number) => void
  onClose: (id: number) => void
  onPersist?: (id: number) => void
}) {
  let strip!: HTMLDivElement

  createEffect(() => {
    const active = props.active
    props.items
    queueMicrotask(() => strip.querySelector(`[data-tab="${active}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }))
  })

  return (
    <div class="nw-tab-strip" role="tablist" ref={strip}>
      <For each={props.items}>
        {(item) => (
          <div
            class="nw-tab"
            role="tab"
            data-tab={item.id}
            title={item.tooltip}
            aria-selected={item.id === props.active}
            classList={{ 'nw-tab-active': item.id === props.active, 'nw-tab-preview': !!item.preview }}
            onClick={() => props.onActivate(item.id)}
            onDblClick={() => props.onPersist?.(item.id)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                props.onClose(item.id)
              }
            }}
            // no autoscroll cursor on middle click
            onMouseDown={(e) => e.button === 1 && e.preventDefault()}
          >
            {item.icon && <Icon svg={item.icon} />}
            <span class="nw-tab-title">{item.title}</span>
            <button
              type="button"
              class="nw-tab-close"
              title="Close (Alt+W)"
              onClick={(e) => {
                e.stopPropagation()
                props.onClose(item.id)
              }}
            >
              <Icon svg={svgXmark} />
            </button>
          </div>
        )}
      </For>
    </div>
  )
}

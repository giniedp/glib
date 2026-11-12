import { createMemo, For, Show } from 'solid-js'
import { BoolInput, Button, Icon } from 'tweak-ui'
import type { AssetType, TypeGroup } from '../../api/browse'
import svgFilter from '../icons/filter.svg?raw'

const GROUP_LABEL: Partial<Record<TypeGroup, string>> = { ui: 'UI', ai: 'AI' }

interface Entry {
  index: number
  type: AssetType
}

interface Group {
  group: TypeGroup
  entries: Entry[]
  count: number
}

/**
 * Picks the asset types to show. An empty selection shows every type that is not hidden (hidden
 * types are parts of other assets, e.g. split texture mips).
 */
export function TypeFilter(props: {
  types: AssetType[]
  selected: ReadonlySet<number>
  onChange: (selected: ReadonlySet<number>) => void
}) {
  let popover!: HTMLDivElement
  let anchor!: HTMLDivElement

  // groups by file count, hidden last; types by file count
  const groups = createMemo(() => {
    const byGroup = new Map<TypeGroup, Group>()
    props.types.forEach((type, index) => {
      let group = byGroup.get(type.group)
      if (!group) {
        group = { group: type.group, entries: [], count: 0 }
        byGroup.set(type.group, group)
      }
      group.entries.push({ index, type })
      group.count += type.count
    })
    const list = [...byGroup.values()]
    for (const group of list) {
      group.entries.sort((a, b) => b.type.count - a.type.count)
    }
    return list.sort((a, b) => Number(a.group === 'hidden') - Number(b.group === 'hidden') || b.count - a.count)
  })

  const title = () => {
    const n = props.selected.size
    if (n === 0) {
      return 'Filter by type: all types'
    }
    if (n === 1) {
      return `Filter by type: ${props.types[[...props.selected][0]]?.label ?? '1 type'}`
    }
    return `Filter by type: ${n} types`
  }

  function set(indices: number[], on: boolean) {
    const next = new Set(props.selected)
    for (const i of indices) {
      if (on) {
        next.add(i)
      } else {
        next.delete(i)
      }
    }
    props.onChange(next)
  }

  function toggle() {
    // below the button, inside the window
    const rect = anchor.getBoundingClientRect()
    popover.style.top = `${rect.bottom + 4}px`
    popover.togglePopover()
    popover.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - popover.offsetWidth - 4))}px`
  }

  return (
    <div class="nw-type-filter" ref={anchor}>
      <Button square accent={props.selected.size > 0} title={title()} icon={<Icon svg={svgFilter} />} onClick={toggle} />
      <div ref={popover} popover="auto" class="nw-type-popover">
        <div class="nw-type-actions">
          <Button ghost disabled={props.selected.size === 0} onClick={() => props.onChange(new Set())}>
            All types
          </Button>
        </div>
        <For each={groups()}>
          {(group) => {
            const indices = () => group.entries.map((e) => e.index)
            const allOn = () => indices().every((i) => props.selected.has(i))
            return (
              <div class="nw-type-group">
                <label class="nw-type-row nw-type-group-head">
                  <BoolInput value={allOn()} onInput={(on) => set(indices(), on)} />
                  <span>{GROUP_LABEL[group.group] ?? group.group}</span>
                  <span class="nw-type-count">{group.count.toLocaleString()}</span>
                </label>
                <For each={group.entries}>
                  {(entry) => (
                    <label class="nw-type-row">
                      <BoolInput value={props.selected.has(entry.index)} onInput={(on) => set([entry.index], on)} />
                      <span classList={{ 'nw-muted': !entry.type.known }}>{entry.type.label}</span>
                      <span class="nw-type-count">{entry.type.count.toLocaleString()}</span>
                    </label>
                  )}
                </For>
              </div>
            )
          }}
        </For>
        <Show when={props.types.length === 0}>
          <p class="nw-note">No types yet</p>
        </Show>
      </div>
    </div>
  )
}

import { createMemo, createResource, createSignal, For, Show, untrack } from 'solid-js'
import { Button, Group, Icon, TextInput } from 'tweak-ui'
import { thumbnailUrl } from '../../../api/browse'
import { LEVEL_CATEGORIES, type LevelCategory, type LevelEntry } from '../../../levels/catalog'
import { loadLevelCatalog } from '../../../levels/load'
import type { NwViewer } from '../../../viewer'
import svgSearch from '../../icons/magnifying-glass.svg?raw'
import svgWarning from '../../icons/triangle-exclamation.svg?raw'
import { currentSceneId, showSceneEntry } from '../content'
import { ModalDialog } from './modalDialog'

/**
 * Thumbnail width in pixels requested from nwbt: 2x the 4rem of the row, for high dpi screens
 */
const THUMBNAIL_SIZE = 128

/**
 * Opens the scene selection: the levels and game mode maps of the level catalog (levels/catalog.ts), grouped like
 * the game modes of nw-buddy. It opens on a click only.
 */
export function ScenesButton(props: { viewer: NwViewer }) {
  const [open, setOpen] = createSignal(false)
  const select = (entry: LevelEntry) => {
    setOpen(false)
    showSceneEntry(props.viewer, entry)
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>Scenes</Button>
      <ModalDialog title="Scenes" open={open()} onClose={() => setOpen(false)}>
        {/* created on the first open, the catalog loads then */}
        <Show when={open()}>
          <SceneList onSelect={select} />
        </Show>
      </ModalDialog>
    </>
  )
}

function SceneList(props: { onSelect: (entry: LevelEntry) => void }) {
  const [catalog] = createResource(loadLevelCatalog)
  const [filter, setFilter] = createSignal('')
  const current = () => currentSceneId()
  // the group of the shown scene starts open, the groups keep their own state (uncontrolled tweak-ui Groups)
  const initiallyOpen = createMemo((): LevelCategory => {
    const shown = catalog()?.entries.find((it) => it.id === untrack(current))
    return shown?.category ?? 'levels'
  })

  const groups = createMemo(() => {
    const entries = catalog()?.entries ?? []
    const query = filter().trim().toLowerCase()
    const matches = query
      ? entries.filter((it) => `${it.title} ${it.subtitle} ${it.coatlicue}`.toLowerCase().includes(query))
      : entries
    return LEVEL_CATEGORIES.map((category) => ({
      ...category,
      entries: matches.filter((it) => it.category === category.id),
    })).filter((it) => it.entries.length)
  })

  return (
    <div class="nw-dialog-content nw-dialog-content-wide nw-scenes">
      <div class="nw-scenes-filter">
        <TextInput
          placeholder="Filter levels and game modes"
          slotBefore={<Icon svg={svgSearch} />}
          onInput={setFilter}
        />
      </div>
      <Show when={!catalog.loading} fallback={<p class="nw-note">Reading the levels…</p>}>
        <Show when={!catalog.error} fallback={<p class="nw-note">The levels could not be loaded.</p>}>
          <For each={groups()} fallback={<p class="nw-note">No matches</p>}>
            {(group) => (
              <Group
                title={`${group.label} (${group.entries.length})`}
                collapsible
                defaultCollapsed={group.id !== initiallyOpen()}
                // while filtering, every group with a match is open; undefined leaves it to the group
                collapsed={filter().trim() ? false : undefined}
              >
                <div class="nw-scene-rows">
                  <For each={group.entries}>
                    {(entry) => (
                      <SceneRow entry={entry} current={entry.id === current()} onClick={() => props.onSelect(entry)} />
                    )}
                  </For>
                </div>
              </Group>
            )}
          </For>
        </Show>
      </Show>
    </div>
  )
}

function SceneRow(props: { entry: LevelEntry; current: boolean; onClick: () => void }) {
  const picture = () => props.entry.image ?? props.entry.icon
  const [failed, setFailed] = createSignal(false)
  return (
    <button
      type="button"
      class="nw-scene-row"
      classList={{ 'nw-scene-row-current': props.current }}
      title={`${props.entry.title} (${props.entry.coatlicue}${props.entry.mission ? `, ${props.entry.mission}` : ''})`}
      onClick={props.onClick}
    >
      <span class="nw-scene-thumb" classList={{ 'nw-scene-thumb-icon': !props.entry.image }}>
        <Show when={picture() && !failed()}>
          <img src={thumbnailUrl(picture(), THUMBNAIL_SIZE)} alt="" loading="lazy" onError={() => setFailed(true)} />
        </Show>
      </span>
      <span class="nw-scene-text">
        <span class="nw-scene-title">{props.entry.title}</span>
        <span class="nw-muted">{props.entry.subtitle}</span>
      </span>
      <Show when={props.entry.mainMenu?.active}>
        <span class="nw-scene-tag">current main menu</span>
      </Show>
      <Show when={props.entry.large}>
        <span
          class="nw-scene-warning"
          title={`A large level (${props.entry.memoryMb} MB projected): it loads long and needs a lot of memory`}
        >
          <Icon svg={svgWarning} />
        </span>
      </Show>
    </button>
  )
}

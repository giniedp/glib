import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import { Icon, Tree } from 'tweak-ui'
import { listFolder, type ListFile } from '../../api/browse'
import svgFolderOpen from '../icons/folder-open.svg?raw'
import svgFolder from '../icons/folder.svg?raw'
import { assetTypes, typeIcon } from './assetTypes'

/**
 * A row of the tree: a folder, a file, or a note in place of files (loading, more, error)
 */
interface Node {
  /**
   * Folders end with `/`, files are their path, notes have their own suffix
   */
  id: string
  name: string
  kind: 'dir' | 'file' | 'note'
  file?: ListFile
}

/**
 * How long a folder loads before it shows "loading…", shorter loads show nothing
 */
const LOADING_DELAY = 150

/**
 * The archive as a tree of folders. Folders load when they are expanded. Double clicking a file opens it.
 */
export function AssetTree(props: {
  /**
   * Type ids to show, empty for every type that is not hidden. A change reloads the tree.
   */
  types?: readonly number[]
  /**
   * The selected file path, or folder path with a trailing `/`
   */
  selected?: string | null
  onSelect?: (file: ListFile | null) => void
  /**
   * A folder was selected (its path without a trailing `/`), instead of {@link onSelect}
   */
  onSelectFolder?: (dir: string) => void
  onOpen?: (file: ListFile) => void
}) {
  const types = assetTypes()
  // folder path ('' is the root) -> rows, filled when the folder is expanded
  const children = new Map<string, Node[]>()
  const [version, setVersion] = createSignal(0)
  const changed = () => setVersion((v) => v + 1)
  const [expanded, setExpanded] = createSignal<ReadonlySet<string>>(new Set())
  // loads of an older filter are dropped
  let generation = 0
  let disposed = false
  onCleanup(() => (disposed = true))

  async function load(dir: string) {
    if (children.has(dir)) {
      return
    }
    const loadGeneration = generation
    const current = () => !disposed && loadGeneration === generation
    children.set(dir, [])
    const timer = setTimeout(() => {
      if (current() && children.get(dir)?.length === 0) {
        children.set(dir, [note(dir, 'loading', 'loading…')])
        changed()
      }
    }, LOADING_DELAY)
    let nodes: Node[]
    try {
      const res = await listFolder(dir, props.types ?? [])
      const prefix = dir ? `${dir}/` : ''
      nodes = [
        ...res.dirs.map((name): Node => ({ id: `${prefix}${name}/`, name, kind: 'dir' })),
        ...res.files.map((file): Node => ({ id: file.path, name: file.name, kind: 'file', file })),
      ]
      if (res.truncated) {
        nodes.push(note(dir, 'more', `… ${(res.total - res.files.length).toLocaleString()} more, use the search`))
      }
    } catch (err) {
      nodes = [note(dir, 'error', 'could not be loaded')]
    } finally {
      clearTimeout(timer)
    }
    if (current()) {
      children.set(dir, nodes)
      changed()
    }
  }

  // the root, again with every expanded folder when the filter changes
  createEffect(
    on(
      () => props.types,
      () => {
        generation++
        children.clear()
        load('')
        for (const id of expanded()) {
          load(id.slice(0, -1))
        }
      },
    ),
  )

  function onExpandedChange(next: ReadonlySet<string>) {
    for (const id of next) {
      if (!expanded().has(id)) {
        load(id.slice(0, -1))
      }
    }
    setExpanded(next)
  }

  const roots = () => {
    version()
    return children.get('') ?? []
  }

  return (
    <Tree<Node>
      class="nw-asset-tree"
      items={roots()}
      version={version()}
      getId={(node) => node.id}
      getLabel={(node) => (
        <span classList={{ 'nw-muted': node.kind === 'note' || (node.kind === 'file' && !node.file.inCatalog) }}>
          {node.name}
        </span>
      )}
      getIcon={(node, open) => {
        if (node.kind === 'note') {
          return null
        }
        const svg = node.kind === 'dir' ? (open ? svgFolderOpen : svgFolder) : typeIcon(types()[node.file.type])
        return <Icon svg={svg} />
      }}
      getChildren={(node) => (node.kind === 'dir' ? (children.get(node.id.slice(0, -1)) ?? []) : null)}
      expanded={expanded()}
      onExpandedChange={onExpandedChange}
      selected={props.selected}
      onSelect={(node) => {
        if (node?.kind === 'dir' && props.onSelectFolder) {
          props.onSelectFolder(node.id.slice(0, -1))
        } else {
          props.onSelect?.(node?.file ?? null)
        }
      }}
      onActivate={(node) => node.file && props.onOpen?.(node.file)}
    />
  )
}

function note(dir: string, kind: string, name: string): Node {
  return { id: `${dir}/…${kind}`, name, kind: 'note' }
}

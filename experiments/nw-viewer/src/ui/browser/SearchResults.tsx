import { createEffect, createSignal, on, onCleanup, Show } from 'solid-js'
import { Icon, Tree } from 'tweak-ui'
import { searchFiles, type ListFile, type SearchResult } from '../../api/browse'
import { assetTypes, typeIcon } from './assetTypes'

function folderOf(path: string) {
  const slash = path.lastIndexOf('/')
  return slash < 0 ? '' : path.slice(0, slash)
}

/**
 * The files whose path contains the query, or whose asset id is the query, as a flat list with their paths
 */
export function SearchResults(props: {
  query: string
  /**
   * Type ids to show, empty for every type that is not hidden
   */
  types: readonly number[]
  selected?: string | null
  onSelect?: (file: ListFile | null) => void
  onOpen?: (file: ListFile) => void
}) {
  const types = assetTypes()
  const [result, setResult] = createSignal<SearchResult | null>(null)
  const [failed, setFailed] = createSignal(false)

  // a new query or filter cancels the running search
  createEffect(
    on([() => props.query, () => props.types], ([query, filter]) => {
      const abort = new AbortController()
      onCleanup(() => abort.abort())
      setFailed(false)
      searchFiles(query, filter, abort.signal).then(setResult, (err) => {
        if (!abort.signal.aborted) {
          setFailed(true)
        }
      })
    }),
  )

  const summary = () => {
    const res = result()
    if (failed()) {
      return 'The search failed'
    }
    if (!res) {
      return 'Searching…'
    }
    if (res.total === 0) {
      return 'No matches'
    }
    const total = res.total.toLocaleString()
    if (res.files.length < res.total) {
      return `${res.files.length.toLocaleString()} of ${total} matches`
    }
    return res.total === 1 ? '1 match' : `${total} matches`
  }

  return (
    <>
      <p class="nw-note nw-search-summary">{summary()}</p>
      <Show when={result()?.files.length}>
        <Tree<ListFile>
          class="nw-asset-tree"
          items={result().files}
          getId={(file) => file.path}
          // the name first: a narrow sidebar cuts the end of the label, the folder matters less
          getLabel={(file) => (
            <>
              <span classList={{ 'nw-muted': !file.inCatalog }}>{file.name}</span>{' '}
              <span class="nw-muted">{folderOf(file.path)}</span>
            </>
          )}
          getIcon={(file) => <Icon svg={typeIcon(types()[file.type])} />}
          selected={props.selected}
          onSelect={(file) => props.onSelect?.(file)}
          onActivate={(file) => props.onOpen?.(file)}
        />
      </Show>
    </>
  )
}

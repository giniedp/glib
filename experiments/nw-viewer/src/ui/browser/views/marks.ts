import { createSignal } from 'solid-js'
import type { HexRange } from '../../common/HexView'
import { browserTabs } from '../tabs'

const [marks, setMarks] = createSignal<ReadonlyMap<string, HexRange>>(new Map())

/**
 * The range marked in the Hex mode of a file, see {@link showBytes}
 */
export function hexMark(path: string): HexRange | undefined {
  return marks().get(path)
}

/**
 * Shows a byte range of a file in its Hex mode: opens the file's tab (or activates it), switches it to Hex and marks
 * the range. E.g. the "bytes" links of the Inspect mode, also for the `.cgfheap` of a model.
 */
export function showBytes(path: string, range: HexRange) {
  setMarks((current) => new Map(current).set(path, { ...range }))
  browserTabs.open({ path })
  const tab = browserTabs.tabs().find((it) => it.path === path)
  if (tab) {
    browserTabs.setMode(tab.id, 'hex')
  }
}

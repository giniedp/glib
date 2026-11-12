import { createEffect, createSignal, For, Index, on, onCleanup, onMount, type JSX } from 'solid-js'
import { TextInput } from 'tweak-ui'

const ROW_BYTES = 16
// Chromium caps element heights near 33M px; longer files scroll proportionally instead
const MAX_SCROLL_PX = 8_000_000

/**
 * A byte range to mark and scroll to
 */
export interface HexRange {
  offset: number
  length: number
}

/**
 * Bytes as offset / hex / ascii rows. Only the visible rows are rendered. `highlight` marks a range
 * and scrolls to it whenever it changes. `tools` are placed next to the go-to input.
 */
export function HexView(props: { bytes: Uint8Array; highlight?: HexRange; tools?: JSX.Element }) {
  let scroller!: HTMLDivElement
  let probe!: HTMLDivElement
  const [rowPx, setRowPx] = createSignal(16)
  const [viewPx, setViewPx] = createSignal(0)
  const [scrollTop, setScrollTop] = createSignal(0)

  const size = () => props.bytes.length
  const rows = () => Math.ceil(size() / ROW_BYTES)
  const contentPx = () => rows() * rowPx()
  const spacerPx = () => Math.min(contentPx(), MAX_SCROLL_PX)
  const visibleRows = () => Math.ceil(viewPx() / rowPx()) + 1
  const scaled = () => contentPx() > spacerPx()
  // scaled: the scroll range maps onto the rows up to the one that shows the end of the file
  const scrollRange = () => Math.max(1, spacerPx() - viewPx())
  const rowRange = () => Math.max(0, rows() - Math.floor(viewPx() / rowPx()))
  const firstRow = () =>
    scaled() ? Math.round((scrollTop() / scrollRange()) * rowRange()) : Math.floor(scrollTop() / rowPx())
  const windowTop = () => (scaled() ? scrollTop() : firstRow() * rowPx())
  const visible = () => {
    const first = firstRow()
    const last = Math.min(rows(), first + visibleRows())
    return Array.from({ length: Math.max(0, last - first) }, (_, i) => first + i)
  }
  const offsetDigits = () => Math.max(8, Math.max(0, size() - 1).toString(16).length)

  function scrollToOffset(offset: number) {
    const row = Math.floor(Math.min(offset, Math.max(0, size() - 1)) / ROW_BYTES)
    // a few rows of context above the target
    const target = Math.max(0, row - 2)
    scroller.scrollTop = scaled()
      ? (Math.min(target, rowRange()) / Math.max(1, rowRange())) * scrollRange()
      : target * rowPx()
  }

  // scroll to a new highlight once the view has a height
  createEffect(
    on([() => props.highlight, viewPx], ([range, height]) => {
      if (range && height > 0) {
        scrollToOffset(range.offset)
      }
    }),
  )

  onMount(() => {
    setRowPx(probe.getBoundingClientRect().height || 16)
    // tabs stay mounted while hidden: the height is 0 then and updates when they show again
    const observer = new ResizeObserver(() => setViewPx(scroller.clientHeight))
    observer.observe(scroller)
    onCleanup(() => observer.disconnect())
  })

  return (
    <div class="nw-hex-view">
      <div class="nw-view-bar">
        <TextInput
          class="nw-hex-goto"
          placeholder="Go to offset (0x… or decimal)"
          onChange={(text) => {
            const offset = parseOffset(text)
            if (offset !== undefined) {
              scrollToOffset(offset)
            }
          }}
        />
        {props.tools}
      </div>
      <div class="nw-hex-scroll" ref={scroller} onScroll={() => setScrollTop(scroller.scrollTop)}>
        <div class="nw-hex-row nw-hex-probe" ref={probe}>
          0
        </div>
        <div style={{ height: `${spacerPx()}px` }} />
        {/* scaled, the window sits at the scroll position; clipped, so its last row adds no scroll */}
        <div class="nw-hex-window" style={{ top: `${windowTop()}px`, height: scaled() ? `${viewPx()}px` : undefined }}>
          <For each={visible()}>
            {(row) => (
              <HexRow
                offset={row * ROW_BYTES}
                digits={offsetDigits()}
                bytes={props.bytes.subarray(row * ROW_BYTES, row * ROW_BYTES + ROW_BYTES)}
                highlight={props.highlight}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

function HexRow(props: { offset: number; digits: number; bytes: Uint8Array; highlight?: HexRange }) {
  const marked = (i: number) => {
    const h = props.highlight
    const at = props.offset + i
    return !!h && at >= h.offset && at < h.offset + h.length
  }
  const cells = () => Array.from(props.bytes)
  return (
    <div class="nw-hex-row">
      <span class="nw-hex-offset">{props.offset.toString(16).padStart(props.digits, '0')}</span>
      <span class="nw-hex-bytes">
        <Index each={cells()}>
          {(b, i) => (
            <span classList={{ 'nw-hex-zero': b() === 0, 'nw-hex-gap': i === 8, 'nw-hex-mark': marked(i) }}>
              {b().toString(16).padStart(2, '0')}
            </span>
          )}
        </Index>
      </span>
      <span>{ascii(props.bytes)}</span>
    </div>
  )
}

function ascii(bytes: Uint8Array) {
  let s = ''
  for (const b of bytes) {
    s += b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.'
  }
  return s
}

/**
 * `0x1f0`, `1f0h` or `496`; undefined when it is neither
 */
function parseOffset(text: string): number | undefined {
  const t = text.trim().toLowerCase()
  const hex = /^0x([0-9a-f]+)$/.exec(t) ?? /^([0-9a-f]+)h$/.exec(t)
  if (hex) {
    return parseInt(hex[1], 16)
  }
  if (/^\d+$/.test(t)) {
    return parseInt(t, 10)
  }
  return undefined
}

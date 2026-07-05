import type { Children, FactoryComponent, Vnode } from 'mithril'
import {
  getControlValue,
  h,
  setControlValue,
  uiButton,
  uiFlex,
  uiGrid,
  uiWidget,
  type ValueWidgetAttrs,
} from 'tweak-ui'

/**
 * Describes a checkbox control
 * @public
 */
export interface BitmaskAttrs<T = unknown> extends ValueWidgetAttrs<T, number> {
  /**
   * This is called when the control value changes
   */
  onchange?: (model: T, value: number) => void

  /**
   * This is called when the control value changes
   */
  oninput?: (model: T, value: number) => void

  /**
   * Disables the control input
   */
  disabled?: boolean

  /**
   * The number of bits in the mask
   */
  bitCount?: number
}

export function uiBitmask<T>(attrs: BitmaskAttrs<T>, children?: Children): Vnode<BitmaskAttrs<T>> {
  return h(BooleanComponent as any, attrs as any, children)
}

export const BooleanComponent: FactoryComponent<BitmaskAttrs> = () => {
  let attrs: BitmaskAttrs

  function getBitCount() {
    return attrs.bitCount || 32
  }

  function toggleBit(index: number) {
    let value = getControlValue(attrs)
    value = value ^ (1 << index)
    emitChange(value)
  }

  function setAllBits() {
    const bitCount = getBitCount()
    let value = getControlValue(attrs)
    for (let i = 0; i < bitCount; i++) {
      value = value | (1 << i)
    }
    emitChange(value)
  }

  function clearAllBits() {
    const bitCount = getBitCount()
    let value = getControlValue(attrs)
    for (let i = 0; i < bitCount; i++) {
      value = value & ~(1 << i)
    }
    emitChange(value)
  }

  function emitChange(value: number) {
    setControlValue(attrs, value)
    attrs.oninput?.(attrs.value, value)
    attrs.onchange?.(attrs.value, value)
  }

  function isBitSet(value: number, index: number) {
    return (value & (1 << index)) !== 0
  }

  return {
    view: (node) => {
      attrs = node.attrs
      const bitCount = getBitCount()
      const value = getControlValue(attrs)
      const columns = Math.min(Math.ceil(Math.sqrt(bitCount)), 10)
      const rows = Math.ceil(bitCount / columns)
      return uiWidget(
        {
          label: attrs.label,
        },
        [
          h('div', {}, [
            uiGrid(
              { columns, rows },
              Array.from({ length: bitCount }, (_, i) => {
                return uiButton(
                  {
                    onclick: () => toggleBit(i),
                  },
                  h(
                    'span',
                    {
                      class: isBitSet(value, i) ? 'twk-color-accent' : 'twk-color-content',
                    },
                    i,
                  ),
                )
              }),
            ),
            uiFlex({ flow: 'row' }, [
              uiButton(
                {
                  onclick: setAllBits,
                },
                'Select All',
              ),
              uiButton(
                {
                  onclick: clearAllBits,
                },
                'Deselect All',
              ),
            ]),
          ]),
        ],
      )
    },
  }
}

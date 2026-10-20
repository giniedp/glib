import type { Tunable, Vec4 } from '../types'

/**
 * A color: a CSS hex string (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`), an rgba vector in [0, 1] or a vec4 uniform
 * @public
 */
export type ColorInput = string | Tunable<Vec4>

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Parses a CSS hex color into an rgba vector in [0, 1]. The values are used as they are, without gamma conversion
 * @public
 */
export function parseColor(hex: string): Vec4 {
  const match = HEX.exec(hex.trim())
  if (!match) {
    throw new Error(`Invalid color '${hex}', use #rgb, #rgba, #rrggbb or #rrggbbaa`)
  }
  let digits = match[1]
  if (digits.length <= 4) {
    digits = digits.replace(/./g, (it) => it + it)
  }
  if (digits.length === 6) {
    digits += 'ff'
  }
  const channel = (index: number) => parseInt(digits.slice(index * 2, index * 2 + 2), 16) / 255
  return [channel(0), channel(1), channel(2), channel(3)]
}

/**
 * Resolves a {@link ColorInput} to a vec4 constant or uniform
 * @public
 */
export function toColor(input: ColorInput): Tunable<Vec4> {
  if (typeof input === 'string') {
    return parseColor(input)
  }
  return input
}

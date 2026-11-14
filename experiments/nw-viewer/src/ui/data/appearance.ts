/**
 * Appearance rows (armor, weapon and accessory appearances) as material parameters: the blend mask colors of the
 * row replace the `Mask_*` public params of the model's materials. Ported from openworld
 * `ow-datamanagers/src/items/appearance_material.rs` (`AppearanceMaterials::from_row`), `source/color.rs`
 * (`appearance_linear`) and `ow-animations/src/character_instance.rs` (`apply_material_descriptor`).
 */

/**
 * Public params of an `.mtl` by name, as `formats/mtl` reads them: numbers, colors as `r,g,b`
 */
export type MaterialParams = Record<string, string | number>

/**
 * Reads a cell of the appearance row by column name: its text, '' when empty or missing
 */
export type RowText = (column: string) => string

/**
 * The columns an appearance row needs to be one
 */
export function isAppearanceRow(text: RowText) {
  return ['MaskRColor', 'MaskR', 'MaskGColor', 'MaskBColor'].some((column) => text(column) !== '')
}

/**
 * The material params of an appearance row. `dyed` takes the dye masks of the row (`Mask{R,G,B}Dye`, …) as the game
 * does for a dyed item, the colors stay the row's (no dye colors here).
 *
 * @returns the params, null when a color does not parse (the game rejects the row)
 */
export function appearanceParams(text: RowText, dyed = false): MaterialParams | null {
  const strength = (column: string) => {
    const value = Number(text(column))
    // the game's comparisons map NaN to zero
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0
  }
  const colors = ['MaskRColor', 'MaskGColor', 'MaskBColor', 'MaskASpecColor'].map((column) => appearanceLinear(text(column)))
  if (colors.some((it) => it == null)) {
    return null
  }
  const [r, g, b, spec] = colors as number[][]
  const overrides = dyed
    ? [strength('MaskROverride'), strength('MaskGDyeOverride'), strength('MaskBDyeOverride')]
    : [strength('MaskROverride'), strength('MaskGOverride'), strength('MaskBOverride')]
  const masks = dyed
    ? [strength('MaskRDye'), strength('MaskGDye'), strength('MaskBDye')]
    : [strength('MaskR'), strength('MaskG'), strength('MaskB')]
  const specStrength = dyed ? strength('MaskASpecDye') : strength('MaskASpec')
  const glossShift = text('MaskAGlossShift') === '' ? 0.5 : strength('MaskAGlossShift')

  const params: MaterialParams = {}
  ;[r, g, b].forEach((color, i) => {
    const channel = 'RGB'[i]
    params[`Mask_${channel}_Color`] = rgb(color)
    params[`Mask_${channel}_Override`] = overrides[i]
    params[`Mask_${channel}`] = masks[i]
  })
  params.Mask_A_Gloss = strength('MaskAGloss')
  params.Mask_A_GlossShift = glossShift
  params.Mask_A_SpecColor_Override = specStrength
  params.Mask_A_SpecColor = rgb(spec)
  return params
}

function rgb(color: number[]) {
  return `${color[0]},${color[1]},${color[2]}`
}

/**
 * An appearance color as linear rgba: `#rrggbb[aa]` or decimal `r,g,b[,a]`, 0-255, sRGB converted with exponent 2.2
 * (alpha stays linear). Text shorter than 7 characters is white.
 *
 * @returns null when it has fewer than three components or a component without digits
 */
export function appearanceLinear(text: string): number[] | null {
  if (text.length < 7) {
    return [1, 1, 1, 1]
  }
  let components: string[]
  let radix: number
  if (text.includes('#')) {
    components = [text.slice(1, 3), text.slice(3, 5), text.slice(5, 7)]
    if (text.length > 7) {
      components.push(text.slice(7, 9))
    }
    radix = 16
  } else {
    components = text.split(',')
    if (components.at(-1) === '') {
      // split_terminator: a trailing separator adds no component
      components.pop()
    }
    radix = 10
  }
  if (components.length < 3) {
    return null
  }
  const channels = components.slice(0, 4).map((it) => unsignedPrefix(it, radix))
  if (channels.some((it) => it == null)) {
    return null
  }
  const [r, g, b, a] = channels.map((it) => it! / 255)
  return [r ** 2.2, g ** 2.2, b ** 2.2, a ?? 1]
}

/**
 * The leading digits of a number (C `strtoul` like: leading space, a sign, `0x` for hex), null without digits
 */
function unsignedPrefix(value: string, radix: number): number | null {
  let digits = value.replace(/^[ \t\r\n\v\f]+/, '')
  let negative = false
  if (digits.startsWith('-')) {
    negative = true
    digits = digits.slice(1)
  } else if (digits.startsWith('+')) {
    digits = digits.slice(1)
  }
  if (radix === 16 && /^0x[0-9a-f]/i.test(digits)) {
    digits = digits.slice(2)
  }
  const match = (radix === 16 ? /^[0-9a-f]+/i : /^[0-9]+/).exec(digits)
  if (!match) {
    return null
  }
  const raw = Math.min(parseInt(match[0], radix), 0xffffffff)
  // a negated unsigned wraps
  return negative ? (0x100000000 - raw) % 0x100000000 : raw
}

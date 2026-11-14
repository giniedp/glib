import { describe, expect, it } from 'vitest'
import { appearanceLinear, appearanceParams, isAppearanceRow } from './appearance'

describe('appearanceLinear', () => {
  it('reads hex with exponent 2.2, alpha linear', () => {
    const [r, g, b, a] = appearanceLinear('#ff8000')!
    expect(r).toBeCloseTo(1)
    expect(g).toBeCloseTo((128 / 255) ** 2.2)
    expect(b).toBe(0)
    expect(a).toBe(1)
    expect(appearanceLinear('#ff800080')![3]).toBeCloseTo(128 / 255)
  })

  it('reads decimal components', () => {
    const [r, g, b] = appearanceLinear('255,128,0')!
    expect(r).toBeCloseTo(1)
    expect(g).toBeCloseTo((128 / 255) ** 2.2)
    expect(b).toBe(0)
  })

  it('is white below 7 characters', () => {
    expect(appearanceLinear('')).toEqual([1, 1, 1, 1])
    expect(appearanceLinear('#fff')).toEqual([1, 1, 1, 1])
  })

  it('rejects fewer than three components or no digits', () => {
    expect(appearanceLinear('255,128')).toBeNull()
    expect(appearanceLinear('#zz0000')).toBeNull()
  })
})

describe('appearanceParams', () => {
  const row: Record<string, string> = {
    MaskRColor: '#e30440',
    MaskGColor: '#b8b8b8',
    MaskBColor: '#b8b8b8',
    MaskASpecColor: '#ffffff',
    MaskR: '1',
    MaskROverride: '0.05',
    MaskRDye: '0.5',
    MaskGDyeOverride: '2',
    MaskASpec: '-1',
  }
  const text = (column: string) => row[column] ?? ''

  it('maps the row to the Mask_* public params', () => {
    const params = appearanceParams(text)!
    expect(params.Mask_R).toBe(1)
    expect(params.Mask_R_Override).toBe(0.05)
    expect(params.Mask_R_Color).toBe(`${(227 / 255) ** 2.2},${(4 / 255) ** 2.2},${(64 / 255) ** 2.2}`)
    // clamped to 0..1
    expect(params.Mask_A_SpecColor_Override).toBe(0)
    // empty gloss shift is 0.5
    expect(params.Mask_A_GlossShift).toBe(0.5)
    expect(isAppearanceRow(text)).toBe(true)
  })

  it('takes the dye masks when dyed, the red override stays', () => {
    const params = appearanceParams(text, true)!
    expect(params.Mask_R).toBe(0.5)
    expect(params.Mask_R_Override).toBe(0.05)
    expect(params.Mask_G_Override).toBe(1)
  })
})

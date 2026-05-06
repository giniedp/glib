import { Device, Material, MaterialOptions } from '@gglib/graphics'

export type MaterialType = new (device: Device, options: MaterialOptions) => Material<any>
export type MaterialMatcher = (asset: MaterialOptions) => boolean
export class MaterialRegistry {
  private index: MaterialFactory[] = []

  public register(type: MaterialType, match: MaterialMatcher): void
  public register(spec: MaterialFactory): void
  public register(spec: MaterialFactory | MaterialType, match?: MaterialMatcher): void {
    if (!match) {
      this.index.push(spec as MaterialFactory)
      return
    }
    this.index.push({
      match,
      create: (device: Device, asset: MaterialOptions) => new (spec as MaterialType)(device, asset),
    })
  }

  public find(asset: MaterialOptions): MaterialFactory | null {
    for (const entry of this.index) {
      if (entry.match(asset)) {
        return entry
      }
    }
    return null
  }
}

export interface MaterialFactory {
  match: MaterialMatcher
  create: (device: Device, asset: MaterialOptions) => Material<any>
}

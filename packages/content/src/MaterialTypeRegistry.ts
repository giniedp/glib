import { Device, Material, MaterialEffectNameOptions, MaterialOptions } from '@gglib/graphics'

export class MaterialTypeRegistry {
  private materials: MaterialTypeDescriptor[] = []
  public register(spec: MaterialTypeDescriptor) {
    this.materials.push(spec)
  }

  public findDescriptor(type: string): MaterialTypeDescriptor | null {
    if (!type) {
      return null
    }
    for (const material of this.materials) {
      if (material.name === type) {
        return material
      }
    }
    return null
  }

  public findType(type: string): MaterialType | null {
    if (!type) {
      return null
    }
    for (const material of this.materials) {
      if (material.name === type) {
        return material.type
      }
    }
    return null
  }
}

export type MaterialType = new (device: Device, options: MaterialOptions) => Material

export interface MaterialTypeDescriptor {
  name: string
  type: MaterialType
  convert?: (options: MaterialEffectNameOptions) => Exclude<MaterialOptions, MaterialEffectNameOptions>
}

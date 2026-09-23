import type { Device } from '../Device'
import { BasicMaterial } from './BasicMaterial'
import { Material, MaterialOptions } from './Material'

export function createMaterials(device: Device, materials: Array<Material | MaterialOptions>): Material[] {
  const result: Material[] = []
  if (!materials || !materials.length) {
    return result
  }
  for (const material of materials) {
    result.push(createMaterialInstance(device, material))
  }
  return result
}

export function createMaterialInstance(device: Device, options: Material | MaterialOptions): Material {
  if (!options) {
    throw new Error('Material options are required')
  }
  if (options instanceof Material) {
    return options
  }
  if (options.effect) {
    return new Material(null as any, options)
  }
  if (options.factory) {
    return options.factory(device, options)
  }
  return new BasicMaterial(device, options)
}

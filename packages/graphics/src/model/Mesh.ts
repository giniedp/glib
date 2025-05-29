import { BoundingBox, BoundingSphere } from '@gglib/math'
import { uuid } from '@gglib/utils'

import { Geometry, GeometryOptions } from './Geometry'

import { Device } from '../Device'
import { Material, MaterialOptions } from '../Material'

/**
 * @public
 */
export interface MeshOptions {
  /**
   * The identifying name of the mesh
   */
  name?: string
  /**
   * The axis aligned bounding box containing all mesh parts
   */
  boundingBox?: number[] | BoundingBox
  /**
   * The bounding sphere containing all mesh parts
   */
  boundingSphere?: number[] | BoundingSphere
  /**
   * Collection of materials that are used by the mesh
   */
  materials?: Array<Material | MaterialOptions>
  /**
   * Collection of mesh parts
   */
  parts?: Array<Geometry | GeometryOptions>
}

/**
 * @public
 */
export class Mesh {
  /**
   * Autmatically generated unique identifier
   */
  public readonly uid: string

  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * The models local bounding box
   */
  public boundingBox: BoundingBox

  /**
   * The models local bounign sphere
   */
  public boundingSphere: BoundingSphere

  /**
   * Collection of materials that are used by the model meshes
   */
  public materials: ReadonlyArray<Material>

  /**
   * Collection of meshes
   */
  public parts: ReadonlyArray<Geometry>

  /**
   * The index of the parent bone for this mesh
   */
  public boneId: number | null = null

  /**
   * The name of this mesh
   */
  public name: string | null

  constructor(device: Device, options: MeshOptions) {
    this.uid = uuid()
    this.device = device
    this.name = options.name
    this.boundingBox = BoundingBox.convert(options.boundingBox)
    this.boundingSphere = BoundingSphere.convert(options.boundingSphere)
    this.parts = convertMeshParts(device, options.parts)
    this.materials = convertMaterials(device, options.materials)
  }

  /**
   * Simply iterates over all meshes and renders each with its assigned material
   *
   * @remarks
   * If a mesh points to a missing material it is silently ignored.
   */
  public draw(): this {
    const parts = this.parts
    let part: Geometry
    let material: Material
    for (let i = 0; i < parts.length; i++) {
      part = parts[i]
      material = this.getMaterial(part.materialId || 0)
      if (material) {
        material.draw(part)
      }
    }
    return this
  }

  /**
   * Gets a material of this mesh by index or name
   *
   * @param indexOrName - The index or name of the material
   */
  public getMaterial(indexOrName: number | string): Material {
    return this.materials[indexOrName] || this.materials.find((it) => it.name === indexOrName)
  }

  public dispose() {
    for (const part of this.parts) {
      part.dispose()
    }
    for (const material of this.materials) {
      material.dispose()
    }
    this.parts = []
    this.materials = []
  }
}

function convertMeshParts(device: Device, parts: Array<Geometry | GeometryOptions>): Geometry[] {
  const result: Geometry[] = []
  if (!parts || !parts.length) {
    return result
  }
  for (const mesh of parts) {
    if (mesh instanceof Geometry) {
      result.push(mesh)
    } else {
      result.push(new Geometry(device, mesh))
    }
  }
  return result
}

function convertMaterials(device: Device, materials: Array<Material | MaterialOptions>): Material[] {
  const result: Material[] = []
  if (!materials || !materials.length) {
    return result
  }
  for (const material of materials) {
    if (material instanceof Material) {
      result.push(material)
    } else {
      result.push(new Material(device, material))
    }
  }
  return result
}

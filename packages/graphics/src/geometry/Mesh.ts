import { BoundingBox, BoundingSphere } from '@gglib/math'
import { uuid } from '@gglib/utils'
import { BufferLayout } from '../BufferLayout'
import { Device } from '../Device'
import { createMaterials, Material, MaterialEffectOptions, MaterialOptions } from '../effects'
import { RenderEncoder } from '../RenderEncoder'
import { Geometry, GeometryOptions } from './Geometry'
import { MeshInstances, MeshInstancesOptions } from './MeshInstances'

/**
 * @public
 */
export interface MeshOptions {
  /**
   * The identifying name of the mesh
   */
  name?: string

  /**
   * Custom meta data
   */
  meta?: Record<string, any>

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
  materials?: Array<Material | MaterialEffectOptions | MaterialOptions>

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
   * The name of this mesh
   */
  public name: string | null

  /**
   *
   */
  public meta?: Record<string, any>

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
  public materials: Material[]

  /**
   * Collection of meshes
   */
  public parts: Geometry[]

  /**
   * The index of the parent bone for this mesh
   */
  public boneId: number | null = null

  /**
   * Optional instance data for this mesh. If set, the mesh will be rendered with instancing and the instance
   * data will be passed to the material as a vertex buffer with the same layout as specified in the material input.
   */
  public instances: MeshInstances | null = null

  public constructor(device: Device, options: MeshOptions) {
    this.uid = uuid()
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}
    this.parts = convertGeometries(device, options.parts)
    this.materials = createMaterials(device, options.materials)
    if (options.boundingBox) {
      this.boundingBox = BoundingBox.convert(options.boundingBox)
    }
    if (options.boundingSphere) {
      this.boundingSphere = BoundingSphere.convert(options.boundingSphere)
    }
    if (!this.boundingBox) {
      this.boundingBox = BoundingBox.mergeBoxes(...this.parts.map((it) => it.boundingBox))
    }
    if (!this.boundingSphere) {
      this.boundingSphere = BoundingSphere.mergeSpheres(...this.parts.map((it) => it.boundingSphere))
    }
  }

  /**
   * Calls render with default render pass of the device
   */
  public draw() {
    this.render(this.device.renderPass)
  }

  /**
   * Iterates over all meshes and renders each with its assigned material
   *
   * @remarks
   * If a mesh points to a missing material it is silently ignored.
   */
  public render(pass: RenderEncoder): this {
    const parts = this.parts
    let part: Geometry
    let material: Material
    for (let i = 0; i < parts.length; i++) {
      part = parts[i]
      material = this.getMaterial(part.materialId || 0)
      if (!material) {
        console.warn(`Skipped Mesh rendering because material with id ${part.materialId} is missing`)
        continue
      }
      const effect = material.effect
      if (!effect) {
        console.warn(`Skipped Mesh rendering because material '${material.name}' has no effect`)
        continue
      }
      effect.draw(pass, part, material.inputs)
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

  /**
   * Adds an `instances` property that enables instanced rendering for this mesh
   *
   * @returns this instance but typed as `InstancedMesh` with an `instances` property
   */
  public enableInstancing<T extends BufferLayout>(options: MeshInstancesOptions<T>): InstancedMesh<T> {
    const result = this as unknown as InstancedMesh<T>
    result.instances = new MeshInstances<T>(options)
    return result
  }
}

export type InstancedMesh<T extends BufferLayout> = Mesh & { instances: MeshInstances<T> }

function convertGeometries(device: Device, parts: Array<Geometry | GeometryOptions>): Geometry[] {
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

export type MeshPart = {
  geometryId: number
  materialId: number
}

export type ResolvedMeshPart = {
  geometry: Geometry
  material: Material
  instances?: MeshInstances
}

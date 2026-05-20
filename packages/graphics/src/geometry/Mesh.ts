import { BoundingBox, BoundingSphere } from '@gglib/math'
import { uuid } from '@gglib/utils'
import { BufferLayout } from '../BufferLayout'
import { Device } from '../Device'
import { createMaterials, Material, MaterialEffectOptions, MaterialOptions } from '../effects'
import { RenderEncoder } from '../RenderEncoder'
import { Geometry, GeometryOptions } from './Geometry'
import { MeshInstances, MeshInstancesOptions } from './MeshInstances'

/**
 * Constructor options for {@link Mesh}
 *
 * @public
 */
export interface MeshOptions {
  /**
   * A user defined name for this mesh
   */
  name?: string

  /**
   * Arbitrary user defined metadata attached to this mesh
   */
  meta?: Record<string, any>

  /**
   * The axis aligned bounding box containing the mesh in local space.
   * If omitted, it is computed from the bounding boxes of all geometries.
   */
  boundingBox?: number[] | BoundingBox

  /**
   * The axis aligned bounding box containing the mesh in local space.
   * If omitted, it is computed from the bounding boxes of all geometries.
   */
  boundingSphere?: number[] | BoundingSphere

  /**
   * The materials available to this mesh, referenced by index from each {@link MeshPart}.
   * Accepts already constructed {@link Material} instances or material option objects.
   */
  materials?: Array<Material | MaterialEffectOptions | MaterialOptions>

  /**
   * The geometries available to this mesh, referenced by index from each {@link MeshPart}.
   * Accepts already constructed {@link Geometry} instances or geometry option objects.
   */
  geometries?: Array<Geometry | GeometryOptions>

  /**
   * The parts that make up this mesh, each pairing a geometry with a material by index.
   * See {@link MeshPart}.
   */
  parts?: Array<MeshPart>

  /**
   * An alternative to providing `geometries` and `parts` separately.
   * Each entry carries geometry data and a material index, which the mesh assembles
   * into `geometries` and `parts` internally.
   * Cannot be used together with `geometries` or `parts`.
   */
  partImports?: Array<MeshPartImport>
}

/**
 * A renderable mesh consisting of geometries, materials, and parts that bind them together.
 *
 * @remarks
 * A mesh owns a collection of {@link Geometry} objects and {@link Material} objects,
 * which are combined into {@link MeshPart} entries that pair them by index.
 * This allows multiple parts to share geometries or materials within the same mesh.
 *
 * For simple use cases, {@link Mesh.draw} renders all parts directly using the device's
 * current render pass. For more advanced rendering, {@link Mesh.render} accepts an
 * explicit {@link RenderEncoder}, and parts can be resolved into {@link ResolvedMeshPart}
 * objects for use in external render pipelines.
 *
 * @public
 */
export class Mesh {
  /**
   * Automatically generated unique identifier
   */
  public readonly uid: string

  /**
   * The graphics device that owns this mesh
   */
  public readonly device: Device

  /**
   * A user defined name for this mesh
   */
  public name: string | null

  /**
   * Arbitrary user defined metadata attached to this mesh
   */
  public meta: Record<string, any>

  /**
   * The axis aligned bounding box containing the mesh in local space
   */
  public boundingBox: BoundingBox

  /**
   * The bounding sphere containing the mesh in local space
   */
  public boundingSphere: BoundingSphere

  /**
   * The materials available to this mesh, referenced by index from each {@link MeshPart}
   */
  public materials: Material[]

  /**
   * The geometries available to this mesh, referenced by index from each {@link MeshPart}
   */
  public geometries: Geometry[]

  /**
   * The parts that make up this mesh, each pairing a geometry with a material by index
   */
  public parts: MeshPart[]

  /**
   * The index of the parent bone for this mesh, if used in a skinned model
   */
  public boneId: number | null = null

  /**
   * Optional instance data for instanced rendering.
   * If set, all parts of this mesh will be rendered with instancing.
   * See {@link Mesh.enableInstancing}.
   */
  public instances: MeshInstances | null = null

  public constructor(device: Device, options: MeshOptions) {
    this.uid = uuid()
    this.device = device
    this.name = options.name
    this.meta = options.meta || {}

    const hasExplicit = options.geometries != null || options.parts != null
    const hasImports = options.partImports != null

    if (hasExplicit && hasImports) {
      throw new Error(`MeshOptions: 'partImports' cannot be combined with 'geometries' or 'parts'`)
    }

    if (hasImports) {
      this.geometries = options.partImports.map((it) => {
        return convertGeometry(device, it.geometry)
      })
      this.parts = options.partImports.map((it, index) => {
        return {
          geometryIndex: index,
          materialIndex: it.materialIndex,
        }
      })
    } else {
      this.geometries = convertGeometries(device, options.geometries)
      this.parts = options.parts.map((part) => ({ ...part }))
    }

    this.materials = createMaterials(device, options.materials)

    if (options.boundingBox) {
      this.boundingBox = BoundingBox.convert(options.boundingBox)
    }

    if (options.boundingSphere) {
      this.boundingSphere = BoundingSphere.convert(options.boundingSphere)
    }

    if (!this.boundingBox) {
      this.boundingBox = BoundingBox.mergeBoxes(...this.geometries.map((it) => it.boundingBox))
    }

    if (!this.boundingSphere) {
      this.boundingSphere = BoundingSphere.mergeSpheres(...this.geometries.map((it) => it.boundingSphere))
    }
  }

  /**
   * Renders all parts using the device's current render pass.
   * Equivalent to calling {@link Mesh.render} with {@link Device.renderPass}.
   */
  public draw(): void {
    this.render(this.device.renderPass)
  }

  /**
   * Renders all parts using the given {@link RenderEncoder}.
   *
   * @remarks
   * Iterates over all {@link MeshPart} entries, resolves each to its geometry and material,
   * and issues a draw call. Parts referencing missing geometries, materials, or materials
   * without an effect are silently skipped with a console warning.
   */
  public render(pass: RenderEncoder): void {
    const parts = this.parts
    let geometry: Geometry
    let material: Material

    for (const part of parts) {
      geometry = this.geometries[part.geometryIndex]
      material = this.materials[part.materialIndex]

      if (!geometry) {
        console.warn(`Mesh part references missing geometry with index ${part.geometryIndex}`)
        continue
      }

      if (!material) {
        console.warn(`Mesh part references missing material with index ${part.materialIndex}`)
        continue
      }

      if (!material.effect) {
        console.warn(`Mesh part references material '${material.name}' that has no effect`)
        continue
      }

      material.effect.applyInputs(material.inputBlocks)
      material.effect.draw(pass, geometry)
    }
  }

  /**
   * Releases all geometries and materials owned by this mesh.
   */
  public dispose(): void {
    for (const geometry of this.geometries) {
      geometry.dispose()
    }
    for (const material of this.materials) {
      material.dispose()
    }
    this.geometries = []
    this.materials = []
  }

  /**
   * Enables instanced rendering for this mesh.
   *
   * @remarks
   * Attaches instance data to the mesh and returns it typed as {@link InstancedMesh},
   * which guarantees the {@link Mesh.instances} property is non-null.
   */
  public enableInstancing<T extends BufferLayout>(options: MeshInstancesOptions<T>): InstancedMesh<T> {
    const result = this as unknown as InstancedMesh<T>
    result.instances = new MeshInstances<T>(options)
    return result
  }
}

export type InstancedMesh<T extends BufferLayout> = Mesh & { instances: MeshInstances<T> }

function convertGeometries(device: Device, parts: Array<Geometry | GeometryOptions>): Geometry[] {
  if (!parts || !parts.length) {
    return []
  }
  return parts.map((part) => convertGeometry(device, part))
}

function convertGeometry(device: Device, part: Geometry | GeometryOptions): Geometry {
  if (part instanceof Geometry) {
    return part
  } else {
    return new Geometry(device, part)
  }
}

/**
 * Pairs a geometry with a material within a {@link Mesh}.
 *
 * Both indices refer to the respective arrays on the owning {@link Mesh}.
 *
 * @public
 */
export type MeshPart = {
  /**
   * Index into {@link Mesh.geometries}
   */
  geometryIndex: number

  /**
   * Index into {@link Mesh.materials}
   */
  materialIndex: number
}

/**
 * A resolved {@link MeshPart} where indices have been replaced with the actual objects.
 *
 * Useful when the geometry and material need to be accessed together without
 * the context of the owning {@link Mesh}.
 *
 * @public
 */
export type ResolvedMeshPart = {
  /**
   * The geometry to render
   */
  geometry: Geometry

  /**
   * The material to render with
   */
  material: Material

  /**
   * Optional instance data. If set, the part will be rendered with instancing.
   */
  instances?: MeshInstances
}

/**
 * Transient type used when importing geometry through a loader.
 *
 * Carries cpu-side geometry data and a material index together across the loader boundary,
 * before being assembled into a {@link Mesh} with proper {@link MeshPart} entries.
 *
 * @public
 */
export type MeshPartImport = {
  /**
   * The geometry data or an already constructed {@link Geometry}
   */
  geometry: GeometryOptions | Geometry

  /**
   * Index into the target {@link Mesh.materials} array
   */
  materialIndex: number
}

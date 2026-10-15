import { BoundingBox, BoundingSphere } from '@gglib/math'
import { uuid } from '@gglib/utils'
import { Device } from '../Device'
import { createMaterialInstance, Material, MaterialOptions } from '../effects'
import { disposeUnclaimed, ResourceOwnerSet, type Ownable } from '../resources'
import { RenderEncoder } from '../RenderEncoder'
import { Geometry, GeometryOptions } from './Geometry'

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
  materials?: Array<Material | MaterialOptions>

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
 * Geometries and materials that are passed in as instances are borrowed. Those created from options
 * are owned by the mesh and are owned by a scope together with the mesh.
 *
 * @public
 */
export class Mesh implements Ownable {
  /**
   * The owners of this mesh
   */
  public readonly owners: ResourceOwnerSet = new ResourceOwnerSet(this)

  /**
   * Geometries and materials created by this mesh from options
   */
  private created = new Set<Geometry | Material>()

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

  public constructor(device: Device, options: MeshOptions) {
    this.uid = uuid()
    this.device = device
    this.owners.onEmpty(() => this.dispose())
    this.name = options.name
    this.meta = options.meta || {}

    const hasExplicit = options.geometries != null || options.parts != null
    const hasImports = options.partImports != null

    if (hasExplicit && hasImports) {
      throw new Error(`MeshOptions: 'partImports' cannot be combined with 'geometries' or 'parts'`)
    }

    if (hasImports) {
      this.geometries = options.partImports.map((it) => {
        return this.convertGeometry(it.geometry)
      })
      this.parts = options.partImports.map((it, index) => {
        return {
          geometryIndex: index,
          materialIndex: it.materialIndex,
        }
      })
    } else {
      this.geometries = (options.geometries || []).map((it) => this.convertGeometry(it))
      this.parts = options.parts.map((part) => ({ ...part }))
    }

    this.materials = (options.materials || []).map((it) => {
      if (it instanceof Material) {
        return it
      }
      const material = createMaterialInstance(device, it)
      this.created.add(material)
      return material
    })

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
   * Creates a new instance of this mesh
   *
   * @remarks
   * Copies the properties and returns a new Mesh instance.
   *
   * Geometry and Materials instances are kept and shared with the original mesh.
   *
   * To instantiate materials, pass `true` for `options.materials`.
   */
  public instantiate(options?: { materials: boolean }) {
    const materials = this.materials.map((material) => {
      return options?.materials ? material.instantiate() : material
    })
    const result = new Mesh(this.device, {
      name: this.name,
      meta: { ...(this.meta || {}) },
      boundingBox: this.boundingBox?.copy(),
      boundingSphere: this.boundingSphere?.copy(),
      materials: materials,
      geometries: [...this.geometries],
      parts: this.parts.map((it) => ({ ...it })),
    })
    // instantiated materials belong to the new mesh, geometries and other materials are borrowed
    if (options?.materials) {
      for (const material of materials) {
        result.created.add(material)
      }
    }
    return result
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
   * Geometries and materials created by this mesh are owned together with the mesh
   */
  public ownedChildren(): Iterable<Ownable> {
    return this.created
  }

  /**
   * Detaches this mesh from all owners and disposes the geometries and materials it created.
   * Called automatically when the last owner releases the mesh.
   *
   * @remarks
   * Borrowed geometries and materials (passed in as instances) are not touched.
   * Created ones are disposed unless a scope explicitly owns them.
   */
  public dispose(): void {
    if (this.owners.isFinalized) {
      return
    }
    this.owners.finalize()
    for (const child of this.created) {
      disposeUnclaimed(child)
    }
    this.created.clear()
    this.geometries = []
    this.materials = []
  }

  private convertGeometry(part: Geometry | GeometryOptions): Geometry {
    if (part instanceof Geometry) {
      return part
    }
    const geometry = new Geometry(this.device, part)
    this.created.add(geometry)
    return geometry
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

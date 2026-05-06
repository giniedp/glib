import { BoundingBox, Intersection, IntersectionType, type IVec3, Vec3 } from '@gglib/math'
import type { SpatialIndex, SpatialNode } from './SpatialIndex'

export interface OccTreeOptions extends OccTreeConfig {
  min: IVec3
  max: IVec3
}

export interface OccTreeConfig {
  maxLevel: number
  factor: number
}

/**
 * @public
 */
export class OccTree<T extends object = {}> implements SpatialIndex<T>, SpatialNode<T> {
  /**
   * Creates an occ tree with given dimensions
   */
  public static create<T extends object = {}>({ min, max, factor, maxLevel }: OccTreeOptions) {
    return new OccTree<T>(null, 0, min, max, {
      factor: factor || 1,
      maxLevel,
    })
  }

  public readonly config: OccTreeConfig
  /**
   * Depth level of this node where 0 is the root
   */
  public readonly level: number

  /**
   * Width and height in units of this quad
   *
   * @remarks
   * Size is uniform on xz plane and corresponds to bounds size.
   */
  public readonly size: number

  /**
   * The parent quad
   */
  public readonly parent: OccTree<T> | null

  /**
   * Child quads
   */
  public readonly children: ReadonlyArray<OccTree<T>> = [] // empty -> leaf node

  /**
   * The volume of this node
   */
  public readonly bounds: BoundingBox

  /**
   * The volume of this node extended by loose factor
   */
  public readonly looseBounds: BoundingBox

  /**
   * Indicates whether this is a leaf node
   */
  public get isLeaf() {
    return !this.children.length
  }

  /**
   * Indicates that this node is a root node without a parent
   */
  public get isRoot() {
    return this.parent == null
  }

  /**
   * Payload data associated with this node
   */
  public readonly data: T = {} as T

  // public readonly parentGridX: number
  // public readonly parentGridY: number
  // public readonly parentGridZ: number
  // public readonly rootGridX: number
  // public readonly rootGridY: number
  // public readonly rootGridZ: number
  // public readonly worldGridX: number
  // public readonly worldGridY: number
  // public readonly worldGridZ: number
  // public readonly centerX: number
  // public readonly centerY: number
  // public readonly centerZ: number

  private constructor(parent: OccTree<T>, level: number, min: IVec3, max: IVec3, config: OccTreeConfig) {
    this.parent = parent
    this.level = level
    this.config = config
    this.bounds = BoundingBox.createFromV(Vec3.min(min, max), Vec3.max(min, max))
    const sizeX = this.bounds.max.x - this.bounds.min.x
    const sizeY = this.bounds.max.y - this.bounds.min.y
    const sizeZ = this.bounds.max.z - this.bounds.min.z
    if (sizeX !== sizeZ || sizeY !== sizeZ) {
      throw new Error(`OccTree requires square bounds. Got ${sizeX}x${sizeY}x${sizeZ}`)
    }
    this.size = sizeX
    this.looseBounds = this.bounds.clone()
    this.looseBounds.min.subtractScalar((this.size * (this.config.factor - 1)) / 2)
    this.looseBounds.max.addScalar((this.size * (this.config.factor - 1)) / 2)

    // const root = this.getRoot()?.bounds
    // const bounds = this.bounds
    // this.parentGridX = parent ? (parent.bounds.min.x - this.bounds.min.x ? 1 : 0) : 0
    // this.parentGridY = parent ? (parent.bounds.min.y - this.bounds.min.y ? 1 : 0) : 0
    // this.parentGridZ = parent ? (parent.bounds.min.z - this.bounds.min.z ? 1 : 0) : 0
    // this.rootGridX = (bounds.min.x - root.min.x) / this.size
    // this.rootGridY = (bounds.min.y - root.min.y) / this.size
    // this.rootGridZ = (bounds.min.z - root.min.z) / this.size
    // this.worldGridX = bounds.min.x / this.size
    // this.worldGridY = bounds.min.y / this.size
    // this.worldGridZ = bounds.min.z / this.size
    // this.centerX = bounds.min.x + (bounds.max.x - bounds.min.x) / 2
    // this.centerY = bounds.min.y + (bounds.max.y - bounds.min.y) / 2
    // this.centerZ = bounds.min.z + (bounds.max.z - bounds.min.z) / 2
  }

  /**
   * Gets the root of this tree
   */
  public getRoot() {
    let node: OccTree<T> = this
    while (node.parent) {
      node = node.parent
    }
    return node
  }

  /**
   * Sub divide this node into 4 children
   */
  public subdivide(): void {
    if (this.children.length) {
      return
    }

    const { min, max } = this.bounds
    const halfSize = (max.x - min.x) / 2
    const children: OccTree<T>[] = this.children as any
    for (let i = 0; i < 4; i++) {
      const min = Vec3.create(
        this.bounds.min.x + (i & 1 ? halfSize : 0),
        this.bounds.min.y + 0,
        this.bounds.min.z + (i & 2 ? halfSize : 0),
      )
      const max = Vec3.create(min.x + halfSize, min.y + halfSize, min.z + halfSize)
      children.push(new OccTree<T>(this, this.level + 1, min, max, this.config))
    }
    for (let i = 0; i < 4; i++) {
      const min = Vec3.create(
        this.bounds.min.x + (i & 1 ? halfSize : 0),
        this.bounds.min.y + halfSize,
        this.bounds.min.z + (i & 2 ? halfSize : 0),
      )
      const max = Vec3.create(min.x + halfSize, min.y + halfSize, min.z + halfSize)
      children.push(new OccTree<T>(this, this.level + 1, min, max, this.config))
    }
  }

  /**
   * Sub divide the nodes of the tree until given depth is reached
   */
  public subdivideToLevel(leafLevel: number): void {
    if (this.level >= leafLevel) {
      return
    }

    this.subdivide()
    for (const child of this.children) {
      child.subdivideToLevel(leafLevel)
    }
  }

  /**
   * Sub divide the nodes of the tree until given size is reached
   */
  public subdivideTosize(leafSize: number): void {
    if (this.size <= leafSize) {
      return
    }

    this.subdivide()
    for (const child of this.children) {
      child.subdivideTosize(leafSize)
    }
  }

  /**
   * Traverses the tree top down starting from this node
   *
   * @remarks
   * Visits this node first then its children
   */
  public traverseTopDown(visit: (node: OccTree<T>) => void): void {
    visit(this)
    for (const child of this.children) {
      child.traverseTopDown(visit)
    }
  }

  /**
   * Traverses the tree bottom up
   *
   * @remarks
   * Viists children first then this node
   */
  public traverseBottomUp(visit: (node: OccTree<T>) => void): void {
    for (const child of this.children) {
      child.traverseBottomUp(visit)
    }
    visit(this)
  }

  public traverseIntersection<V>(
    volume: V,
    method: (a: V, b: BoundingBox) => IntersectionType,
    visit: (node: OccTree<T>, intersection: IntersectionType) => void,
  ): void {
    const intersection = method(volume, this.bounds)
    if (intersection === IntersectionType.Disjoint) {
      return
    }

    visit(this, intersection)

    if (this.isLeaf) {
      return
    }

    if (intersection === IntersectionType.Contains) {
      // all children are contained, no need to test them, just visit them all
      for (const child of this.children) {
        child.traverseContained(visit)
      }
    } else {
      // continue with intersection tests
      for (const child of this.children) {
        child.traverseIntersection(volume, method, visit)
      }
    }
  }

  private traverseContained(visit: (node: OccTree<T>, intersection: IntersectionType) => void): void {
    visit(this, IntersectionType.Contains)
    for (const child of this.children) {
      child.traverseContained(visit)
    }
  }

  /**
   * Searches in the tree for the smallest node that contains the given volume
   *
   * @param volume - the volume to fit
   */
  public findFittingNode(volume: BoundingBox): OccTree<T> {
    if (Intersection.boxBox(this.bounds, volume) === IntersectionType.Contains) {
      return this.testDown(volume)
    }
    return this.testUp(volume)
  }

  private testUp(volume: BoundingBox): OccTree<T> {
    if (!this.parent) {
      return this // root reached
    }
    if (Intersection.boxBox(this.parent.bounds, volume) === IntersectionType.Contains) {
      return this.parent
    }
    return this.parent.testUp(volume)
  }

  private testDown(volume: BoundingBox): OccTree<T> {
    if (this.isLeaf) {
      if (!!this.config.maxLevel && this.level >= this.config.maxLevel) {
        return this // leaf reached
      }
      this.subdivide()
    }

    for (const child of this.children) {
      if (Intersection.boxBox(child.bounds, volume) === IntersectionType.Contains) {
        return child.testDown(volume)
      }
    }
    // no child contains the volume, this is the best fit
    return this
  }

  /**
   * Traverses the tree and visits nodes that are close enough to the given position based on the given factor.
   */
  public traverseLOD(x: number, y: number, z: number, baseFactor: number, visit: (node: OccTree<T>) => void): void {
    // Leaf nodes are always selected
    if (this.isLeaf) {
      visit(this)
      return
    }

    // Distance from camera to the nearest point on the node's AABB.
    // Using AABB distance (vs. center distance) avoids over-refining large nodes
    // that the camera is standing inside, and under-refining nodes whose center
    // is far but whose edge is close.
    const nearX = Math.max(this.bounds.min.x, Math.min(x, this.bounds.max.x))
    const nearY = Math.max(this.bounds.min.y, Math.min(y, this.bounds.max.y))
    const nearZ = Math.max(this.bounds.min.z, Math.min(z, this.bounds.max.z))
    const dx = x - nearX
    const dy = z - nearY
    const dz = z - nearZ
    const distanceSq = dx * dx + dy * dy + dz * dz

    // The threshold at which we want to refine this node further.
    // node.size halves with each level, so the threshold naturally scales with geometry.
    const threshold = this.size * baseFactor

    if (distanceSq >= threshold * threshold) {
      // Camera is far enough, this node's resolution is sufficient.
      // Select it, do not descend.
      visit(this)
      return
    }

    // Camera is too close, we need finer detail. Recurse into children.
    // No node is added here, so there is no overlap with children.
    for (const child of this.children) {
      child.traverseLOD(x, y, z, baseFactor, visit)
    }
  }
}

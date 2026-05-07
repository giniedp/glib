import { BoundingBox, Intersection, IntersectionType, type IVec3, Vec3 } from '@gglib/math'
import type { SpatialIndex, SpatialNode } from './SpatialIndex'

export interface CreateQuadTreeOptions {
  min: IVec3
  max: IVec3
  leafLevel?: number
  looseFactor?: number
}

/**
 * @public
 */
export class QuadTree<T extends object = {}> implements SpatialIndex<T>, SpatialNode<T> {
  /**
   * Creates a wuad tree with given dimensions
   * @param min - the minimum point in 3D space
   * @param max - the maximum point in 3D space
   */
  public static create<T extends object = {}>({ min, max, looseFactor }: CreateQuadTreeOptions) {
    return new QuadTree<T>(min, max, 0, looseFactor || 1)
  }

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
   * The loose factor determines how much bigger the loose bounds are compared to the regular bounds.
   */
  public readonly looseFactor: number

  /**
   * The parent quad
   */
  public readonly parent: QuadTree<T> | null

  /**
   * Child quads
   */
  public readonly children: ReadonlyArray<QuadTree<T>> = [] // empty -> leaf node

  /**
   * The volume of this node
   *
   * @remarks
   * In a regular quad tree the volume is a square. Here a 3D bounding box is use.
   * The y component is up to the user to decide how to use.
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

  public readonly parentGridX: number
  public readonly parentGridZ: number
  public readonly rootGridX: number
  public readonly rootGridZ: number
  public readonly worldGridX: number
  public readonly worldGridZ: number
  public readonly centerX: number
  public readonly centerZ: number

  private constructor(min: IVec3, max: IVec3, level: number, looseFactor?: number, parent?: QuadTree<T>) {
    this.parent = parent
    this.level = level
    this.looseFactor = Math.max(1, looseFactor || 1)
    this.bounds = BoundingBox.createFromV(min, max)
    const sizeX = this.bounds.max.x - this.bounds.min.x
    const sizeZ = this.bounds.max.z - this.bounds.min.z
    if (sizeX !== sizeZ) {
      throw new Error(`QuadTree requires square bounds. Got ${sizeX}x${sizeZ}`)
    }
    this.size = sizeX
    this.looseBounds = this.bounds.clone()
    this.looseBounds.min.subtractScalar((this.size * (this.looseFactor - 1)) / 2)
    this.looseBounds.max.addScalar((this.size * (this.looseFactor - 1)) / 2)

    const root = this.getRoot()?.bounds
    const bounds = this.bounds
    this.parentGridX = parent ? (parent.bounds.min.x - this.bounds.min.x ? 1 : 0) : 0
    this.parentGridZ = parent ? (parent.bounds.min.z - this.bounds.min.z ? 1 : 0) : 0
    this.rootGridX = (bounds.min.x - root.min.x) / this.size
    this.rootGridZ = (bounds.min.z - root.min.z) / this.size
    this.worldGridX = bounds.min.x / this.size
    this.worldGridZ = bounds.min.z / this.size
    this.centerX = bounds.min.x + (bounds.max.x - bounds.min.x) / 2
    this.centerZ = bounds.min.z + (bounds.max.z - bounds.min.z) / 2
  }

  /**
   * Gets the root of this tree
   */
  public getRoot() {
    let node: QuadTree<T> = this
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
    const children: QuadTree<T>[] = this.children as any
    for (let i = 0; i < 4; i++) {
      const min = Vec3.create(
        this.bounds.min.x + (i & 1 ? halfSize : 0),
        this.bounds.min.y,
        this.bounds.min.z + (i & 2 ? halfSize : 0),
      )
      const max = Vec3.create(min.x + halfSize, this.bounds.max.y, min.z + halfSize)
      children.push(new QuadTree(min, max, this.level + 1, this.looseFactor, this))
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
  public traverseTopDown(visit: (node: QuadTree<T>) => void): void {
    visit(this)
    for (const child of this.children) {
      child.traverseTopDown(visit)
    }
  }

  public visitTopDown(visitor: { visit: (node: QuadTree<T>) => void }): void {
    visitor.visit(this)
    for (const child of this.children) {
      child.visitTopDown(visitor)
    }
  }

  public collectTopDown(output: Array<QuadTree<T>>): Array<QuadTree<T>> {
    output.push(this)
    for (const child of this.children) {
      child.collectTopDown(output)
    }
    return output
  }

  /**
   * Traverses the tree bottom up
   *
   * @remarks
   * Viists children first then this node
   */
  public traverseBottomUp(visit: (node: QuadTree<T>) => void): void {
    for (const child of this.children) {
      child.traverseBottomUp(visit)
    }
    visit(this)
  }

  public visitBottomUp(visitor: { visit: (node: QuadTree<T>) => void }): void {
    for (const child of this.children) {
      child.visitBottomUp(visitor)
    }
    visitor.visit(this)
  }

  public collectBottomUp(output: Array<QuadTree<T>>): Array<QuadTree<T>> {
    for (const child of this.children) {
      child.collectBottomUp(output)
    }
    output.push(this)
    return output
  }

  public traverseIntersection<V>(
    volume: V,
    method: (a: V, b: BoundingBox) => IntersectionType,
    visit: (node: QuadTree<T>, intersection: IntersectionType) => void,
  ): void {
    const intersection = method(volume, this.looseBounds)
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

  private traverseContained(visit: (node: QuadTree<T>, intersection: IntersectionType) => void): void {
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
  public findFittingNode(volume: BoundingBox): QuadTree<T> {
    if (Intersection.boxBox(this.looseBounds, volume) === IntersectionType.Contains) {
      return this.testDown(volume)
    }
    return this.testUp(volume)
  }

  private testUp(volume: BoundingBox): QuadTree<T> {
    if (!this.parent) {
      return this // root reached
    }
    if (Intersection.boxBox(this.parent.looseBounds, volume) === IntersectionType.Contains) {
      return this.parent
    }
    return this.parent.testUp(volume)
  }

  private testDown(volume: BoundingBox): QuadTree<T> {
    if (this.isLeaf) {
      return this // leaf reached
    }
    for (const child of this.children) {
      if (Intersection.boxBox(child.looseBounds, volume) === IntersectionType.Contains) {
        return child.testDown(volume)
      }
    }
    // no child contains the volume, this is the best fit
    return this
  }

  public traverseLOD(cameraX: number, cameraZ: number, baseFactor: number, visit: (node: QuadTree<T>) => void): void {
    // Leaf nodes are always selected
    if (this.isLeaf) {
      visit(this)
      return
    }

    // Distance from camera to the nearest point on the node's AABB.
    // Using AABB distance (vs. center distance) avoids over-refining large nodes
    // that the camera is standing inside, and under-refining nodes whose center
    // is far but whose edge is close.
    const nearX = Math.max(this.bounds.min.x, Math.min(cameraX, this.bounds.max.x))
    const nearZ = Math.max(this.bounds.min.z, Math.min(cameraZ, this.bounds.max.z))
    const dx = cameraX - nearX
    const dz = cameraZ - nearZ
    const distanceSq = dx * dx + dz * dz

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
      child.traverseLOD(cameraX, cameraZ, baseFactor, visit)
    }
  }

  public traverseLODSphere(
    cameraX: number,
    cameraZ: number,
    baseFactor: number,
    visit: (node: QuadTree<T>) => void,
  ): void {
    // Leaf nodes are always selected
    if (this.isLeaf) {
      visit(this)
      return
    }

    const centerX = (this.bounds.min.x + this.bounds.max.x) * 0.5
    const centerY = (this.bounds.min.z + this.bounds.max.z) * 0.5
    const dx = cameraX - centerX
    const dy = cameraZ - centerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    const threshold = this.size * baseFactor

    if (dist >= threshold) {
      visit(this)
    } else {
      for (const child of this.children) {
        child.traverseLODSphere(cameraX, cameraZ, baseFactor, visit)
      }
    }
  }
}

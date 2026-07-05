import { BoundingBox, Intersection, IntersectionType, type IVec3, Vec3 } from '@gglib/math'
import type { SpatialIndex, SpatialNode } from './SpatialIndex'

/**
 * @public
 */
export class QuadTreeNode<T extends object = {}> implements SpatialIndex<T>, SpatialNode<T> {
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
   * The root node
   */
  public readonly root: QuadTree<T> | null

  /**
   * The parent node
   */
  public readonly parent: QuadTreeNode<T> | null

  /**
   * Child nodes
   */
  public readonly children: ReadonlyArray<QuadTreeNode<T>> = [] // empty -> leaf node

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
  public readonly parentGridY: number
  public readonly parentGridZ: number

  public readonly rootGridX: number
  public readonly rootGridY: number
  public readonly rootGridZ: number

  public readonly worldGridX: number
  public readonly worldGridY: number
  public readonly worldGridZ: number

  public readonly centerX: number
  public readonly centerY: number
  public readonly centerZ: number

  protected constructor(root: QuadTree<T>, parent: QuadTreeNode<T>, min: IVec3, max: IVec3, level: number) {
    if (root == null) {
      root = this as any
    }
    if (!(root instanceof QuadTree)) {
      throw new Error('QuadTreeNode must be created with a root of type QuadTree')
    }
    this.root = root
    this.parent = parent
    this.level = level
    this.bounds = BoundingBox.createFromV(min, max)
    this.size = this.bounds.max.x - this.bounds.min.x

    const rootBounds = root.bounds
    const bounds = this.bounds

    this.parentGridX = parent ? (parent.bounds.min.x - this.bounds.min.x ? 1 : 0) : 0
    this.parentGridY = parent ? (parent.bounds.min.y - this.bounds.min.y ? 1 : 0) : 0
    this.parentGridZ = parent ? (parent.bounds.min.z - this.bounds.min.z ? 1 : 0) : 0

    this.rootGridX = (bounds.min.x - rootBounds.min.x) / this.size
    this.rootGridY = (bounds.min.y - rootBounds.min.y) / this.size
    this.rootGridZ = (bounds.min.z - rootBounds.min.z) / this.size

    this.worldGridX = bounds.min.x / this.size
    this.worldGridY = bounds.min.y / this.size
    this.worldGridZ = bounds.min.z / this.size

    this.centerX = bounds.min.x + (bounds.max.x - bounds.min.x) / 2
    this.centerY = bounds.min.y + (bounds.max.y - bounds.min.y) / 2
    this.centerZ = bounds.min.z + (bounds.max.z - bounds.min.z) / 2

    this.looseBounds = this.bounds.copy()

    this.updateLooseBounds(root ? root.looseFactor : 1)
  }

  protected updateLooseBounds(factor: number) {
    this.looseBounds.initFrom(this.bounds)
    this.looseBounds.min.subtractScalar((this.size * factor) / 2)
    this.looseBounds.max.addScalar((this.size * factor) / 2)
  }

  /**
   * Gets the root of this tree
   */
  public getRoot() {
    let node: QuadTreeNode<T> = this
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
    const children: QuadTreeNode<T>[] = this.children as any

    for (let i = 0; i < 4; i++) {
      const min = this.root.yUp
        ? Vec3.create(
            this.bounds.min.x + (i & 1 ? halfSize : 0),
            this.bounds.min.y,
            this.bounds.min.z + (i & 2 ? halfSize : 0),
          )
        : Vec3.create(
            this.bounds.min.x + (i & 1 ? halfSize : 0),
            this.bounds.min.y + (i & 2 ? halfSize : 0),
            this.bounds.min.z,
          )

      const max = this.root.yUp
        ? Vec3.create(min.x + halfSize, this.bounds.max.y, min.z + halfSize)
        : Vec3.create(min.x + halfSize, min.y + halfSize, this.bounds.max.z)

      children.push(new QuadTreeNode(this.root, this, min, max, this.level + 1))
    }

    this.root.markAsChanged()
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

  public traverseIntersection<V>(
    volume: V,
    method: (a: V, b: BoundingBox) => IntersectionType,
    visit: (node: QuadTreeNode<T>, intersection: IntersectionType) => void,
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

  private traverseContained(visit: (node: QuadTreeNode<T>, intersection: IntersectionType) => void): void {
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
  public findFittingNode(volume: BoundingBox): QuadTreeNode<T> {
    if (Intersection.boxBox(this.looseBounds, volume) === IntersectionType.Contains) {
      return this.testDown(volume)
    }
    return this.testUp(volume)
  }

  private testUp(volume: BoundingBox): QuadTreeNode<T> {
    if (!this.parent) {
      return this
    }
    if (Intersection.boxBox(this.parent.looseBounds, volume) === IntersectionType.Contains) {
      return this.parent
    }
    return this.parent.testUp(volume)
  }

  private testDown(volume: BoundingBox): QuadTreeNode<T> {
    if (this.isLeaf) {
      if (!this.root.canSubdivide(this.level)) {
        return this // leaf reached
      }
      this.subdivide()
    }
    for (const child of this.children) {
      if (Intersection.boxBox(child.looseBounds, volume) === IntersectionType.Contains) {
        return child.testDown(volume)
      }
    }
    // no child contains the volume, this is the best fit
    return this
  }

  public traverseLOD(camera: IVec3, baseFactor: number, visit: (node: QuadTreeNode<T>) => void): void {
    // Leaf nodes are always selected
    if (this.isLeaf) {
      visit(this)
      return
    }

    // Distance from camera to the nearest point on the node's AABB.
    // Using AABB distance (vs. center distance) avoids over-refining large nodes
    // that the camera is standing inside, and under-refining nodes whose center
    // is far but whose edge is close.
    const d1 = camera.x - Math.max(this.bounds.min.x, Math.min(camera.x, this.bounds.max.x))
    const d2 = this.root.yUp
      ? camera.z - Math.max(this.bounds.min.z, Math.min(camera.z, this.bounds.max.z))
      : camera.y - Math.max(this.bounds.min.y, Math.min(camera.y, this.bounds.max.y))
    const distanceSq = d1 * d1 + d2 * d2

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
      child.traverseLOD(camera, baseFactor, visit)
    }
  }

  public traverseLODSphere(camera: IVec3, baseFactor: number, visit: (node: QuadTreeNode<T>) => void): void {
    // Leaf nodes are always selected
    if (this.isLeaf) {
      visit(this)
      return
    }
    const centerX = (this.bounds.min.x + this.bounds.max.x) * 0.5
    const centerY = (this.bounds.min.y + this.bounds.max.y) * 0.5
    const centerZ = (this.bounds.min.z + this.bounds.max.z) * 0.5
    const dx = camera.x - centerX
    const dy = camera.y - centerY
    const dz = camera.z - centerZ
    const dist = this.root.yUp ? Math.sqrt(dx * dx + dz * dz) : Math.sqrt(dx * dx + dy * dy)

    const threshold = this.size * baseFactor

    if (dist >= threshold) {
      visit(this)
    } else {
      for (const child of this.children) {
        child.traverseLODSphere(camera, baseFactor, visit)
      }
    }
  }
}

export interface CreateQuadTreeOptions {
  min: IVec3
  max: IVec3
  leafLevel?: number
  looseFactor?: number
  verticalAxis: 'y' | 'z'
}

export class QuadTree<T extends object = {}> extends QuadTreeNode<T> {
  /**
   * Creates a quad tree with given dimensions
   * @param min - the minimum point in 3D space
   * @param max - the maximum point in 3D space
   */
  public static create<T extends object = {}>({
    min,
    max,
    looseFactor,
    leafLevel,
    verticalAxis,
  }: CreateQuadTreeOptions) {
    return new QuadTree<T>(min, max, 0, looseFactor || 1, leafLevel, verticalAxis)
  }

  /**
   * The loose factor determines how much bigger the loose bounds are compared to the regular bounds.
   */
  public readonly looseFactor: number

  public get flatPreOrdered(): ReadonlyArray<QuadTreeNode<T>> {
    if (this.listPreOrderVersion !== this.version) {
      this.toPreOrderedList(this.listPreOrder)
      this.listPreOrderVersion = this.version
    }
    return this.listPreOrder
  }

  public get flatPostOrdered(): ReadonlyArray<QuadTreeNode<T>> {
    if (this.listPostOrderVersion !== this.version) {
      this.listPostOrder.length = 0
      this.toPostOrderedList(this.listPostOrder)
      this.listPostOrderVersion = this.version
    }
    return this.listPostOrder
  }

  private version = 0
  private listPreOrder: QuadTreeNode<T>[] = []
  private listPreOrderVersion = -1
  private listPostOrder: QuadTreeNode<T>[] = []
  private listPostOrderVersion = -1
  private leafLevel: number

  public readonly yUp: boolean

  protected constructor(
    min: IVec3,
    max: IVec3,
    level: number,
    looseFactor: number,
    leafLevel: number,
    verticalAxis: 'y' | 'z',
  ) {
    super(null, null, min, max, level)
    this.looseFactor = Math.max(1, looseFactor ?? 1)
    this.leafLevel = leafLevel ?? -1
    this.yUp = !verticalAxis || verticalAxis === 'y'
    const sizeX = this.bounds.max.x - this.bounds.min.x
    const sizeY = this.bounds.max.y - this.bounds.min.y
    const sizeZ = this.bounds.max.z - this.bounds.min.z
    const sizeYZ = this.root.yUp ? sizeZ : sizeY
    if (sizeX !== sizeYZ) {
      throw new Error(`QuadTree requires square bounds. Got X=${sizeX} Y=${sizeY} Z=${sizeZ} (${this.root.yUp}) `)
    }
    this.updateLooseBounds(this.looseFactor)
  }

  public markAsChanged() {
    this.version++
  }

  public toPreOrderedList<R>(result: QuadTreeNode<T>[]): QuadTreeNode<T>[]
  public toPreOrderedList<R>(result: R[], transform?: (node: QuadTreeNode<T>) => R): R[]
  public toPreOrderedList<R>(result: any[] = [], transform?: (node: QuadTreeNode<T>) => R): any[] {
    result.length = 0
    const stack: Array<QuadTreeNode<T>> = [this]
    while (stack.length) {
      const node = stack.pop()!
      const value = transform ? transform(node) : node
      if (value != null) {
        result.push(value)
      }
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i])
      }
    }
    return result
  }

  public toPostOrderedList(result: QuadTreeNode<T>[]): QuadTreeNode<T>[]
  public toPostOrderedList<R>(result: R[], transform: (node: QuadTreeNode<T>) => R): R[]
  public toPostOrderedList<R>(result: any[] = [], transform?: (node: QuadTreeNode<T>) => R): any[] {
    result.length = 0
    const stack: Array<QuadTreeNode<T>> = [this]
    while (stack.length) {
      const node = stack.pop()!
      const value = transform ? transform(node) : node
      if (value != null) {
        result.push(value)
      }
      for (const child of node.children) {
        stack.push(child)
      }
    }
    result.reverse()
    return result
  }

  public canSubdivide(level: number) {
    return this.leafLevel >= 0 ? level < this.leafLevel : true
  }
}

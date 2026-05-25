import { BoundingBox, Intersection, IntersectionType, type IVec3, Vec3 } from '@gglib/math'
import type { SpatialIndex, SpatialNode } from './SpatialIndex'

export interface OccTreeOptions {
  min: IVec3
  max: IVec3
  leafLevel?: number
  looseFactor?: number
}

/**
 * @public
 */
export class OccTreeNode<T extends object = {}> implements SpatialIndex<T>, SpatialNode<T> {
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
  public readonly root: OccTree<T> | null

  /**
   * The parent node
   */
  public readonly parent: OccTreeNode<T> | null

  /**
   * Child nodes
   */
  public readonly children: ReadonlyArray<OccTreeNode<T>> = [] // empty -> leaf node

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

  protected constructor(root: OccTree<T>, parent: OccTreeNode<T>, min: IVec3, max: IVec3, level: number) {
    if (root == null) {
      root = this as any
    }
    if (!(root instanceof OccTree)) {
      throw new Error('OccTreeNode must be created with a root of type OccTree')
    }

    this.root = root
    this.parent = parent
    this.level = level

    this.bounds = BoundingBox.createFromV(min, max)
    this.size = this.bounds.max.x - this.bounds.min.x

    this.looseBounds = this.bounds.clone()
    this.updateLooseBounds(root?.looseFactor ?? 1)
  }

  protected updateLooseBounds(factor: number) {
    this.looseBounds.initFrom(this.bounds)
    const extend = (this.size * factor - this.size) / 2
    this.looseBounds.min.x -= extend
    this.looseBounds.min.y -= extend
    this.looseBounds.min.z -= extend
    this.looseBounds.max.x += extend
    this.looseBounds.max.y += extend
    this.looseBounds.max.z += extend
  }

  /**
   * Gets the root of this tree
   */
  public getRoot() {
    let node: OccTreeNode<T> = this
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
    const children: OccTreeNode<T>[] = this.children as any
    for (let i = 0; i < 4; i++) {
      const min = Vec3.create(
        this.bounds.min.x + (i & 1 ? halfSize : 0),
        this.bounds.min.y + 0,
        this.bounds.min.z + (i & 2 ? halfSize : 0),
      )
      const max = Vec3.create(min.x + halfSize, min.y + halfSize, min.z + halfSize)
      children.push(new OccTreeNode(this.root, this, min, max, this.level + 1))
    }
    for (let i = 0; i < 4; i++) {
      const min = Vec3.create(
        this.bounds.min.x + (i & 1 ? halfSize : 0),
        this.bounds.min.y + halfSize,
        this.bounds.min.z + (i & 2 ? halfSize : 0),
      )
      const max = Vec3.create(min.x + halfSize, min.y + halfSize, min.z + halfSize)
      children.push(new OccTreeNode(this.root, this, min, max, this.level + 1))
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

  /**
   * Traverses the tree top down starting from this node
   *
   * @remarks
   * Visits this node first then its children
   */
  public traverseTopDown(visit: (node: OccTreeNode<T>) => void): void {
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
  public traverseBottomUp(visit: (node: OccTreeNode<T>) => void): void {
    for (const child of this.children) {
      child.traverseBottomUp(visit)
    }
    visit(this)
  }

  public traverseIntersection<V>(
    volume: V,
    method: (a: V, b: BoundingBox) => IntersectionType,
    visit: (node: OccTreeNode<T>, intersection: IntersectionType) => void,
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

  private traverseContained(visit: (node: OccTreeNode<T>, intersection: IntersectionType) => void): void {
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
  public findFittingNode(volume: BoundingBox): OccTreeNode<T> {
    if (Intersection.boxBox(this.looseBounds, volume) === IntersectionType.Contains) {
      return this.testDown(volume)
    }
    return this.testUp(volume)
  }

  private testUp(volume: BoundingBox): OccTreeNode<T> {
    if (!this.parent) {
      return this // root reached
    }
    if (Intersection.boxBox(this.parent.looseBounds, volume) === IntersectionType.Contains) {
      return this.parent
    }
    return this.parent.testUp(volume)
  }

  private testDown(volume: BoundingBox): OccTreeNode<T> {
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

  /**
   * Traverses the tree and visits nodes that are close enough to the given position based on the given factor.
   */
  public traverseLOD(x: number, y: number, z: number, baseFactor: number, visit: (node: OccTreeNode<T>) => void): void {
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
    const dy = y - nearY
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

export class OccTree<T extends object = {}> extends OccTreeNode<T> {
  /**
   * Creates an occ tree with given dimensions
   * @param min - the minimum point in 3D space
   * @param max - the maximum point in 3D space
   */
  public static create<T extends object = {}>({ min, max, looseFactor, leafLevel }: OccTreeOptions) {
    return new OccTree<T>(min, max, 0, looseFactor ?? 1, leafLevel ?? -1)
  }

  /**
   * The loose factor determines how much bigger the loose bounds are compared to the regular bounds.
   */
  public readonly looseFactor: number

  public get flatPreOrdered(): ReadonlyArray<OccTreeNode<T>> {
    if (this.listPreOrderVersion !== this.version) {
      this.toPreOrderedList(this.listPreOrder)
      this.listPreOrderVersion = this.version
    }
    return this.listPreOrder
  }

  public get flatPostOrdered(): ReadonlyArray<OccTreeNode<T>> {
    if (this.listPostOrderVersion !== this.version) {
      this.listPostOrder.length = 0
      this.toPostOrderedList(this.listPostOrder)
      this.listPostOrderVersion = this.version
    }
    return this.listPostOrder
  }

  private version = 0
  private listPreOrder: OccTreeNode<T>[] = []
  private listPreOrderVersion = -1
  private listPostOrder: OccTreeNode<T>[] = []
  private listPostOrderVersion = -1
  private leafLevel: number

  protected constructor(min: IVec3, max: IVec3, level: number, looseFactor: number, leafLevel: number) {
    super(null, null, min, max, level)
    this.looseFactor = Math.max(1, looseFactor ?? 1)
    this.leafLevel = leafLevel ?? -1
    const sizeX = this.bounds.max.x - this.bounds.min.x
    const sizeY = this.bounds.max.y - this.bounds.min.y
    const sizeZ = this.bounds.max.z - this.bounds.min.z

    if (sizeX !== sizeY || sizeX !== sizeZ) {
      throw new Error(`OccTree requires cubic bounds. Got X=${sizeX} Y=${sizeY} Z=${sizeZ}`)
    }
    this.updateLooseBounds(this.looseFactor)
  }

  public markAsChanged() {
    this.version++
  }

  public toPreOrderedList<R>(result: OccTreeNode<T>[]): OccTreeNode<T>[]
  public toPreOrderedList<R>(result: R[], transform?: (node: OccTreeNode<T>) => R): R[]
  public toPreOrderedList<R>(result: any[] = [], transform?: (node: OccTreeNode<T>) => R): any[] {
    result.length = 0
    const stack: Array<OccTreeNode<T>> = [this]
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

  public toPostOrderedList(result: OccTreeNode<T>[]): OccTreeNode<T>[]
  public toPostOrderedList<R>(result: R[], transform: (node: OccTreeNode<T>) => R): R[]
  public toPostOrderedList<R>(result: any[] = [], transform?: (node: OccTreeNode<T>) => R): any[] {
    result.length = 0
    const stack: Array<OccTreeNode<T>> = [this]
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

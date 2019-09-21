import { BoundingBox, BoundingFrustum, BoundingSphere, BoundingVolume, IVec3, IVec4, Ray, Vec3 } from '@gglib/math'
import { SpatialEntry, SpatialNode, SpatialSystem } from '../SpatialSystem'

type KeyMatchingType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T]

export class QuadTree<T = any> implements SpatialSystem<T>, SpatialNode<T> {
  /**
   * The AABB volume of this node
   */
  public readonly volume: BoundingBox

  /**
   * Number of object contained by this or descendant nodes
   */
  public readonly count: number

  /**
   * Depth level of this node
   */
  public readonly level: number

  /**
   * Indicates whether this is a leaf node
   */
  public get isLeaf() {
    return this.children == null
  }

  /**
   * Indicates that this node is a root node without a parent
   */
  public get isRoot() {
    return this.parent == null
  }

  private children: Array<QuadTree<T>>
  private entries: Array<SpatialEntry<T>> = []

  private constructor(min: IVec3, max: IVec3, level: number, private parent?: QuadTree<T>) {
    this.volume = BoundingBox.createFromV(min, max)
    this.level = level
  }

  /**
   * Creates an occ tree with given dimensions
   * @param min - the minimum point in 3D space
   * @param max - the maximum point in 3D space
   * @param maxDepth - the maximum tree dpeth
   */
  public static create<T = any>(min: IVec3, max: IVec3, maxDepth: number) {
    return new QuadTree<T>(min, max, 0).subdivide(maxDepth)
  }

  /**
   * Inserts an entry into this node
   *
   * @param entry - the entry to insert
   * @remarks
   * The entry is inserted without any checks. This method is meant
   * for higher level system to insert entries as needed
   * @returns `false` if the entry was already inserted
   */
  public insert(entry: SpatialEntry<T>): boolean {
    const index = this.entries.indexOf(entry)
    if (index < 0) {
      this.entries.push(entry)
      return true
    }
    return false
  }

  /**
   * Removes an entry from this node
   *
   * @param entry - the entry to remove
   * @returns `true` if the entry was in this node ind is removed
   */
  public remove(entry: SpatialEntry<T>): boolean {
    const index = this.entries.indexOf(entry)
    if (index >= 0) {
      this.entries.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Sub divide the nodes of the tree until given depth is reached
   *
   * @param maxDepth - the maximum tree depth
   */
  public subdivide(maxDepth: number): this {
    if (!this.children) {
      const step = Vec3.subtract(this.volume.max, this.volume.min).multiply({ x: 0.5, y: 1, z: 0.5})
      const offset = new Vec3()
      this.children = []
      for (let i = 0; i < 4; i++) {
        offset.x = (i & 1) ? step.x : 0 // tslint:disable-line: no-bitwise
        offset.z = (i & 2) ? step.z : 0 // tslint:disable-line: no-bitwise
        const min = Vec3.add(this.volume.min, offset)
        const max = Vec3.add(min, step)
        this.children[i] = new QuadTree(min, max, this.level + 1, this)
      }
    }
    if (this.level < maxDepth) {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].subdivide(maxDepth)
      }
    }
    return this
  }

  /**
   * Tests a ray against this node
   */
  public testRay(ray: Ray, out: T[]): boolean {
    return this.testVolume(ray, 'intersectsRay', out)
  }

  /**
   * Tests a point against this node
   */
  public testPoint(point: IVec3, out: T[]): boolean {
    return this.testVolume(point, 'intersectsPoint', out)
  }

  /**
   * Tests a point against this node
   */
  public testPlane(plane: IVec4, out: T[]): boolean {
    return this.testVolume(plane, 'intersectsPlane', out)
  }

  public testBox(volume: BoundingBox, out: T[]): boolean {
    return this.testVolume(volume, 'intersectsBox', out)
  }

  public testSphere(volume: BoundingSphere, out: T[]): boolean {
    return this.testVolume(volume, 'intersectsSphere', out)
  }

  public testFrustum(volume: BoundingFrustum, out: T[]): boolean {
    return this.testVolume(volume, 'intersectsFrustum', out)
  }

  private testVolume<V = any>(
    volume: V,
    intersectsFn: KeyMatchingType<BoundingVolume, (v: V) => boolean>,
    out: T[],
  ): boolean {
    const intersects = this.volume[intersectsFn](volume as any)
    if (intersects || !this.parent) {
      for (let i = 0; i < this.entries.length; i++) {
        if (this.entries[i].volume[intersectsFn](volume as any)) {
          out.push(this.entries[i].element)
        }
      }
    }
    if (intersects && this.children) {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].testVolume(volume, intersectsFn, out)
      }
    }
    return intersects
  }

  /**
   * Searches in the tree for a node that fits the given volume
   *
   * @param volume - the volume to fit
   */
  public fit(volume: BoundingVolume): QuadTree<T> {
    if (volume.containedByBox(this.volume)) {
      return this.testDown(volume)
    }
    return this.testUp(volume)
  }

  private testUp(volume: BoundingVolume): QuadTree<T> {
    if (this.parent) {
      if (volume.containedByBox(this.parent.volume)) {
        return this.parent
      }
      return this.parent.testUp(volume)
    }
    return this
  }

  private testDown(volume: BoundingVolume): QuadTree<T> {
    if (this.children) {
      for (let i = 0; i < this.children.length; i++) {
        if (volume.containedByBox(this.children[i].volume)) {
          return this.children[i].testDown(volume)
        }
      }
    }
    return this
  }
}

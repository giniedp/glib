import { ModelNode, ModelNodePose } from './ModelNode'
import { Mat4, Vec3, Vec4 } from '@gglib/math'

/**
 * Walks a node hierarchy and calls the visitor function
 *
 * @param nodes - The node hierarchy
 * @param visit - The visitor function
 * @param ids - The root node ids to start with
 * @param parent - The initial parent node id (e.g. -1 or null)
 */
function walkNodes(
  nodes: ReadonlyArray<ModelNode>,
  ids: ReadonlyArray<number>,
  parent: number,
  visit: (node: ModelNode, index: number, parent: number) => void,
): void {
  if (!ids) {
    return
  }
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const node = nodes[id]
    if (node) {
      visit(node, id, parent)
      if (node.children) {
        walkNodes(nodes, node.children, id, visit)
      }
    }
  }
}

/**
 * Resolves the local transform of a given node
 *
 * @remarks
 * If node has a `matrix` property, that matrix is used as result.
 * Otherwise a matrix is caluclated from `translation`, `rotation`, `scale` attributes.
 * If none are present, identity is used.
 *
 * @param node - The node to resolve
 * @param out - Where to write the result
 * @returns given `out` parameter or a new matrix representing the nodes local transform
 */
function resolveLocalTransform(node: ModelNode, out?: Mat4): Mat4 {
  if (node.matrix?.length) {
    return out ? out.initFromArray(node.matrix) : Mat4.createFromArray(node.matrix)
  }
  out = out ? out.initIdentity() : Mat4.createIdentity()
  const t = node.translation
  if (t) {
    out.translate(t[0], t[1], t[2])
  }
  const r = node.rotation
  if (r) {
    out.rotateQuaternion(r[0], r[1], r[2], r[3])
  }
  const s = node.scale
  if (s) {
    out.scale(s[0], s[1], s[2])
  }
  return out
}

/**
 * Resolves the local pose attributes of a given node
 *
 * @remarks
 * If node has a `matrix` property, that matrix is used as result.
 * Otherwise a matrix is caluclated from `translation`, `rotation`, `scale` attributes.
 * If none are present, identity is used.
 *
 * @param node - the node
 * @param out - the resulting pose object
 */
function resolveLocalPose(node: ModelNode, out: ModelNodePose): ModelNodePose {
  if (node.matrix) {
    // node is not animated, copy the matrix
    out.matrix.initFromArray(node.matrix)
    return out
  }

  const t = node.translation
  const r = node.rotation
  const s = node.scale
  let isAnimated = false

  // if we are here, the node is animated
  // read the components and update the matrix
  if (t) {
    isAnimated = true
    out.translation = Vec3.init(out.translation || {}, t[0], t[1], t[2])
  }
  if (r) {
    isAnimated = true
    out.rotation = Vec4.init(out.rotation || {}, r[0], r[1], r[2], r[3])
  }
  if (s) {
    isAnimated = true
    out.scale = Vec3.init(out.scale || {}, s[0], s[1], s[2])
  }
  if (isAnimated) {
    updatePoseTransform(out)
  } else {
    // neither transformed nor animated
    out.matrix.initIdentity()
  }
  return out
}

function updatePoseTransform(out: ModelNodePose) {
  if (out.translation || out.rotation || out.scale) {
    out.matrix.initIdentity()
    if (out.translation) {
      out.matrix.translateV(out.translation)
    }
    if (out.rotation) {
      out.matrix.rotateQuat(out.rotation)
    }
    if (out.scale) {
      out.matrix.scaleV(out.scale)
    }
  }
  return out
}

export class ModelNodeHierarchy {
  /**
   * List of nodes sorted by their hierarchy
   */
  public readonly nodes: ReadonlyArray<ModelNode>

  /**
   * List of root node indices
   */
  public readonly roots: ReadonlyArray<number>

  /**
   * Gets the initial global transforms for all nodes.
   *
   * @remarks
   * These transforms are calculated once and cached.
   * If you need to recalculate these, use {@link update}
   */
  public get globalTransforms(): ReadonlyArray<Mat4> {
    if (!this.$globalTransform) {
      this.update()
    }
    return this.$globalTransform
  }

  /**
   * Gets the inverse of the {@link globalTransforms}
   *
   * @remarks
   * These transforms are calculated once and cached.
   * If you need to recalculate these, use {@link update}
   */
  public get globalInverseTransforms(): ReadonlyArray<Mat4> {
    if (!this.$globalInverse) {
      this.update()
    }
    return this.$globalInverse
  }

  private $globalTransform: Mat4[]
  private $globalInverse: Mat4[]

  constructor(nodes: ReadonlyArray<ModelNode>, roots: ReadonlyArray<number>) {
    this.nodes = nodes
    this.roots = roots
  }

  /**
   * Updates the {@link globalTransforms} and {@link globalInverseTransforms}
   */
  public update() {
    this.$globalTransform = this.$globalTransform || Mat4.alloc(this.nodes.length)
    this.$globalInverse = this.$globalInverse || Mat4.alloc(this.nodes.length)
    this.calculateGlobalTransforms(this.$globalTransform)
    this.$globalTransform.forEach((it, i) => Mat4.invert(it, this.$globalInverse[i]))
  }

  /**
   * Walks the node hierarchy and calls the visitor function for each node
   *
   * @param visitor - The visitor function
   */
  public walk(visitor: (node: ModelNode, index: number, parent: number) => void) {
    walkNodes(this.nodes, this.roots, -1, visitor)
  }

  /**
   * For each node it gets the locale node pose (translation, rotation, scale and matrix)
   *
   * @param out - Where the results should be written to (may be empty)
   * @returns the given out parameter
   */
  public calculateLocalPose(out: ModelNodePose[]) {
    out.length = this.nodes.length
    for (let id = 0; id < this.nodes.length; id++) {
      out[id] = resolveLocalPose(this.nodes[id], out[id] || { matrix: new Mat4() })
    }
    return out
  }

  /**
   * For each node it calculates the absolute transform matrix
   *
   * @param out - Where the results should be written to (may be empty)
   * @returns the given out parameter
   */
  public calculateGlobalTransforms(out: Mat4[]): Mat4[] {
    out.length = this.nodes.length
    this.walk((node, id, parentId) => {
      const child = (out[id] = out[id] || Mat4.createIdentity())
      const parent = out[parentId]
      resolveLocalTransform(node, child)
      if (parent) {
        Mat4.multiply(parent, child, child)
      }
    })
    return out
  }

  /**
   * Walks the node hierarchy and calculates a global transform from given local pose state
   *
   * @param locals - List of local node poses (must match the node hierarchy)
   * @param out - Where the results should be written to (may be empty)
   */
  public updateGlobalTransforms(locals: ReadonlyArray<ModelNodePose>, out: Mat4[]) {
    out.length = this.nodes.length
    this.walk((node, id, parentId) => {
      const child = (out[id] = out[id] || Mat4.createIdentity())
      const parent = out[parentId]
      const local = locals[id]
      updatePoseTransform(local)
      if (parent) {
        Mat4.multiply(parent, local.matrix, child)
      } else {
        child.initFrom(local.matrix)
      }
    })
    return out
  }
}

import { Device, Mesh } from '@gglib/graphics'
import { BoundingBox, BoundingSphere, Mat4, Transform } from '@gglib/math'
import { uuid } from '@gglib/utils'
import type { AnimationData } from './AnimationData'
import { AnimationPlayer } from './AnimationPlayer'
import type { ModelOptions, NodeData, SceneData, SkinData } from './Data'
import { Skeleton } from './Skeleton'
import { createSkeletons, createTransformNodes, flattenNodes } from './utils'

/**
 * @public
 */
export class Model {
  /**
   * Autmatically generated unique identifier
   */
  public readonly uid: string

  /**
   * The graphics device
   */
  public readonly device: Device

  /**
   * The user defined name of the model
   */
  public name: string | null

  /**
   * The user defined meta data of the model
   */
  public meta: Record<string, any>

  /**
   * All meshes belonging to this model
   *
   * @remarks
   * Referenced by index from {@link NodeData.mesh}. Meshes may be shared
   * between models.
   */
  public meshes: Mesh[]

  /**
   * Skinning data, mapping skeleton joints to mesh vertices
   */
  public skins: SkinData[] = []

  /**
   * The raw scene node definitions
   *
   * @remarks
   * Serializable description of the node hierarchy. The live, traversable
   * counterpart is {@link transformNodes}.
   */
  public nodes: NodeData[] = []

  /**
   * Animation clips that can be played back via {@link createAnimationPlayer}
   */
  public animations?: AnimationData[]

  /**
   * Index of the currently selected scene within {@link scenes}
   */
  public scene: number = 0

  /**
   * All scenes defined by this model
   *
   * @remarks
   * A scene selects which of the {@link nodes} act as roots. The active scene
   * is chosen with {@link selectScene}.
   */
  public scenes: SceneData[] = []

  /**
   * Live transform node instances
   *
   * @remarks
   * A flat list in the same order as {@link nodes}. Each node also references
   * its children, so the list doubles as a tree.
   */
  public transformNodes: Transform<NodeData>[]

  /**
   * Combined bounding sphere of all meshes in the current scene
   *
   * @remarks
   * Recomputed on every call to {@link update}.
   */
  public boundingSphere = new BoundingSphere()

  /**
   * Combined bounding box of all meshes in the current scene
   *
   * @remarks
   * Recomputed on every call to {@link update}.
   */
  public boundingBox = new BoundingBox()

  /**
   * Skeletons built from {@link skins}, used to drive skinned meshes
   */
  public skeletons: Skeleton[] = []

  private _sceneRoot = new Transform<NodeData>()
  private _sceneNodes: Transform<NodeData>[] = []

  /**
   * The nodes belonging to the currently selected scene, flattened into a
   * traversal-ordered list.
   */
  public get sceneNodes(): ReadonlyArray<Transform<NodeData>> {
    return this._sceneNodes
  }

  /**
   * Creates a new model.
   *
   * @remarks
   * Meshes given as plain options are constructed on the device. If no
   * {@link NodeData | nodes} are supplied, a default scene is generated with
   * one node per mesh. The initial scene is selected and {@link update} is
   * called once.
   *
   * @param device - Graphics device that owns the model's GPU resources
   * @param options - Model definition (meshes, nodes, scenes, skins, animations)
   */
  public constructor(device: Device, options: ModelOptions) {
    this.uid = uuid()
    this.device = device
    this.name = options.name || null
    this.meta = options.meta || {}

    this.skins = options.skins || []
    this.animations = options.animations || []

    this.meshes = []
    for (const mesh of options.meshes || []) {
      if (mesh instanceof Mesh) {
        this.meshes.push(mesh)
      } else {
        this.meshes.push(new Mesh(this.device, mesh))
      }
    }

    this.scene = options.scene || 0
    this.scenes = options.scenes || []
    this.nodes = options.nodes || []
    if (!this.nodes.length) {
      this.scenes = [{ nodes: [] }]
      for (let i = 0; i < this.meshes.length; i++) {
        this.nodes.push({ mesh: i })
        this.scenes[0].nodes.push(i)
      }
    }

    this.transformNodes = createTransformNodes(this.nodes)
    this.skeletons = createSkeletons(this.skins, this.transformNodes)
    this.selectScene(this.scene)
    this.update()
  }

  /**
   * Draws every mesh with its assigned material.
   *
   * @remarks
   * Ignores the node hierarchy entirely and simply calls `draw()` on each
   * mesh. Node transforms are not applied here; use {@link update} to compute
   * them and bind them at draw time as your renderer requires.
   *
   * @returns This model, for chaining.
   */
  public draw(): Model {
    for (const mesh of this.meshes) {
      mesh.draw()
    }
    return this
  }

  /**
   * Selects a scene by index and rebuilds the traversal state.
   *
   * @remarks
   * Re-parents the scene's root nodes under the internal scene root and
   * refreshes {@link sceneNodes}. Does not recompute transforms or bounds —
   * call {@link update} afterwards.
   *
   * @param index - Index into {@link scenes}
   * @throws If no scene exists at the given index.
   */
  public selectScene(index: number) {
    this.scene = index
    const scene = this.scenes[this.scene]
    if (!scene) {
      throw new Error(`Scene with index ${index} does not exist in model ${this.name}`)
    }
    if (!scene.nodes) {
      console.warn(`Scene has no nodes`, this)
    }
    const root = this._sceneRoot
    root.children.length = 0
    for (const index of scene.nodes) {
      const node = this.transformNodes[index]
      if (node) {
        root.children.push(node)
        node.parent = root
      }
    }

    this._sceneNodes.length = 0
    flattenNodes(root.children, this._sceneNodes)
  }

  /**
   * Creates an animation player for this model's clips.
   *
   * @returns A new {@link AnimationPlayer}, or `null` if the model has no
   * animations.
   */
  public createAnimationPlayer() {
    if (!this.animations?.length) {
      return null
    }
    return new AnimationPlayer(this.animations)
  }

  /**
   * Recomputes world transforms, skeletons, and bounds for the current scene.
   *
   * @remarks
   * Should be called whenever the model's transform or pose changes, typically
   * once per frame.
   *
   * @param world - Absolute transform for the scene root, or `null` to use
   * identity.
   */
  public update(world?: Mat4 | null) {
    this.updateScene(world)
    this.updateSkeletons(world)
    this.updateBounds()
  }

  /**
   * Updates the world transforms of all nodes in the current scene.
   *
   * @remarks
   * The given matrix is used as the absolute transform of the scene root.
   * When omitted, the root is reset to identity.
   *
   * @param world - Absolute transform for the scene root, or `null` to reset
   * to identity.
   */
  public updateScene(world?: Mat4 | null) {
    const root = this._sceneRoot
    if (world) {
      world.decompose(root.scale, root.rotation, root.translation)
    } else {
      root.scale.initOne()
      root.rotation.initIdentity()
      root.translation.initZero()
    }

    root.markAsChanged()
    root.propagateUpdates(true, true)
  }

  /**
   * Updates all skeletons for the current pose.
   *
   * @param world - Absolute transform applied to each skeleton, matching the
   * value passed to {@link updateScene}.
   */
  public updateSkeletons(world?: Mat4 | null) {
    if (this.skeletons) {
      for (const skeleton of this.skeletons) {
        skeleton.update(world)
      }
    }
  }

  private tmpBox = new BoundingBox()
  /**
   * Recomputes {@link boundingBox} and {@link boundingSphere} from the current
   * scene's mesh nodes.
   *
   * @remarks
   * Each mesh's local bounding box is transformed by its node's world matrix
   * and merged into the combined box; the sphere is then fit to that box.
   */
  public updateBounds() {
    const box = this.boundingBox.initEmpty()
    const sphere = this.boundingSphere.init()

    this.tmpBox.initEmpty()
    for (const node of this._sceneNodes) {
      const mesh = this.meshes[node.data.mesh]
      if (!mesh) {
        continue
      }
      BoundingBox.transform(mesh.boundingBox, node.world, this.tmpBox)
      box.merge(this.tmpBox)
    }

    sphere.initFromBox(box)
  }

  /**
   * Releases GPU resources held by this model's meshes.
   *
   * @remarks
   * Only meshes are disposed; node, skeleton, and scene state are left intact.
   */
  public dispose() {
    for (const mesh of this.meshes) {
      mesh.dispose()
    }
    this.meshes.length = 0
    // this.hierarchy.dispose()
    // if (this.pose) {
    //   this.pose.dispose()
    //   this.pose = null
    // }
    // if (this.player) {
    //   this.player.dispose()
    //   this.player = null
    // }
  }

  /**
   * Serializes this model back into a plain {@link ModelOptions} object.
   *
   * @remarks
   * Meshes are copied by reference (geometry may be shared); skins, nodes,
   * animations, and scenes are deep-cloned via JSON round-trip, so any
   * non-JSON-safe values (functions, typed arrays, cyclic refs) will be lost.
   *
   * @returns Options that can recreate an equivalent model.
   */
  public toOptions(): ModelOptions {
    return {
      name: this.name || undefined,
      meta: { ...this.meta }, // flat list
      meshes: [...this.meshes], // mesh geometry can be shared
      skins: this.skins ? JSON.parse(JSON.stringify(this.skins)) : undefined,
      nodes: this.nodes ? JSON.parse(JSON.stringify(this.nodes)) : undefined,
      animations: this.animations ? JSON.parse(JSON.stringify(this.animations)) : undefined,
      scenes: this.scenes ? JSON.parse(JSON.stringify(this.scenes)) : undefined,
      scene: this.scene,
    }
  }
}

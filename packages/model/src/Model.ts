import { Device, Mesh } from '@gglib/graphics'
import { BoundingBox, BoundingSphere, Mat4, Transform } from '@gglib/math'
import { uuid } from '@gglib/utils'
import { AnimationData } from './AnimationData'
import { ModelData, NodeData, SceneData, SkinData } from './Data'
import { createSkeletons, createTransformNodes, flattenNodes } from './utils'
import { AnimationPlayer } from './AnimationPlayer'
import { Skeleton } from './Skeleton'

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
   * Collection of meshes
   */
  public meshes: Mesh[]

  /**
   * Collection of skins
   */
  public skins: SkinData[] = []

  /**
   * The scene nodes
   */
  public nodes: NodeData[] = []

  /**
   * Model animation data
   */
  public animations?: AnimationData[]

  /**
   * The selected scene
   */
  public scene: number = 0

  /**
   * All scenes of this model
   */
  public scenes: SceneData[] = []

  /**
   * All transform node instances
   *
   * @remarks
   * Nodes are a flat list in same order as passed to constructor.
   * Nodes also contain references to their children, making it a tree structure.
   */
  public transformNodes: Transform<NodeData>[]

  /**
   * Combined bounding sphere for all meshes in the current scene
   *
   * @remarks
   * Is updated on every call to {@link Model.update}.
   */
  public boundingSphere = new BoundingSphere()

  /**
   * Combined bounding box for all meshes in the current scene
   *
   * @remarks
   * Is updated on every call to {@link Model.update}.
   */
  public boundingBox = new BoundingBox()

  /**
   *
   */
  public skeletons: Skeleton[] = []

  private _sceneRoot = new Transform<void>()
  private _sceneNodes: Transform<NodeData>[] = []

  constructor(device: Device, options: ModelData) {
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
   * Simply iterates over all meshes and renders each with its assigned material
   *
   * @remarks
   * This ignores the model nodes and just calls `draw()` for each mesh.
   */
  public draw(): Model {
    for (const mesh of this.meshes) {
      mesh.draw()
    }
    return this
  }

  /**
   * Selects a scene by index and prepares state for update and rendering
   */
  public selectScene(index: number) {
    this.scene = index
    const scene = this.scenes[this.scene]
    if (!scene) {
      throw new Error(`Scene with index ${index} does not exist in model ${this.name}`)
    }
    const root = this._sceneRoot
    root.children.length = 0
    for (const index of scene.nodes) {
      const node = this.transformNodes[index]
      if (node) {
        root.children.push(node)
      }
    }

    this._sceneNodes.length = 0
    flattenNodes(root.children, this._sceneNodes)
  }

  public getAnimationPlayer() {
    if (!this.animations) {
      return null
    }
    return new AnimationPlayer(this.animations)
  }

  public update(world?: Mat4 | null) {
    this.updateScene(world)
    this.updateSkeletons(world)
    this.updateBounds()
  }

  /**
   * Updates the transforms of all nodes in the current scene
   *
   * @remarks
   * The given world matrix is used for all root nodes in the scene.
   * It is up to the application to ensure, that the provided root nods of the scene
   * are identity transforms, so that no transform is lost.
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

    root.needsUpdate = true
    root.update(true, true)
  }

  public updateSkeletons(world?: Mat4 | null) {
    if (this.skeletons) {
      for (const skeleton of this.skeletons) {
        skeleton.update(world)
      }
    }
  }

  public updateBounds() {
    const box = this.boundingBox.initEmpty()
    const sphere = this.boundingSphere.init()
    for (const node of this._sceneNodes) {
      const mesh = this.meshes[node.data.mesh]
      if (!mesh) {
        continue
      }
      BoundingBox.transform(mesh.boundingBox, node.world, tmpBox)
      box.merge(tmpBox)

      // TODO: review, this yields seemingly wrong results
      // BoundingSphere.transform(mesh.boundingSphere, node.world, tmpSphere)
      // sphere.mergeSphere(tmpSphere)
    }
    sphere.initFromBox(box)
  }

  public drawScene(drawFn: (node: Transform, data: NodeData, model: Model) => void) {
    for (const node of this._sceneNodes) {
      if (node.data.mesh != null) {
        drawFn(node, node.data, this)
      }
    }
  }

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
}

const tmpBox = new BoundingBox()
const tmpSphere = new BoundingSphere()

import {
  CameraComponent,
  getSpatialEntries,
  KeyboardInputSystem,
  ModelComponent,
  MouseInputSystem,
  SpatialComponent,
} from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent } from '@gglib/ecs'
import type { Mesh } from '@gglib/graphics'
import { KeyboardKey } from '@gglib/game'
import { Intersection, Mat4, Ray, Vec3, type BoundingBox, type Transform } from '@gglib/math'
import { brand, EventEmitter, type EventType } from '@gglib/utils'

export interface RaySelection {
  distance: number
  entity: GameEntity
  node: Transform
  mesh: Mesh
  box: BoundingBox
}

export class RaycastSystem extends GameSystem {
  public static readonly onSelect = brand<EventType<RaySelection>>(Symbol('onSelect'))

  private events = new EventEmitter()
  public onSelect = this.events.channel(RaycastSystem.onSelect)

  private mouse: MouseInputSystem
  private keyboard: KeyboardInputSystem
  private spatialQuery: GameQuery

  private ignoreList: Array<any> = []
  private selectList: RaySelection[] = []
  private selectIndex: number = 0

  private get selection() {
    return this.selectList[this.selectIndex]
  }

  public maxPickDistance: number = 1000
  public camera: CameraComponent
  public initialize(world: GameWorld): void {
    this.mouse = world.getSystem(MouseInputSystem)
    this.keyboard = world.getSystem(KeyboardInputSystem)
    this.spatialQuery = world.query({ scope: 'active', required: [SpatialComponent] })
  }

  public override update() {
    if (!this.camera) {
      return
    }

    // toggle through selection list
    if (this.keyboard.justPressed(KeyboardKey.Tab)) {
      const step = this.keyboard.isPressed(KeyboardKey.ShiftLeft) ? -1 : 1
      this.selectIndex = (this.selectIndex + step + this.selectList.length) % this.selectList.length
      this.emitSelection()
      return
    }

    const shiftThrough = this.keyboard.isPressed(KeyboardKey.AltLeft)
    if (!shiftThrough) {
      this.ignoreList.length = 0
    }

    if (this.mouse.buttonJustPressed(1)) {
      this.selectList.length = 0
      this.raycast(this.selectList)
      this.selectIndex = 0
      while (this.ignoreList.includes(this.selection?.node)) {
        this.selectIndex++
      }
      if (this.selection && shiftThrough) {
        this.ignoreList.push(this.selection.node)
      }
      this.emitSelection()
    }
  }

  private tmpRay = Ray.create()

  private raycast(output: RaySelection[]) {
    const ray = this.camera.createRay(this.mouse.xNormalized, this.mouse.yNormalized)
    for (const entity of this.spatialQuery) {
      entity.component(SpatialComponent).index.traverseIntersection(ray, Intersection.rayBox, (node) => {
        for (const item of getSpatialEntries(node).values) {
          const model = item.entity.component(ModelComponent, GetComponent.Optional)?.model
          if (!model) {
            continue
          }
          for (const node of model.sceneNodes) {
            const mesh = model.meshes[node.data.mesh]
            if (!mesh) {
              continue
            }

            // transform ray into local space of mesh
            const localRay = this.tmpRay
            const inv = Mat4.invert(node.world, Mat4.$0)
            inv.transformV3(ray.position, localRay.position)
            inv.transformV3Normal(ray.direction, localRay.direction)

            // check intersection
            const dLocal = localRay.intersectsBoxAt(mesh.boundingBox)
            if (isNaN(dLocal) || dLocal < 0) {
              continue
            }

            // transform intersection point back into world space
            localRay.positionAt(dLocal, Vec3.$0)
            node.world.transformV3(Vec3.$0, Vec3.$0)
            const distance = Vec3.distance(ray.position, Vec3.$0)

            // store result
            if (distance > 0 && distance < this.maxPickDistance) {
              output.push({
                distance,
                entity: item.entity,
                node: node,
                mesh: mesh,
                box: mesh.boundingBox,
              })
            }
          }
        }
      })
    }

    output.sort((a, b) => a.distance - b.distance)
  }

  private emitSelection() {
    const selection = this.selection
    if (selection) {
      this.events.emit(RaycastSystem.onSelect, selection)
    }
  }

  public destroy(): void {
    //
  }
}

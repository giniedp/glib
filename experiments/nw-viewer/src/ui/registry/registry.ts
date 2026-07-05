import { CameraComponent, GameLoop, MeshComponent, ModelComponent, TransformComponent } from '@gglib/components'
import { GameEntity, GameWorld } from '@gglib/ecs'
import { Geometry, Material, Mesh, WebglDevice, WebGpuDevice } from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import { Model } from '@gglib/model'
import type { Type } from '@gglib/utils'
import { DebugShapeSystem } from '../../game/debug/DebugShapeSystem'
import { LevelSystem } from '../../game/level/LevelSystem'
import { TimeOfDay } from '../../game/level/TimeOfDay'
import type { UiAnnotation } from './types'
import uiBoundingBox from './uiBoundingBox'
import uiBoundingSphere from './uiBoundingSphere'
import uiCameraComponent from './uiCameraComponent'
import uiDebugShapeSystem from './uiDebugShapeSystem'
import uiDevice from './uiDevice'
import uiGameEntity from './uiGameEntity'
import uiGameLoop from './uiGameLoop'
import uiGameWorld from './uiGameWorld'
import uiGeometry from './uiGeometry'
import uiLevelSystem from './uiLevelSystem'
import uiMaterial from './uiMaterial'
import uiMesh from './uiMesh'
import uiMeshComponent from './uiMeshComponent'
import uiModel from './uiModel'
import uiModelComponent from './uiModelComponent'
import uiTimeOfDay from './uiTimeOfDay'
import uiTransformComponent from './uiTransformComponent'

export class UiRegistry {
  private index = new Map<any, UiAnnotation<any>>()

  public add<T>(type: Type<T>, meta: UiAnnotation<T>) {
    this.index.set(type, meta)
  }

  public get<T>(type: Type<T>): UiAnnotation<T> | undefined {
    let current: any = type
    while (current && current !== Function.prototype) {
      if (this.index.has(current)) {
        return this.index.get(current)
      }
      current = Object.getPrototypeOf(current)
    }
    return undefined
  }
}

export function uiRegistry() {
  const result = new UiRegistry()
  result.add(BoundingBox, uiBoundingBox)
  result.add(BoundingSphere, uiBoundingSphere)
  result.add(CameraComponent, uiCameraComponent)
  result.add(GameEntity, uiGameEntity)
  result.add(GameLoop, uiGameLoop)
  result.add(GameWorld, uiGameWorld)
  result.add(Geometry, uiGeometry)
  result.add(Mesh, uiMesh)
  result.add(DebugShapeSystem, uiDebugShapeSystem)
  result.add(MeshComponent, uiMeshComponent)
  result.add(Model, uiModel)
  result.add(ModelComponent, uiModelComponent)
  result.add(TransformComponent, uiTransformComponent)
  result.add(WebglDevice, uiDevice)
  result.add(WebGpuDevice, uiDevice)
  result.add(Material, uiMaterial)
  result.add(TimeOfDay, uiTimeOfDay)
  result.add(LevelSystem, uiLevelSystem)
  return result
}

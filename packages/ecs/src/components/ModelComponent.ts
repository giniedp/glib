import { extend } from '@gglib/core'
import { Model as GraphicsModel } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { Component } from './../Component'
import { Entity } from './../Entity'
import { CullVisitor } from './RendererComponent'
import { TransformComponent } from './TransformComponent'

/**
 * @public
 */
export class ModelComponent implements Component {
  public readonly name: string = 'Renderable'
  public readonly service: boolean = true

  public entity: Entity
  public enabled: boolean = true

  public model: GraphicsModel
  public transform: TransformComponent
  public world: Mat4 = Mat4.createIdentity()

  constructor(params?: any) {
    if (params) {
      extend(this, params)
    }
  }
  public setup() {
    this.transform = this.entity.services.Transform as TransformComponent
  }
  public update() {
    if (this.transform) {
      this.world.initFrom(this.transform.worldMat)
    }
  }
  public collect(result: CullVisitor) {
    if (!this.model) {
      return
    }
    for (const mesh of this.model.meshes) {
      result.add({
        drawable: mesh,
        material: this.model.materials[mesh.materialId],
        world: this.world,
        data: null,
      })
    }
  }
}

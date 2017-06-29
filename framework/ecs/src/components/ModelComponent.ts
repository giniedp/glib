import { extend } from '@glib/core'
import { Model as GraphicsModel } from '@glib/graphics'
import { Mat4 } from '@glib/math'
import { Component } from './../Component'
import { Entity } from './../Entity'
import { CullVisitor } from './RendererComponent'
import { TransformComponent } from './TransformComponent'

export class ModelComponent implements Component {
  public node: Entity
  public name: string = 'Renderable'
  public service: boolean = true
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
    this.transform = this.node.s.Transform as TransformComponent
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
        mesh: mesh,
        effect: this.model.materials[mesh.materialId],
        world: this.world,
        data: null,
      })
    }
  }
}

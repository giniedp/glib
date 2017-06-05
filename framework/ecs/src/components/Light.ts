import { extend } from '@glib/core'
import { Vec3, Vec4 } from '@glib/math'

import { Component } from './../Component'
import { Entity } from './../Entity'
import { Transform } from './Transform'

export interface LightProperties {
  range?: number
  intensity?: number
  specularIntensity?: number
  spotOuterAngle?: number
  spotInnerAngle?: number
  castShadow?: boolean
  position?: Vec3
  direction?: Vec3
  color?: Vec4
  type?: number
}

export interface LightData {
  position: Vec4
  direction: Vec4
  color: Vec4
  misc: Vec4
}

export let LightType = {
  None: 0,
  Directional: 1,
  Point: 2,
  Spot: 3,
}

export let LightTypeName = {
  0: 'None',
  1: 'Directional',
  2: 'Point',
  3: 'Spot',
}

export class Light implements Component, LightProperties {
  public node: Entity
  public name: string = 'Light'
  public enabled: boolean = true
  public service: boolean = true

  public range: number = 0
  public intensity: number = 1
  public specularIntensity: number = 1
  public spotOuterAngle: number = 0
  public spotInnerAngle: number = 0
  public castShadow: boolean = false
  public position: Vec3
  public direction: Vec3
  public color: Vec4
  public type: number
  public packedData: LightData

  constructor(params?: LightProperties) {
    if (params) {
      extend(this, params)
    }

    this.position = Vec3.convert(this.position || Vec3.create(0, 0, 0))
    this.direction = Vec3.convert(this.direction || Vec3.create(0, 0, -1))
    this.color = Vec4.convert(this.color || Vec4.create(1, 1, 1, 1))
    this.type = this.type
    this.packedData = {
      position: Vec4.zero(),
      direction: Vec4.zero(),
      color: Vec4.zero(),
      misc: Vec4.zero(),
    }
  }

  public update() {
    let t = this.node.s.Transform as Transform
    if (t) {
      this.direction.x = -t.worldMat.backward[0]
      this.direction.y = -t.worldMat.backward[1]
      this.direction.z = -t.worldMat.backward[2]

      this.position.x = t.worldMat.translation[0]
      this.position.y = t.worldMat.translation[1]
      this.position.z = t.worldMat.translation[2]
    }

    this.updatePackedData()
  }

  public updatePackedData() {
    let data = this.packedData

    data.position.x = this.position.x
    data.position.y = this.position.y
    data.position.z = this.position.z

    data.direction.x = this.direction.x
    data.direction.y = this.direction.y
    data.direction.z = this.direction.z

    data.color.x = this.color.x * this.intensity
    data.color.y = this.color.y * this.intensity
    data.color.z = this.color.z * this.intensity
    data.color.w = this.color.w * this.specularIntensity

    data.misc.x = this.range
    data.misc.y = Math.cos(this.spotOuterAngle)
    data.misc.z = Math.cos(this.spotInnerAngle)
    data.misc.w = this.type
  }
}
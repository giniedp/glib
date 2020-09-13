import { ShaderEffect, Texture, ShaderEffectParameters, Device, createShaderEffectOptionsSync } from "@gglib/graphics"
import { Mat4, Vec2, Vec3, Vec4 } from "@gglib/math"
import { PARTICLE_PROGRAM } from "./particle.program"

export interface ParticleEffectParameters extends ShaderEffectParameters {
  readonly view: Mat4
  readonly projection: Mat4
  readonly viewportScale: Vec2
  currentTime: number
  texture: Texture
  duration: number
  durationRandomness: number
  readonly gravity: Vec3
  endVelocity: number
  minColor: number[]
  maxColor: number[]
  readonly rotateSpeed: Vec2
  readonly startSize: Vec2
  readonly endSize: Vec2
}

export class ParticleEffect extends ShaderEffect<ParticleEffectParameters> {
  constructor(device: Device) {
    super(device, {
      ...createShaderEffectOptionsSync(PARTICLE_PROGRAM),
      parameters: {
        view: Mat4.createIdentity(),
        projection: Mat4.createIdentity(),
        viewportScale: Vec2.createOne(),
        currentTime: 0,
        texture: null,
        duration: 0,
        durationRandomness: 0,
        gravity: Vec3.createZero(),
        endVelocity: 0,
        minColor: [1, 1, 1, 1],
        maxColor: [1, 1, 1, 1],
        rotateSpeed: Vec2.createZero(),
        startSize: Vec2.createZero(),
        endSize: Vec2.createZero(),
      }
    })
  }
}

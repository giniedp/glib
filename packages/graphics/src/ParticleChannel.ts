
import { IVec3 } from '@gglib/math'
import { Color } from './Color'
import { Device } from './Device'
import { BufferUsage, PrimitiveType } from './enums'
import { Buffer, ShaderProgram, Texture } from './resources'
import { BlendState, BlendStateParams } from './states'
import { VertexLayout } from './VertexLayout'

import fs from './Particle.fs'
import vs from './Particle.vs'

/**
 * @public
 */
export interface ParticleChannelOptions {
  /**
   * Maximum number of particles
   */
  maxParticles?: number
  /**
   * The texture for the particle
   */
  texture?: Texture
  /**
   * Duration of the particle
   */
  duration?: number
  /**
   * If greater than zero, some particles will last a shorter time than others.
   */
  durationRandomness?: number

  // Controls how much particles are influenced by the velocity of the object
  // which created them. You can see this in action with the explosion effect,
  // where the flames continue to move in the same direction as the source
  // projectile. The projectile trail particles, on the other hand, set this
  // value very low so they are less affected by the velocity of the projectile.
  emitterVelocitySensitivity?: number // = 1;

  // Range of values controlling how much X and Z axis velocity to give each
  // particle. Values for individual particles are randomly chosen from somewhere
  // between these limits.
  minHorizontalVelocity?: number
  maxHorizontalVelocity?: number

  // Range of values controlling how much Y axis velocity to give each particle.
  // Values for individual particles are randomly chosen from somewhere between
  // these limits.
  minVerticalVelocity?: number
  maxVerticalVelocity?: number

  // Direction and strength of the gravity effect. Note that this can point in any
  // direction, not just down! The fire effect points it upward to make the flames
  // rise, and the smoke plume points it sideways to simulate wind.
  gravity?: IVec3

  // Controls how the particle velocity will change over their lifetime. If set
  // to 1, particles will keep going at the same speed as when they were created.
  // If set to 0, particles will come to a complete stop right before they die.
  // Values greater than 1 make the particles speed up over time.
  endVelocity?: number

  // Range of values controlling the particle color and alpha. Values for
  // individual particles are randomly chosen from somewhere between these limits.
  minColor?: number
  maxColor?: number

  // Range of values controlling how fast the particles rotate. Values for
  // individual particles are randomly chosen from somewhere between these
  // limits. If both these values are set to 0, the particle system will
  // automatically switch to an alternative shader technique that does not
  // support rotation, and thus requires significantly less GPU power. This
  // means if you don't need the rotation effect, you may get a performance
  // boost from leaving these values at 0.
  minRotateSpeed?: number
  maxRotateSpeed?: number

  // Range of values controlling how big the particles are when first created.
  // Values for individual particles are randomly chosen from somewhere between
  // these limits.
  minStartSize?: number
  maxStartSize?: number

  // Range of values controlling how big particles become at the end of their
  // life. Values for individual particles are randomly chosen from somewhere
  // between these limits.
  minEndSize?: number
  maxEndSize?: number

  // Alpha blending settings.
  blendState?: BlendStateParams // = BlendState.NonPremultiplied;
}

/**
 * @public
 */
export class ParticleVertices {
  public readonly stride: number
  public readonly data: DataView
  private index: number

  public readonly layout: VertexLayout = {
    corner: { type: 'int16', offset: 0, elements: 2 },
    position: { type: 'float32', offset: 4, elements: 3 },
    velocity: { type: 'float32', offset: 16, elements: 3 },
    random: { type: 'uint8', offset: 28, elements: 4, normalize: true, packed: true },
    time: { type: 'float32', offset: 32, elements: 1 },
  }

  constructor(count: number) {
    this.stride = VertexLayout.countBytes(this.layout)
    this.data = new DataView(new ArrayBuffer(count * this.stride))
  }

  public seek(index: number) {
    this.index = index * this.stride
    return this
  }

  public get buffer() {
    return this.data.buffer
  }

  public setCorner(x: number, y: number) {
    this.data.setInt16(this.index + this.layout.corner.offset, x, true)
    this.data.setInt16(this.index + this.layout.corner.offset + 2, y, true)
  }

  public setPosition(x: number, y: number, z: number) {
    const index = this.index + this.layout.position.offset
    this.data.setFloat32(index + 0 * 4, x, true)
    this.data.setFloat32(index + 1 * 4, y, true)
    this.data.setFloat32(index + 2 * 4, z, true)
  }

  public setVelocity(x: number, y: number, z: number) {
    const index = this.index + this.layout.velocity.offset
    this.data.setFloat32(index + 0 * 4, x, true)
    this.data.setFloat32(index + 1 * 4, y, true)
    this.data.setFloat32(index + 2 * 4, z, true)
  }
  public setRandom(v: number) {
    this.data.setInt32(this.index + this.layout.random.offset, v, true)
  }
  public getTime(): number {
    return this.data.getFloat32(this.index + this.layout.time.offset, true)
  }
  public setTime(v: number) {
    this.data.setFloat32(this.index + this.layout.time.offset, v, true)
  }
}

const defaultOptions = Object.freeze<ParticleChannelOptions>({
  maxParticles: 1000,
  duration: 1000,
  emitterVelocitySensitivity: 1,
  minHorizontalVelocity: 0,
  maxHorizontalVelocity: 0,
  minVerticalVelocity: 0,
  maxVerticalVelocity: 0,
  endVelocity: 1,
  minColor: Color.White.rgba,
  maxColor: Color.White.rgba,
  minRotateSpeed: 0,
  maxRotateSpeed: 0,
  minStartSize: 1,
  maxStartSize: 1,
  minEndSize: 1,
  maxEndSize: 1,
  blendState: BlendState.NonPremultiplied,
})

/**
 * @public
 */
export class ParticleChannel {

  /**
   * The vertex buffer
   */
  public readonly vertexBuffer: Buffer
  /**
   * The index buffer
   */
  public readonly indexBuffer: Buffer
  /**
   * The particle data
   */
  public readonly vertices: ParticleVertices
  /**
   * The effect
   */
  public readonly program: ShaderProgram

  private startActive: number = 0
  private startNew: number = 0
  private startFree: number = 0
  private startRetired: number = 0
  private time: number = 0
  private frame: number = 0

  private particleCount: number
  private settings: ParticleChannelOptions

  constructor(private device: Device, options: ParticleChannelOptions = {}) {
    this.settings = {
      ...defaultOptions,
      ...options,
    }
    this.particleCount = this.settings.maxParticles

    this.vertices = new ParticleVertices(this.particleCount * 4)
    for (let i = 0; i < this.particleCount; i++) {
      this.vertices.seek(i * 4 + 0).setCorner(-1, -1)
      this.vertices.seek(i * 4 + 1).setCorner(1, -1)
      this.vertices.seek(i * 4 + 2).setCorner(1, 1)
      this.vertices.seek(i * 4 + 3).setCorner(-1, 1)
    }
    this.vertexBuffer = this.device.createVertexBuffer({
      layout: this.vertices.layout,
      usage: BufferUsage.Dynamic,
      data: this.vertices.buffer,
    })
    const indices = []
    for (let i = 0; i < this.particleCount; i++) {
      indices[i * 6 + 0] = i * 4 + 0
      indices[i * 6 + 1] = i * 4 + 1
      indices[i * 6 + 2] = i * 4 + 2
      indices[i * 6 + 3] = i * 4 + 0
      indices[i * 6 + 4] = i * 4 + 2
      indices[i * 6 + 5] = i * 4 + 3
    }
    this.indexBuffer = this.device.createIndexBuffer({
      dataType: 'uint16',
      data: indices,
    })
    this.program = this.device.createProgram({
      vertexShader: vs,
      fragmentShader: fs,
    })

    this.setup()
  }

  public setup(options?: ParticleChannelOptions) {
    if (options) {
      this.settings = {
        ...defaultOptions,
        ...this.settings,
        ...options,
      }
    }

    this.program.setUniform('duration', this.settings.duration)
    this.program.setUniform('durationRandomness', this.settings.durationRandomness)
    this.program.setUniform('gravity', this.settings.gravity)
    this.program.setUniform('endVelocity', this.settings.endVelocity)
    this.program.setUniform('minColor', Color.fromRgba(this.settings.minColor))
    this.program.setUniform('maxColor', Color.fromRgba(this.settings.maxColor))
    this.program.setUniform('rotateSpeed', [this.settings.minRotateSpeed, this.settings.maxRotateSpeed])
    this.program.setUniform('startSize', [this.settings.minStartSize, this.settings.maxStartSize])
    this.program.setUniform('endSize', [this.settings.minEndSize, this.settings.maxEndSize])
  }

  public update(dt: number) {
    this.time += dt
    this.retireParticles()
    this.freeParticles()
    if (this.startActive === this.startFree) {
      this.time = 0
    }
    if (this.startRetired === this.startActive) {
      this.frame = 0
    }
  }

  public draw(program: ShaderProgram = this.program) {
    this.frame++
    // update vertex buffer
    this.vertexBuffer.setData(this.vertices.data)
    // update pointer
    this.startNew = this.startFree
    // test if there are any active particles to draw
    if (this.startActive === this.startFree) {
      return
    }

    // update program uniforms
    program.setUniform('viewportScale', [0.5 / this.device.drawingBufferAspectRatio, -0.5])
    program.setUniform('currentTime', this.time)
    program.setUniform('texture', this.settings.texture)

    // set device state
    this.device.program = program
    this.device.blendState = this.settings.blendState
    this.device.indexBuffer = this.indexBuffer
    this.device.vertexBuffer = this.vertexBuffer

    // draw the buffer
    if (this.startActive < this.startFree) {
      this.device.drawIndexedPrimitives(
        PrimitiveType.TriangleList,
        this.startActive * 6,
        (this.startFree - this.startActive) * 6,
      )
    } else {
      this.device.drawIndexedPrimitives(
        PrimitiveType.TriangleList,
        this.startActive * 6,
        (this.particleCount - this.startActive) * 6,
      )
      if (this.startFree > 0) {
        this.device.drawIndexedPrimitives(
          PrimitiveType.TriangleList,
          0,
          (this.startFree) * 6,
        )
      }
    }
  }

  public emit(position: IVec3, velocity: IVec3) {
    let nextParticle = this.startFree + 1
    if (nextParticle >= this.particleCount) {
      nextParticle = 0
    }

    if (nextParticle === this.startRetired) {
      return
    }

    velocity.x *= this.settings.emitterVelocitySensitivity
    velocity.y *= this.settings.emitterVelocitySensitivity
    velocity.z *= this.settings.emitterVelocitySensitivity
    const hVelocity = this.lerp(this.settings.minHorizontalVelocity, this.settings.maxHorizontalVelocity, Math.random())
    const hAngle = Math.random() * Math.PI * 2

    velocity.x += hVelocity * Math.cos(hAngle)
    velocity.z += hVelocity * Math.sin(hAngle)
    velocity.y += this.lerp(this.settings.minVerticalVelocity, this.settings.maxVerticalVelocity, Math.random())

    const random = Color.xyzw(Math.random(), Math.random(), Math.random(), Math.random())
    for (let i = 0; i < 4; i++) {
      this.vertices.seek(this.startFree * 4 + i)
      this.vertices.setPosition(position.x, position.y, position.z)
      this.vertices.setVelocity(velocity.x, velocity.y, velocity.z)
      this.vertices.setRandom(random)
      this.vertices.setTime(this.time)
    }
    this.startFree = nextParticle
  }

  private retireParticles() {
    const duration = this.settings.duration
    while (this.startActive !== this.startNew) {
      this.vertices.seek(this.startActive * 4)
      const age = this.time - this.vertices.getTime()
      if (age < duration) {
        return
      }
      // remember the time at which particle is retired
      this.vertices.setTime(this.frame)
      // shift active pointer
      this.startActive++
      // wrap around
      if (this.startActive >= this.particleCount) {
        this.startActive = 0
      }
    }
  }

  private freeParticles() {
    while (this.startRetired !== this.startActive) {
      this.vertices.seek(this.startRetired * 4)
      const age = this.frame - this.vertices.getTime()
      if (age < 3) {
        // abort if particle is not older than 3 frames
        return
      }
      // shift retired pointer
      this.startRetired++
      // wrap around
      if (this.startRetired >= this.particleCount) {
        this.startRetired = 0
      }
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t
  }
}

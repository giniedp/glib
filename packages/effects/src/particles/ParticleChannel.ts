import {
  BlendState,
  bufferField,
  bufferLayout,
  bufferRecorder,
  BufferRecorder,
  Device,
  Texture,
  VertexBuffer,
} from '@gglib/graphics'
import { IVec4, lerp, vec2, Vec2, vec3, Vec3, vec4, Vec4, type IVec3 } from '@gglib/math'
import { ParticleMaterial } from './ParticleMaterial'
// import { ParticleEffect } from './ParticleEffect'

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
  minColor?: IVec4
  maxColor?: IVec4

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
  blendState?: BlendState
}

const defaultOptions = Object.freeze<Required<ParticleChannelOptions>>({
  maxParticles: 1000,
  duration: 1,
  durationRandomness: 0,
  emitterVelocitySensitivity: 1,
  minHorizontalVelocity: 0,
  maxHorizontalVelocity: 0,
  minVerticalVelocity: 0,
  maxVerticalVelocity: 0,
  endVelocity: 1,
  minColor: vec4(1),
  maxColor: vec4(1),
  minRotateSpeed: 0,
  maxRotateSpeed: 0,
  minStartSize: 1,
  maxStartSize: 1,
  minEndSize: 1,
  maxEndSize: 1,
  blendState: BlendState.Alpha,
  gravity: vec3(),
  texture: null,
})

/**
 * @public
 */
export class ParticleChannel {
  public readonly settings: ParticleChannelOptions

  /**
   * The vertex buffer
   */
  public readonly vertexBuffer: VertexBuffer

  /**
   * The effect
   */
  public readonly material: ParticleMaterial

  private device: Device
  private writer: BufferRecorder
  private layout = bufferLayout([
    bufferField('position', 'vec3f'),
    bufferField('velocity', 'vec3f'),
    bufferField('random', 'vec4f'),
    bufferField('time', 'f32'),
  ])

  private capacity: number
  private startActive: number = 0
  private startNew: number = 0
  private startFree: number = 0
  private startRetired: number = 0
  private time: number = 0
  private frame: number = 0
  private times: number[] = []
  private frames: number[] = []

  constructor(device: Device, options: ParticleChannelOptions = {}) {
    this.device = device
    this.settings = {
      ...defaultOptions,
      ...options,
    }
    this.capacity = this.settings.maxParticles
    this.writer = bufferRecorder({
      capacity: this.capacity,
      recordByteSize: this.layout.byteSize,
    })

    this.vertexBuffer = this.device.createVertexBuffer([
      {
        layout: this.layout.vertex,
        instanced: true,
        stride: this.layout.byteSize,
        size: this.layout.byteSize * this.capacity,
      },
    ])

    this.material = new ParticleMaterial(this.device, { properties: {} })
  }

  private updateParameters() {
    const mtl = this.material
    const settings = this.settings
    mtl.Duration = settings.duration
    mtl.DurationRandomness = settings.durationRandomness
    mtl.Gravity = Vec3.initFrom(mtl.Gravity || vec3(), settings.gravity)
    mtl.EndVelocity = settings.endVelocity
    mtl.MinColor = Vec4.initFrom(mtl.MinColor || vec4(), settings.minColor)
    mtl.MaxColor = Vec4.initFrom(mtl.MaxColor || vec4(), settings.maxColor)
    mtl.RotateSpeed = Vec2.init(mtl.RotateSpeed || vec2, settings.minRotateSpeed, settings.maxRotateSpeed)
    mtl.StartSize = Vec2.init(mtl.StartSize || vec2(), settings.minStartSize, settings.maxStartSize)
    mtl.EndSize = Vec2.init(mtl.EndSize || vec2(), settings.minEndSize, settings.maxEndSize)
    mtl.Scale = Vec2.init(mtl.Scale || vec2(), 0.5 / this.device.output.aspectRatio, 0.5)
    mtl.Time = this.time
    mtl.ColorMap = settings.texture || this.device.defaultTexture
  }

  public update(time: number, dt: number) {
    this.time += dt
    this.retireParticles()
    this.freeParticles()
    this.updateParameters()
    if (this.startActive === this.startFree) {
      this.time = 0
    }
    if (this.startRetired === this.startActive) {
      this.frame = 0
    }
  }

  public draw() {
    this.frame++

    this.startNew = this.startFree
    if (this.startActive === this.startFree) {
      // no active particles
      return
    }

    const pass = this.device.renderPass
    const program = this.material.effect.program
    program.applyBlocks(this.material.inputBlocks)
    program.commit()

    pass.setProgram(program)
    pass.setRenderBlend(0, this.settings.blendState)
    pass.setVertexBuffer(this.vertexBuffer)
    pass.setPrimitiveType('triangle-strip')

    if (this.device.isWebGL2) {
      // webGL does not support instance offset
      this.drawWebGL()
    } else {
      this.writer.upload(this.vertexBuffer.buffers[0])
      if (this.startActive < this.startFree) {
        pass.draw(4, this.startFree - this.startActive, 0, this.startActive)
      } else {
        pass.draw(4, this.capacity - this.startActive, 0, this.startActive)
        if (this.startFree > 0) {
          pass.draw(4, this.startFree, 0, 0)
        }
      }
    }
  }

  private drawWebGL() {
    const pass = this.device.renderPass
    const source = this.writer.buffer
    const target = this.vertexBuffer.buffers[0]
    const stride = this.writer.strideInBytes
    let count = 0
    if (this.startActive < this.startFree) {
      count = this.startFree - this.startActive
      target.setSubData(0, source, this.startActive * stride, count * stride)
      pass.draw(4, count, 0, 0)
    } else {
      count = this.capacity - this.startActive
      target.setSubData(0, source, this.startActive * stride, count * stride)
      pass.draw(4, count, 0, 0)
      if (this.startFree > 0) {
        count = this.startFree
        target.setSubData(0, source, 0, count * stride)
        pass.draw(4, count, 0, 0)
      }
    }
  }

  public emit(position: IVec3, velocity: IVec3) {
    let nextParticle = this.startFree + 1
    if (nextParticle >= this.capacity) {
      nextParticle = 0
    }

    if (nextParticle === this.startRetired) {
      return
    }

    velocity.x *= this.settings.emitterVelocitySensitivity
    velocity.y *= this.settings.emitterVelocitySensitivity
    velocity.z *= this.settings.emitterVelocitySensitivity
    const hVelocity = lerp(this.settings.minHorizontalVelocity, this.settings.maxHorizontalVelocity, Math.random())
    const hAngle = Math.random() * Math.PI * 2

    velocity.x += hVelocity * Math.cos(hAngle)
    velocity.z += hVelocity * Math.sin(hAngle)
    velocity.y += lerp(this.settings.minVerticalVelocity, this.settings.maxVerticalVelocity, Math.random())

    this.writer.seek(this.startFree)
    this.writer.writeField(this.layout.fields.position, position)
    this.writer.writeField(this.layout.fields.velocity, velocity)
    this.writer.writeField(this.layout.fields.random, Vec4.$0.initRandom())
    this.writer.writeField(this.layout.fields.time, this.time)
    this.times[this.startFree] = this.time
    this.frames[this.startFree] = this.frame
    this.startFree = nextParticle
  }

  private retireParticles() {
    const duration = this.settings.duration
    while (this.startActive !== this.startNew) {
      const age = this.time - this.times[this.startActive]
      if (age < duration) {
        return
      }
      // remember the time at which particle is retired
      this.frames[this.startActive] = this.frame
      this.times[this.startActive] = this.time
      // shift active pointer
      this.startActive++
      // wrap around
      if (this.startActive >= this.capacity) {
        this.startActive = 0
      }
    }
  }

  private freeParticles() {
    while (this.startRetired !== this.startActive) {
      const age = this.frame - this.frames[this.startRetired]
      if (age < 3) {
        // abort if particle is not older than 3 frames
        return
      }
      // shift retired pointer
      this.startRetired++
      // wrap around
      if (this.startRetired >= this.capacity) {
        this.startRetired = 0
      }
    }
  }
}

// tslint:disable max-classes-per-file
import { BlendStateParams, Buffer, Color, Device, Texture } from '@gglib/graphics'
import { IVec3 } from '@gglib/math'
import { OnAdded, OnInit, OnRemoved, OnUpdate } from '../Component'
import { Entity } from '../Entity'

/**
 * @public
 */
export interface ParticleSystemSettings {
  texture: Texture
  maxParticles: number
  duration: number
  // If greater than zero, some particles will last a shorter time than others.
  durationRandomness: number

  // Controls how much particles are influenced by the velocity of the object
  // which created them. You can see this in action with the explosion effect,
  // where the flames continue to move in the same direction as the source
  // projectile. The projectile trail particles, on the other hand, set this
  // value very low so they are less affected by the velocity of the projectile.
  emitterVelocitySensitivity: number // = 1;

  // Range of values controlling how much X and Z axis velocity to give each
  // particle. Values for individual particles are randomly chosen from somewhere
  // between these limits.
  minHorizontalVelocity: number // = 0;
  maxHorizontalVelocity: number // = 0;

  // Range of values controlling how much Y axis velocity to give each particle.
  // Values for individual particles are randomly chosen from somewhere between
  // these limits.
  minVerticalVelocity: number // = 0;
  maxVerticalVelocity: number // = 0;

  // Direction and strength of the gravity effect. Note that this can point in any
  // direction, not just down! The fire effect points it upward to make the flames
  // rise, and the smoke plume points it sideways to simulate wind.
  gravity: IVec3 // = Vector3.Zero;

  // Controls how the particle velocity will change over their lifetime. If set
  // to 1, particles will keep going at the same speed as when they were created.
  // If set to 0, particles will come to a complete stop right before they die.
  // Values greater than 1 make the particles speed up over time.
  endVelocity: number // = 1;

  // Range of values controlling the particle color and alpha. Values for
  // individual particles are randomly chosen from somewhere between these limits.
  minColor: number // = Color.White;
  maxColor: number // = Color.White;

  // Range of values controlling how fast the particles rotate. Values for
  // individual particles are randomly chosen from somewhere between these
  // limits. If both these values are set to 0, the particle system will
  // automatically switch to an alternative shader technique that does not
  // support rotation, and thus requires significantly less GPU power. This
  // means if you don't need the rotation effect, you may get a performance
  // boost from leaving these values at 0.
  minRotateSpeed: number // = 0;
  maxRotateSpeed: number // = 0;

  // Range of values controlling how big the particles are when first created.
  // Values for individual particles are randomly chosen from somewhere between
  // these limits.
  minStartSize: number // = 100;
  maxStartSize: number // = 100;

  // Range of values controlling how big particles become at the end of their
  // life. Values for individual particles are randomly chosen from somewhere
  // between these limits.
  minEndSize: number // = 100;
  maxEndSize: number // = 100;

  // Alpha blending settings.
  blendState: BlendStateParams // = BlendState.NonPremultiplied;
}

export class ParticlesWriter {
  private stride: number
  private index: number
  private data: DataView

  public layout = {
    corner:   { type: 'short', offset: 0, elements: 2 },
    position: { type: 'float', offset: 4, elements: 3 },
    velocity: { type: 'float', offset: 16, elements: 3 },
    random:   { type: 'ubyte', offset: 28, elements: 4, normalize: true, packed: true },
    time:     { type: 'float', offset: 32, elements: 1},
  }

  constructor(data: ArrayBuffer) {
    this.data = new DataView(data)
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
    this.data.setInt16(this.index + this.layout.corner.offset + 2, x, true)
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

export class ParticleSystemComponent implements OnAdded, OnRemoved, OnInit, OnUpdate {

  public device: Device

  /**
   * The vertex buffer
   */
  private vertexBuffer: Buffer
  /**
   * The index buffer
   */
  private indexBuffer: Buffer
  /**
   * The particle data
   */
  private particles: ParticlesWriter

  private startActive: number
  private startNew: number
  private startFree: number
  private startRetired: number
  private time: number
  private frame: number

  private settings: ParticleSystemSettings

  public onAdded(entity: Entity) {
    entity.addService(ParticleSystemComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.removeService(ParticleSystemComponent)
  }

  public onInit(entity: Entity) {
    this.device = entity.getService(Device)
  }

  public onUpdate(dt: number) {
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

  public emit(position: IVec3, velocity: IVec3, channel: string) {
    let nextParticle = this.startFree + 1
    if (nextParticle >= this.settings.maxParticles) {
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
      this.particles.seek(this.startFree * 4 + i)
      this.particles.setPosition(position.x, position.y, position.z)
      this.particles.setVelocity(velocity.x, velocity.y, velocity.z)
      this.particles.setRandom(random)
      this.particles.setTime(this.time)
    }
    this.startFree = nextParticle
  }

  private retireParticles() {
    const duration = this.settings.duration
    while (this.startActive !== this.startNew) {
      const age = this.time - this.particles.seek(this.startActive * 4).getTime()
      if (age < duration) {
        return
      }
      // remember the time at which particle is retired
      this.particles.setTime(this.frame)
      // shift active pointer
      this.startActive++
      // wrap around
      if (this.startActive >= this.settings.maxParticles) {
        this.startActive = 0
      }
    }
  }

  private freeParticles() {
    while (this.startRetired !== this.startActive) {
      const age = this.frame - this.particles.seek(this.startRetired * 4).getTime()
      if (age < 3) {
        // abort if particle is not older than 3 frames
        return
      }
      // shift retired pointer
      this.startRetired++
      // wrap around
      if (this.startRetired >= this.settings.maxParticles) {
        this.startRetired = 0
      }
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t
  }
}

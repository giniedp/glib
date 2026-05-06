// import {
//   BlendState,
//   Buffer,
//   Color,
//   countBytes,
//   Device,
//   Texture,
//   VertexBuffer,
//   type VertexLayout,
// } from '@gglib/graphics'
// import type { IVec3 } from '@gglib/math'
// import { ParticleEffect } from './ParticleEffect'

// /**
//  * @public
//  */
// export interface ParticleChannelOptions {
//   /**
//    * Maximum number of particles
//    */
//   maxParticles?: number
//   /**
//    * The texture for the particle
//    */
//   texture?: Texture
//   /**
//    * Duration of the particle
//    */
//   duration?: number
//   /**
//    * If greater than zero, some particles will last a shorter time than others.
//    */
//   durationRandomness?: number

//   // Controls how much particles are influenced by the velocity of the object
//   // which created them. You can see this in action with the explosion effect,
//   // where the flames continue to move in the same direction as the source
//   // projectile. The projectile trail particles, on the other hand, set this
//   // value very low so they are less affected by the velocity of the projectile.
//   emitterVelocitySensitivity?: number // = 1;

//   // Range of values controlling how much X and Z axis velocity to give each
//   // particle. Values for individual particles are randomly chosen from somewhere
//   // between these limits.
//   minHorizontalVelocity?: number
//   maxHorizontalVelocity?: number

//   // Range of values controlling how much Y axis velocity to give each particle.
//   // Values for individual particles are randomly chosen from somewhere between
//   // these limits.
//   minVerticalVelocity?: number
//   maxVerticalVelocity?: number

//   // Direction and strength of the gravity effect. Note that this can point in any
//   // direction, not just down! The fire effect points it upward to make the flames
//   // rise, and the smoke plume points it sideways to simulate wind.
//   gravity?: IVec3

//   // Controls how the particle velocity will change over their lifetime. If set
//   // to 1, particles will keep going at the same speed as when they were created.
//   // If set to 0, particles will come to a complete stop right before they die.
//   // Values greater than 1 make the particles speed up over time.
//   endVelocity?: number

//   // Range of values controlling the particle color and alpha. Values for
//   // individual particles are randomly chosen from somewhere between these limits.
//   minColor?: number
//   maxColor?: number

//   // Range of values controlling how fast the particles rotate. Values for
//   // individual particles are randomly chosen from somewhere between these
//   // limits. If both these values are set to 0, the particle system will
//   // automatically switch to an alternative shader technique that does not
//   // support rotation, and thus requires significantly less GPU power. This
//   // means if you don't need the rotation effect, you may get a performance
//   // boost from leaving these values at 0.
//   minRotateSpeed?: number
//   maxRotateSpeed?: number

//   // Range of values controlling how big the particles are when first created.
//   // Values for individual particles are randomly chosen from somewhere between
//   // these limits.
//   minStartSize?: number
//   maxStartSize?: number

//   // Range of values controlling how big particles become at the end of their
//   // life. Values for individual particles are randomly chosen from somewhere
//   // between these limits.
//   minEndSize?: number
//   maxEndSize?: number

//   // Alpha blending settings.
//   blendState?: BlendState // = BlendState.NonPremultiplied;
// }

// /**
//  * @public
//  */
// export class ParticleVertices {
//   public readonly stride: number
//   public readonly data: DataView<ArrayBuffer>
//   private index: number

//   public readonly layout: VertexLayout = {
//     corner: { elementType: 'int16', byteOffset: 0, elementCount: 2 },
//     position: { elementType: 'float32', byteOffset: 4, elementCount: 3 },
//     velocity: { elementType: 'float32', byteOffset: 16, elementCount: 3 },
//     random: { elementType: 'int32', byteOffset: 28, elementCount: 1, normalized: true },
//     time: { elementType: 'float32', byteOffset: 32, elementCount: 1 },
//   }

//   constructor(count: number) {
//     this.stride = countBytes(this.layout)
//     this.data = new DataView(new ArrayBuffer(count * this.stride))
//   }

//   public seek(index: number) {
//     this.index = index * this.stride
//     return this
//   }

//   public get buffer() {
//     return this.data.buffer
//   }

//   public setCorner(x: number, y: number) {
//     this.data.setInt16(this.index + this.layout['corner'].byteOffset, x, true)
//     this.data.setInt16(this.index + this.layout['corner'].byteOffset + 2, y, true)
//   }

//   public setPosition(x: number, y: number, z: number) {
//     const index = this.index + this.layout['position'].byteOffset
//     this.data.setFloat32(index + 0 * 4, x, true)
//     this.data.setFloat32(index + 1 * 4, y, true)
//     this.data.setFloat32(index + 2 * 4, z, true)
//   }

//   public setVelocity(x: number, y: number, z: number) {
//     const index = this.index + this.layout['velocity'].byteOffset
//     this.data.setFloat32(index + 0 * 4, x, true)
//     this.data.setFloat32(index + 1 * 4, y, true)
//     this.data.setFloat32(index + 2 * 4, z, true)
//   }
//   public setRandom(v: number) {
//     this.data.setInt32(this.index + this.layout['random'].byteOffset, v, true)
//   }
//   public getTime(): number {
//     return this.data.getFloat32(this.index + this.layout['time'].byteOffset, true)
//   }
//   public setTime(v: number) {
//     this.data.setFloat32(this.index + this.layout['time'].byteOffset, v, true)
//   }
// }

// const defaultOptions = Object.freeze<ParticleChannelOptions>({
//   maxParticles: 1000,
//   duration: 1000,
//   durationRandomness: 0,
//   emitterVelocitySensitivity: 1,
//   minHorizontalVelocity: 0,
//   maxHorizontalVelocity: 0,
//   minVerticalVelocity: 0,
//   maxVerticalVelocity: 0,
//   endVelocity: 1,
//   minColor: Color.packToRGBA(Color.White),
//   maxColor: Color.packToRGBA(Color.White),
//   minRotateSpeed: 0,
//   maxRotateSpeed: 0,
//   minStartSize: 1,
//   maxStartSize: 1,
//   minEndSize: 1,
//   maxEndSize: 1,
//   blendState: BlendState.NonPremultiplied,
// })

// /**
//  * @public
//  */
// export class ParticleChannel {
//   /**
//    * The vertex buffer
//    */
//   public readonly vertexBuffer: VertexBuffer
//   /**
//    * The index buffer
//    */
//   public readonly indexBuffer: Buffer
//   /**
//    * The particle data
//    */
//   public readonly vertices: ParticleVertices
//   /**
//    * The effect
//    */
//   public readonly material: ParticleEffect

//   private startActive: number = 0
//   private startNew: number = 0
//   private startFree: number = 0
//   private startRetired: number = 0
//   private time: number = 0
//   private frame: number = 0

//   private particleCount: number
//   public readonly settings: ParticleChannelOptions
//   private device: Device
//   constructor(device: Device, options: ParticleChannelOptions = {}) {
//     this.device = device
//     this.settings = {
//       ...defaultOptions,
//       ...options,
//     }
//     this.particleCount = this.settings.maxParticles

//     this.vertices = new ParticleVertices(this.particleCount * 4)
//     for (let i = 0; i < this.particleCount; i++) {
//       this.vertices.seek(i * 4 + 0).setCorner(-1, -1)
//       this.vertices.seek(i * 4 + 1).setCorner(1, -1)
//       this.vertices.seek(i * 4 + 2).setCorner(1, 1)
//       this.vertices.seek(i * 4 + 3).setCorner(-1, 1)
//     }
//     this.vertexBuffer = this.device.createVertexBuffer([
//       {
//         vertexLayout: this.vertices.layout,
//         data: this.vertices.buffer,
//       },
//     ])
//     const indices: number[] = []
//     for (let i = 0; i < this.particleCount; i++) {
//       indices[i * 6 + 0] = i * 4 + 0
//       indices[i * 6 + 1] = i * 4 + 1
//       indices[i * 6 + 2] = i * 4 + 2
//       indices[i * 6 + 3] = i * 4 + 0
//       indices[i * 6 + 4] = i * 4 + 2
//       indices[i * 6 + 5] = i * 4 + 3
//     }
//     this.indexBuffer = this.device.createIndexBuffer({
//       indexType: 'uint16',
//       data: new Uint16Array(indices),
//     })

//     this.material = new ParticleEffect(this.device)
//   }

//   private updateParameters() {
//     const params = this.material.parameters
//     const settings = this.settings
//     params.duration = settings.duration
//     params.durationRandomness = settings.durationRandomness
//     params.gravity.initFrom(settings.gravity)
//     params.endVelocity = settings.endVelocity
//     params.minColor = settings.minColor
//     params.maxColor = settings.maxColor
//     params.rotateSpeed.init(settings.minRotateSpeed, settings.maxRotateSpeed)
//     params.startSize.init(settings.minStartSize, settings.maxStartSize)
//     params.endSize.init(settings.minEndSize, settings.maxEndSize)
//     params.viewportScale.init(0.5 / this.device.output.aspectRatio, -0.5)
//     params.currentTime = this.time
//     params.texture = settings.texture
//   }

//   public update(dt: number) {
//     this.time += dt
//     this.retireParticles()
//     this.freeParticles()
//     this.updateParameters()
//     if (this.startActive === this.startFree) {
//       this.time = 0
//     }
//     if (this.startRetired === this.startActive) {
//       this.frame = 0
//     }
//   }

//   public draw() {
//     this.frame++
//     // update vertex buffer
//     this.vertexBuffer.buffers[0].setData(this.vertices.data.buffer)
//     // update pointer
//     this.startNew = this.startFree
//     // test if there are any active particles to draw
//     if (this.startActive === this.startFree) {
//       return
//     }

//     // set device state
//     const pass = this.device.renderPass
//     const effectPass = this.material.effect.pass(0)
//     effectPass.apply(pass, this.material.parameters)
//     pass.setRenderBlend(0, this.settings.blendState)
//     pass.setIndexBuffer(this.indexBuffer)
//     pass.setVertexBuffer(this.vertexBuffer)
//     pass.setPrimitiveType('TriangleList')
//     // draw the buffer
//     if (this.startActive < this.startFree) {
//       pass.drawIndexed((this.startFree - this.startActive) * 6, 1, this.startActive * 6, 0)
//     } else {
//       pass.drawIndexed((this.particleCount - this.startActive) * 6, 1, this.startActive * 6, 0)
//       if (this.startFree > 0) {
//         pass.drawIndexed(this.startFree * 6, 1, 0, 0)
//       }
//     }
//   }

//   public emit(position: IVec3, velocity: IVec3) {
//     let nextParticle = this.startFree + 1
//     if (nextParticle >= this.particleCount) {
//       nextParticle = 0
//     }

//     if (nextParticle === this.startRetired) {
//       return
//     }

//     velocity.x *= this.settings.emitterVelocitySensitivity
//     velocity.y *= this.settings.emitterVelocitySensitivity
//     velocity.z *= this.settings.emitterVelocitySensitivity
//     const hVelocity = this.lerp(this.settings.minHorizontalVelocity, this.settings.maxHorizontalVelocity, Math.random())
//     const hAngle = Math.random() * Math.PI * 2

//     velocity.x += hVelocity * Math.cos(hAngle)
//     velocity.z += hVelocity * Math.sin(hAngle)
//     velocity.y += this.lerp(this.settings.minVerticalVelocity, this.settings.maxVerticalVelocity, Math.random())

//     const random = Color.packToRGBA(Color.create(Math.random(), Math.random(), Math.random(), Math.random()))
//     for (let i = 0; i < 4; i++) {
//       this.vertices.seek(this.startFree * 4 + i)
//       this.vertices.setPosition(position.x, position.y, position.z)
//       this.vertices.setVelocity(velocity.x, velocity.y, velocity.z)
//       this.vertices.setRandom(random)
//       this.vertices.setTime(this.time)
//     }
//     this.startFree = nextParticle
//   }

//   private retireParticles() {
//     const duration = this.settings.duration
//     while (this.startActive !== this.startNew) {
//       this.vertices.seek(this.startActive * 4)
//       const age = this.time - this.vertices.getTime()
//       if (age < duration) {
//         return
//       }
//       // remember the time at which particle is retired
//       this.vertices.setTime(this.frame)
//       // shift active pointer
//       this.startActive++
//       // wrap around
//       if (this.startActive >= this.particleCount) {
//         this.startActive = 0
//       }
//     }
//   }

//   private freeParticles() {
//     while (this.startRetired !== this.startActive) {
//       this.vertices.seek(this.startRetired * 4)
//       const age = this.frame - this.vertices.getTime()
//       if (age < 3) {
//         // abort if particle is not older than 3 frames
//         return
//       }
//       // shift retired pointer
//       this.startRetired++
//       // wrap around
//       if (this.startRetired >= this.particleCount) {
//         this.startRetired = 0
//       }
//     }
//   }

//   private lerp(a: number, b: number, t: number): number {
//     return a * (1 - t) + b * t
//   }
// }

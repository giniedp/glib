// import { Color, createEffectOptionsSync, Device, Material, Texture } from '@gglib/graphics'
// import { Mat4, Vec2, Vec3 } from '@gglib/math'
// import { PARTICLE_PROGRAM } from './particle.program'

// export type ParticleEffectParameters = {
//   readonly view: Mat4
//   readonly projection: Mat4
//   readonly viewportScale: Vec2
//   currentTime: number
//   texture: Texture
//   duration: number
//   durationRandomness: number
//   readonly gravity: Vec3
//   endVelocity: number
//   minColor: number
//   maxColor: number
//   readonly rotateSpeed: Vec2
//   readonly startSize: Vec2
//   readonly endSize: Vec2
// }

// export class ParticleEffect extends Material<ParticleEffectParameters> {
//   constructor(device: Device) {
//     super(device, {
//       effect: createEffectOptionsSync(PARTICLE_PROGRAM),
//       parameters: {
//         view: Mat4.createIdentity(),
//         projection: Mat4.createIdentity(),
//         viewportScale: Vec2.createOne(),
//         currentTime: 0,
//         texture: null,
//         duration: 0,
//         durationRandomness: 0,
//         gravity: Vec3.createZero(),
//         endVelocity: 0,
//         minColor: Color.packToRGBA(Color.White),
//         maxColor: Color.packToRGBA(Color.White),
//         rotateSpeed: Vec2.createZero(),
//         startSize: Vec2.createZero(),
//         endSize: Vec2.createZero(),
//       },
//     })
//   }
// }

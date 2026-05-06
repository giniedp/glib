// import { BoundingBox, BoundingSphere } from '@gglib/math'
// import { Color } from '../../Color'
// import { Device } from '../../Device'
// import { PROGRAM_LINES } from '../../programs'
// import { Mesh } from '../Mesh'
// import { boxLinesGeometry } from './buildCube'
// import { BuildPlaneLinesOptions, planeLinesGeometry } from './buildPlane'
// import { sphereLinesGeometry } from './buildSphere'

// export function boxLinesMesh(device: Device, box: BoundingBox, color?: Color): Mesh {
//   return new Mesh(device, {
//     name: 'box-lines-mesh',
//     parts: [
//       boxLinesGeometry(device, {
//         box: box,
//         color: color,
//       }),
//     ],
//     materials: [
//       {
//         program: PROGRAM_LINES,
//         parameters: {},
//       },
//     ],
//   })
// }

// export function sphereLinesMesh(device: Device, sphere: BoundingSphere, color?: Color): Mesh {
//   return new Mesh(device, {
//     name: 'box-lines-mesh',
//     parts: [
//       sphereLinesGeometry(device, {
//         radius: sphere.radius,
//         center: sphere.center,
//       }),
//     ],
//     materials: [
//       {
//         program: PROGRAM_LINES,
//         parameters: {},
//       },
//     ],
//   })
// }

// export function planeLinesMesh(device: Device, options?: BuildPlaneLinesOptions): Mesh {
//   return new Mesh(device, {
//     name: 'plane-lines-mesh',
//     parts: [planeLinesGeometry(device, options)],
//     materials: [
//       {
//         program: PROGRAM_LINES,
//         parameters: {},
//       },
//     ],
//   })
// }

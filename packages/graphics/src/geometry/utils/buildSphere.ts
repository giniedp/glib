import { IVec3, Mat4 } from '@gglib/math'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { beginGeometry, GeometryBuilder } from '../GeometryBuilder'
import { buildParametricLines, buildParametricSurface } from './buildParametricSurface'

export const BuildSphereDefaults = {
  radius: 0.5,
  tesselation: 16,
}

/**
 * Options for the {@link buildSphere} function
 *
 * @public
 */
export interface BuildSphereOptions {
  /**
   * The sphere center offset
   */
  center?: IVec3
  /**
   * The sphere radius
   */
  radius?: number
  /**
   * The tesselation
   */
  tesselation?: number
}

export function sphereGeometry(device: Device, options?: BuildSphereOptions): Geometry {
  return beginGeometry().append(buildSphere, options)
    .calculateNormalsAndTangents()
    .endGeometry(device, {
    name: 'sphere',
  })
}

/**
 * Builds a sphere shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildSphere(builder: GeometryBuilder, options: BuildSphereOptions = {}) {
  const r = options?.radius ?? BuildSphereDefaults.radius
  const t = options?.tesselation ?? BuildSphereDefaults.tesselation
  let transformId: number = null
  if (options?.center) {
    transformId = builder.beginTransform(Mat4.createTranslation(options.center))
  }
  buildParametricSurface(builder, {
    position: (phi: number, theta: number) => {
      return {
        x: r * Math.sin(theta) * Math.sin(phi),
        y: r * Math.cos(theta),
        z: r * Math.sin(theta) * Math.cos(phi),
      }
    },
    normal: (phi: number, theta: number) => {
      return {
        x: Math.sin(theta) * Math.sin(phi),
        y: Math.cos(theta),
        z: Math.sin(theta) * Math.cos(phi),
      }
    },
    uSteps: t * 2,
    vSteps: t,
    uStart: 0,
    uEnd: Math.PI * 2,
    vStart: 0,
    vEnd: Math.PI,
  })
  if (transformId != null) {
    builder.endTransform(transformId)
  }
}

export function sphereLinesGeometry(device: Device, options?: BuildSphereOptions): Geometry {
  return beginGeometry({
    layout: [['position', 'color']],
  })
    .append(buildSphere, options)
    .endGeometry(device, {
      name: 'sphere',
      primitiveType: 'LineList',
    })
}

/**
 * Builds a sphere shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildSphereLines(builder: GeometryBuilder, options: BuildSphereOptions = {}) {
  const r = options?.radius ?? BuildSphereDefaults.radius
  const t = options?.tesselation ?? BuildSphereDefaults.tesselation
  let transformId: number = null
  if (options?.center) {
    transformId = builder.beginTransform(Mat4.createTranslation(options.center))
  }
  buildParametricLines(builder, {
    position: (phi: number, theta: number) => {
      return {
        x: r * Math.sin(theta) * Math.sin(phi),
        y: r * Math.cos(theta),
        z: r * Math.sin(theta) * Math.cos(phi),
      }
    },
    normal: (phi: number, theta: number) => {
      return {
        x: Math.sin(theta) * Math.sin(phi),
        y: Math.cos(theta),
        z: Math.sin(theta) * Math.cos(phi),
      }
    },
    uSteps: t * 2,
    vSteps: t,
    uStart: 0,
    uEnd: Math.PI * 2,
    vStart: 0,
    vEnd: Math.PI,
  })
  if (transformId != null) {
    builder.endTransform(transformId)
  }
}

import { Mat4 } from '@gglib/math'
import { Color } from '../../Color'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { beginGeometry, GeometryBuilder, GeometryBuilderOptions } from '../GeometryBuilder'
import { buildParametricLines, buildParametricSurface } from './buildParametricSurface'

/**
 * Options for the {@link buildPlane} function
 *
 * @public
 */
export interface BuildPlaneOptions {
  layout?: GeometryBuilderOptions['layout']

  /**
   * The uniform size (width, height) of the plane
   * @remarks
   * defaults to 1
   */
  size?: number
  /**
   * The tesselation factor
   * @remarks
   * defaults to 1
   */
  tesselation?: number
  transform?: Mat4
}

export function planeGeometry(device: Device, options?: BuildPlaneOptions): Geometry {
  return beginGeometry({
    layout: options?.layout,
  })
    .pushTransform(options?.transform ?? Mat4.createIdentity())
    .append(buildPlane, options)
    .popTransform()
    .calculateBoundings()
    .endGeometry(device, {
      name: 'plane',
    })
}

/**
 * Builds a plane shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildPlane(builder: GeometryBuilder, options: BuildPlaneOptions = {}) {
  const size = options?.size ?? 1
  buildParametricSurface(builder, {
    position: (u: number, v: number) => {
      return {
        x: (u - 0.5) * size,
        y: 0,
        z: (v - 0.5) * size,
      }
    },
    normal: (u: number, v: number) => {
      return {
        x: 0,
        y: 1,
        z: 0,
      }
    },
    uSteps: options?.tesselation ?? 1,
    vSteps: options?.tesselation ?? 1,
  })
}

/**
 * Options for the {@link buildCubeLines} function
 *
 * @public
 */
export interface BuildPlaneLinesOptions {
  /**
   * The uniform size (width, height) of the plane
   * @remarks
   * defaults to 1
   */
  size?: number

  /**
   * The tesselation factor
   * @remarks
   * defaults to 1
   */
  tesselation?: number

  /**
   * The lines color
   */
  color?: Color
}

export function planeLinesGeometry(
  device: Device,
  options?: BuildPlaneLinesOptions & GeometryBuilderOptions,
): Geometry {
  return beginGeometry({
    layout: options?.layout ?? [['position', 'color']],
  })
    .append(buildPlaneLines, options)
    .endGeometry(device, {
      name: 'plane-lines',
      primitiveType: 'LineList',
    })
}

/**
 * Builds a cube lines shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildPlaneLines(builder: GeometryBuilder, options?: BuildPlaneLinesOptions) {
  const size = options?.size ?? 1
  const color = options?.color ?? Color.White
  buildParametricLines(builder, {
    position: (u: number, v: number) => {
      return {
        x: (u - 0.5) * size,
        y: 0,
        z: (v - 0.5) * size,
      }
    },
    normal: (u: number, v: number) => {
      return {
        x: 0,
        y: 1,
        z: 0,
      }
    },
    color: () => Color.packToRGBA(color),
    uSteps: options?.tesselation ?? 1,
    vSteps: options?.tesselation ?? 1,
  })
}

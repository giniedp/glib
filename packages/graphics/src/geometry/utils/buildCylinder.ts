import { IVec3 } from '@gglib/math'
import type { Device } from '../../Device'
import type { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, type GeometryBuilder } from '../GeometryBuilder'
import { buildDisc } from './buildDisc'
import { buildParametricLines, buildParametricSurface, resolveLines } from './buildParametricSurface'

export const BuildCylinderDefaults = {
  height: 1,
  radius: 1,
  radialSegments: 32,
  heightSegments: 1,
  angleStart: 0,
  angleSweep: Math.PI * 2,
  closeTop: false,
  closeBottom: false,
}

/**
 * Options for the {@link buildCylinder} function
 *
 * @public
 */
export interface BuildCylinderOptions {
  /**
   * Height of the cylinder along the Y axis.
   * @default 1
   */
  height?: number

  /**
   * Offset applied to all vertices.
   */
  offset?: IVec3

  /**
   * Radius applied to both top and bottom.
   * Overridden per-cap by `topRadius` and `bottomRadius`.
   * @default 1
   */
  radius?: number

  /**
   * Radius of the top cap. Overrides `radius` when set.
   * Set to `0` for a cone.
   * @default radius
   */
  topRadius?: number

  /**
   * Radius of the bottom cap. Overrides `radius` when set.
   * Set to `0` for an inverted cone.
   * @default radius
   */
  bottomRadius?: number

  /**
   * Number of subdivisions along the height.
   * @default 1
   */
  heightSegments?: number

  /**
   * Number of subdivisions around the circumference.
   * @default 32
   */
  radialSegments?: number

  /**
   * Start angle in radians.
   * @default 0
   */
  angleStart?: number

  /**
   * End angle in radians.
   * @default Math.PI * 2
   */
  angleSweep?: number

  /**
   * When `true`, closes the top of the cylinder with a disc.
   * Has no effect when `topRadius` is `0`.
   * @default false
   */
  closeTop?: boolean

  /**
   * When `true`, closes the bottom of the cylinder with a disc.
   * Has no effect when `bottomRadius` is `0`.
   * @default false
   */
  closeBottom?: boolean

  /**
   * Inverts winding order and normals, creating a box facing inwards.
   * @default false
   */
  invert?: boolean

  /**
   * When `true`, builds a wireframe line mesh instead of a solid surface.
   * @default false
   */
  lines?: boolean
}

export function cylinderGeometry(device: Device, options?: BuildCylinderOptions & BuildGeometryOptions): Geometry {
  return buildGeometry(device, buildCylinder, {
    name: 'Cylinder',
    ...(resolveLines(options) || {}),
  })
}

/**
 * Builds a cylinder shape into the {@link GeometryBuilder}
 *
 * @public
 */
export function buildCylinder(builder: GeometryBuilder, options?: BuildCylinderOptions) {
  const radius = options?.radius ?? BuildCylinderDefaults.radius
  const topRadius = options?.topRadius ?? radius
  const bottomRadius = options?.bottomRadius ?? radius
  const height = options?.height ?? BuildCylinderDefaults.height
  const ox = options?.offset?.x ?? 0
  const oy = options?.offset?.y ?? 0
  const oz = options?.offset?.z ?? 0
  const radialSegments = options?.radialSegments ?? BuildCylinderDefaults.radialSegments
  const heightSegments = options?.heightSegments ?? BuildCylinderDefaults.heightSegments
  const startAngle = options?.angleStart ?? BuildCylinderDefaults.angleStart
  const angleSweep = options?.angleSweep ?? BuildCylinderDefaults.angleSweep
  const endAngle = startAngle + angleSweep
  const invert = !!options?.invert
  const lines = !!options?.lines

  const surface = lines ? buildParametricLines : buildParametricSurface

  surface(builder, {
    position: (u, v) => {
      const r = bottomRadius * (1 - v) + topRadius * v
      return {
        x: ox + r * Math.cos(u),
        y: oy + v * height - height * 0.5,
        z: oz + r * Math.sin(u),
      }
    },
    uStart: startAngle,
    uEnd: endAngle,
    uSegments: radialSegments,
    vSegments: heightSegments,
    invert,
  })

  if (options?.closeTop && topRadius > 0) {
    buildDisc(builder, {
      radius: topRadius,
      offset: { x: ox, y: oy + height * 0.5, z: oz },
      radialSegments,
      angleStart: startAngle,
      angleSweep: angleSweep,
      invert,
      lines,
    })
  }

  if (options?.closeBottom && bottomRadius > 0) {
    buildDisc(builder, {
      radius: bottomRadius,
      offset: { x: ox, y: oy - height * 0.5, z: oz },
      radialSegments,
      angleStart: startAngle,
      angleSweep: angleSweep,
      invert: !invert,
      lines,
    })
  }
}

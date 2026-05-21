import { Mat4 } from '@gglib/math'
import { Color } from '../../Color'
import { Device } from '../../Device'
import { Geometry } from '../Geometry'
import { buildGeometry, BuildGeometryOptions, GeometryBuilder } from '../GeometryBuilder'
import { buildCylinder } from './buildCylinder'

const SHAFT_RADIUS = 0.028
const SHAFT_LENGTH = 0.78
const CONE_RADIUS = 0.072
const CONE_LENGTH = 0.22
const RADIAL_SEGMENTS = 12

function buildAxis(builder: GeometryBuilder, direction: 'x' | 'y' | 'z') {
  // Rotation matrices to orient the Y-up cylinder toward each axis
  const transforms: Record<string, Mat4 | null> = {
    y: null,
    x: Mat4.createRotationZ(-Math.PI / 2),
    z: Mat4.createRotationX(Math.PI / 2),
  }
  const colors = {
    x: Color.Red,
    y: Color.Lime,
    z: Color.Blue,
  }

  const transform = transforms[direction]
  if (transform) {
    builder.pushTransform(transform)
  }

  const color = builder.defaults.color
  builder.defaults.color = [Color.packToRGBA(colors[direction])]

  // shaft — cylinder centered at origin, shift up by half its length
  builder.append(buildCylinder, {
    radius: SHAFT_RADIUS,
    height: SHAFT_LENGTH,
    radialSegments: RADIAL_SEGMENTS,
    heightSegments: 1,
    offset: { x: 0, y: SHAFT_LENGTH / 2, z: 0 },
    closeBottom: true,
  })

  // cone — sits on top of the shaft
  builder.append(buildCylinder, {
    topRadius: 0,
    bottomRadius: CONE_RADIUS,
    height: CONE_LENGTH,
    radialSegments: RADIAL_SEGMENTS,
    heightSegments: 1,
    offset: { x: 0, y: SHAFT_LENGTH + CONE_LENGTH / 2, z: 0 },
    closeBottom: true,
  })
  builder.popTransform()
  builder.defaults.color = color
}

export function buildGizmo(builder: GeometryBuilder) {
  buildAxis(builder, 'x')
  buildAxis(builder, 'y')
  buildAxis(builder, 'z')
}

export function gizmoGeometry(device: Device, options: BuildGeometryOptions = {}): Geometry {
  return buildGeometry(device, buildGizmo, options)
}

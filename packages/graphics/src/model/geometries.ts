import type { Device } from '../Device'
import {
  buildCap,
  BuildCapOptions,
  buildCone,
  BuildConeOptions,
  buildCube,
  BuildCubeOptions,
  buildCylinder,
  BuildCylinderOptions,
  buildPlane,
  BuildPlaneOptions,
  buildSphere,
  BuildSphereOptions,
  sphereBuilder,
} from '../formulas'
import type { Geometry } from './Geometry'

import { GeometryBuilder } from './GeometryBuilder'

export function sphereGeometry(device: Device, options: BuildSphereOptions): Geometry {
  return GeometryBuilder.begin().append(buildSphere, options).endGeometry(device, {
    name: 'sphere',
  })
}

export function cubeGeometry(device: Device, options: BuildCubeOptions): Geometry {
  return GeometryBuilder.begin().append(buildCube, options).endGeometry(device, {
    name: 'cube',
  })
}

export function planeGeometry(device: Device, options: BuildPlaneOptions): Geometry {
  return GeometryBuilder.begin().append(buildPlane, options).endGeometry(device, {
    name: 'plane',
  })
}

export function capGeometry(device: Device, options: BuildCapOptions): Geometry {
  return GeometryBuilder.begin().append(buildCap, options).endGeometry(device, {
    name: 'cap',
  })
}

export function coneGeometry(device: Device, options: BuildConeOptions): Geometry {
  return GeometryBuilder.begin().append(buildCone, options).endGeometry(device, {
    name: 'cone',
  })
}

export function cylinderGeometry(device: Device, options: BuildCylinderOptions): Geometry {
  return GeometryBuilder.begin().append(buildCylinder, options).endGeometry(device, {
    name: 'cylinder',
  })
}

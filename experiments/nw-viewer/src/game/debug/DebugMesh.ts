import {
  boxGeometry,
  Buffer,
  bufferField,
  bufferLayout,
  BufferRecorder,
  cylinderGeometry,
  Device,
  discGeometry,
  Mesh,
  planeGeometry,
  sphereGeometry,
} from '@gglib/graphics'
import { Mat4, type IVec3, type IVec4 } from '@gglib/math'
import { ShapeMaterial } from '../../material/ShapeMaterial'
import type { DebugShapeType } from './DebugShapeComponent'

export const instanceLayout = bufferLayout([
  { name: 'transform', type: 'mat4x4f' },
  { name: 'color', type: 'vec4f' },
])

export class DebugMesh extends Mesh {
  private writer: BufferRecorder
  private buffer: Buffer

  public get material() {
    return this.materials[0] as ShapeMaterial
  }

  public constructor(device: Device, type: DebugShapeType, solid: boolean) {
    super(device, {
      geometries: [createShapeGeometry(device, type, solid)],
      materials: [new ShapeMaterial(device)],
      parts: [{ geometryIndex: 0, materialIndex: 0 }],
    })
    this.writer = new BufferRecorder({
      autosize: true,
      capacity: 1024,
      recordByteSize: instanceLayout.byteSize,
    })
    this.buffer = device.createBuffer({
      type: 'StorageBuffer',
      size: this.writer.capacity * this.writer.strideInBytes,
      readWrite: true,
    })
  }

  public getInstanceCount() {
    return this.writer.count
  }

  public resetInstanceCount() {
    this.writer.setCount(0)
  }

  public startInstance(index: number) {
    this.writer.seek(index)
  }

  public writeTransform(value: Mat4) {
    this.writer.writeField(instanceLayout.schema.transform, value)
  }

  public writeColor(value: IVec4 | IVec3) {
    this.writer.writeField(instanceLayout.schema.color, value)
  }

  public commitInstanceData() {
    this.writer.upload(this.buffer)
    this.material.effect.program.mustGet('instances').setBuffer(this.buffer)
    this.geometries[0].instanceCount = this.writer.count
  }
}

export function createShapeGeometry(device: Device, type: DebugShapeType, solid: boolean) {
  switch (type) {
    case 'sphere':
    case 'bounds-sphere': {
      return sphereGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
        radius: 1,
        stacks: 4,
        slices: 8,
        lines: !solid,
      })
    }
    case 'box':
    case 'bounds-box': {
      return boxGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
        size: 1,
        lines: !solid,
      })
    }
    case 'plane': {
      return planeGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
        size: 1,
        depthSegments: 2,
        widthSegments: 2,
        lines: !solid,
      })
    }
    case 'disc': {
      return discGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
        radius: 1,
        lines: !solid,
      })
    }
    case 'cylinder': {
      return cylinderGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
        height: 1,
        radius: 1,
        lines: !solid,
      })
    }
    case 'cone': {
      return cylinderGeometry(device, {
        vertexTransform: Mat4.createRotationX(Math.PI / 2), // rotate to z up
        height: 1,
        radius: 1,
        topRadius: 0,
        lines: !solid,
      })
    }
    default: {
      throw new Error(`Unsupported shape type: ${type}`)
    }
  }
}

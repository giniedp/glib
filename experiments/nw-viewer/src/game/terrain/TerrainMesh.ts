import { bufferField, bufferLayout, Buffer, BufferRecorder, Device, Mesh, patchGeometry } from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3, type IVec4 } from '@gglib/math'
import { TerrainPatchMaterial, WaterPatchMaterial } from '../../material'

export interface TerrainMeshOptions {
  size: number
}

const instanceLayout = bufferLayout([
  bufferField('transform', 'mat4x4f'),
  bufferField('params1', 'vec4f'),
  bufferField('params2', 'vec4f'),
  bufferField('params3', 'vec4f'),
  bufferField('colorUvTransform', 'vec4f'),
  bufferField('colorUvTransformCoarse', 'vec4f'),
  bufferField('heightUvTransform', 'vec4f'),
  bufferField('heightUvTransformCoarse', 'vec4f'),
])

export class TerrainMesh extends Mesh {
  public readonly writer: BufferRecorder
  public readonly buffer: Buffer

  public get TerrainMaterial() {
    return this.materials[0] as TerrainPatchMaterial
  }

  public get WaterMaterial() {
    return this.materials[1] as WaterPatchMaterial
  }

  public constructor(device: Device, options: TerrainMeshOptions) {
    super(device, {
      geometries: [createQuadGeometry(device, { size: options.size })],
      materials: [new TerrainPatchMaterial(device), new WaterPatchMaterial(device)],
      parts: [
        { geometryIndex: 0, materialIndex: 0 },
        { geometryIndex: 0, materialIndex: 1 },
      ],
    })
    this.writer = new BufferRecorder({
      autosize: true,
      capacity: 1024,
      recordByteSize: instanceLayout.byteSize,
    })
    this.buffer = device.createBuffer({
      type: 'StorageBuffer',
      size: this.writer.capacity * instanceLayout.byteSize,
      readWrite: true,
    })
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

  public writeParams1(value: IVec4) {
    this.writer.writeField(instanceLayout.schema.params1, value)
  }

  public writeParams2(value: IVec4) {
    this.writer.writeField(instanceLayout.schema.params2, value)
  }

  public writeParams3(value: IVec4) {
    this.writer.writeField(instanceLayout.schema.params3, value)
  }

  public writeColorUvTransform(value: IVec4) {
    this.writer.writeField(instanceLayout.schema.colorUvTransform, value)
  }

  public writeColorUvTransformCoarse(value: IVec4) {
    this.writer.writeField(instanceLayout.schema.colorUvTransformCoarse, value)
  }

  public writeHeightUvTransform(value: IVec4) {
    this.writer.writeField(instanceLayout.schema.heightUvTransform, value)
  }

  public writeHeightUvTransformCoarse(value: IVec4) {
    this.writer.writeField(instanceLayout.schema.heightUvTransformCoarse, value)
  }

  public commitInstanceData() {
    this.writer.upload(this.buffer)
    this.TerrainMaterial.effect.program.mustGet('instances').setBuffer(this.buffer)
    this.WaterMaterial.effect.program.mustGet('instances').setBuffer(this.buffer)
    for (const geometry of this.geometries) {
      geometry.instanceCount = this.writer.count
    }
  }
}

interface QuadGeomOptions {
  size: number
  offset?: number
  lines?: boolean
}

function createQuadGeometry(device: Device, { size, offset = 0, lines = false }: QuadGeomOptions) {
  return patchGeometry(device, {
    vertexTransform: Mat4.createAxisAngle(Vec3.UnitX, -90 * DEGREE_TO_RAD),
    width: size,
    depth: size,
    widthSegments: size,
    depthSegments: size,
    offset: {
      x: size / 2,
      y: offset || 0,
      z: size / 2,
    },
    lines,
  })
}

import { bufferLayout, BufferWriter, Device, Mesh, patchGeometry } from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3, type IVec4 } from '@gglib/math'
import { TerrainPatchMaterial, WaterPatchMaterial } from '../../material'

export interface TerrainMeshOptions {
  size: number
}

const instanceLayout = bufferLayout([
  { name: 'transform', type: 'mat4' },
  { name: 'params1', type: 'vec4' },
  { name: 'params2', type: 'vec4' },
  { name: 'params3', type: 'vec4' },
  { name: 'colorUvTransform', type: 'vec4' },
  { name: 'colorUvTransformCoarse', type: 'vec4' },
  { name: 'heightUvTransform', type: 'vec4' },
  { name: 'heightUvTransformCoarse', type: 'vec4' },
])

export class TerrainMesh extends Mesh {
  public readonly writer: BufferWriter

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
    this.writer = new BufferWriter({
      autosize: true,
      capacity: 1024,
      recordByteSize: instanceLayout.recordByteSize,
      buffer: device.createBuffer({
        type: 'StorageBuffer',
        size: 1024 * instanceLayout.recordByteSize,
        readWrite: true,
      }),
    })
  }

  public resetInstanceCount() {
    this.writer.setCount(0)
  }

  public startInstance(index: number) {
    this.writer.seek(index)
  }

  public writeTransform(value: Mat4) {
    this.writer.writeField(instanceLayout.fields.transform, value)
  }

  public writeParams1(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.params1, value)
  }

  public writeParams2(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.params2, value)
  }

  public writeParams3(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.params3, value)
  }

  public writeColorUvTransform(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.colorUvTransform, value)
  }

  public writeColorUvTransformCoarse(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.colorUvTransformCoarse, value)
  }

  public writeHeightUvTransform(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.heightUvTransform, value)
  }

  public writeHeightUvTransformCoarse(value: IVec4) {
    this.writer.writeField(instanceLayout.fields.heightUvTransformCoarse, value)
  }

  public commitInstanceData() {
    this.writer.commit()
    this.TerrainMaterial.effect.program.mustGet('instances').setBuffer(this.writer.buffer)
    this.WaterMaterial.effect.program.mustGet('instances').setBuffer(this.writer.buffer)
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

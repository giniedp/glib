import { BufferOptions } from './resources'
import { ModelBuilderChannel } from './ModelBuilderChannel'
import { VertexAttribute, VertexLayout } from './VertexLayout'
import { BufferType, PrimitiveType, FrontFace } from './enums'
import { Log } from '@gglib/utils'
import { calculateNormals, calculateTangents } from './formulas'

export class ModelMeshPartUtil {

  private channels = new Map<string, ModelBuilderChannel>()
  private get indices(): ReadonlyArray<number> {
    return this.iBuffer.data as any
  }

  public constructor(
    public readonly iBuffer: BufferOptions,
    public readonly vBuffer: BufferOptions[],
    public readonly primitiveType: PrimitiveType,
  ) {

    for (const buffer of vBuffer) {
      Object.keys(buffer.layout).forEach((name) => {
        this.channels.set(name, new ModelBuilderChannel(buffer, name))
      })
    }
  }

  public hasChannel(semantic: string) {
    return this.channels.has(semantic)
  }

  public getChannel(semantic: string) {
    return this.channels.get(semantic)
  }

  public chreateChannel(semantic: string, attribute: VertexAttribute, defaults?: number[]) {

    if (this.hasChannel(semantic)) {
      throw new Error(`channel '${semantic}' already exists`)
    }
    if (!attribute) {
      throw new Error(`attribute parameter is missing`)
    }

    const data = []
    const vCount = this.getVertexCount()
    for (let i = 0; i < vCount; i++) {
      if (defaults?.length === attribute.elements) {
        data.push(...defaults[semantic])
      } else {
        for (let j = 0; j < attribute.elements; j++) {
          data.push(0)
        }
      }
    }
    this.vBuffer.push({
      layout: {
        [semantic]: {
          ...attribute,
          offset: 0,
        },
      },
      type: BufferType.VertexBuffer,
      dataType: attribute.type,
      data: data,
    })
  }

  public getVertexCount() {
    const l = (this.iBuffer.data as any).length
    switch (this.primitiveType) {
      case PrimitiveType.TriangleList:
        return l / 3
      case PrimitiveType.LineList:
        return l / 2
      case PrimitiveType.PointList:
        return l
      case PrimitiveType.LineStrip:
      case PrimitiveType.TriangleFan:
        return l - 1
      case PrimitiveType.TriangleStrip:
        return l - 2
      case PrimitiveType.TriangleFan:
        return l - 2
    }
  }
  /**
   * In current state it reads through the vertex buffer and eliminates redundant vertices
   *
   * @remarks
   * This does not operate on already closed mesh parts. When building a model with multiple
   * meshes or parts, this must be called each time before closing a part.
   */
  public mergeDublicates(): this {
    // vertex index cache
    const hashMap = new Map<string, number>()
    // the new vertex buffer
    const vBuffer = this.vBuffer.map((buf) => {
      return {
        ...buf,
        data: [],
      }
    })
    // accessor to new vertex buffer
    const vChannels = ModelBuilderChannel.fromVertexBuffer(vBuffer)
    // new vertex count
    let vCount = 0
    // new indices
    let newIndices: any = []

    const vertex: number[] = []
    const channelNames = Object.keys(this.channels)

    for (let index of this.indices) {
      // build vertex object
      vertex.length = 0
      for (const name of channelNames) {
        const channel = this.channels[name]
        const elements = channel.elements
        for (let i = 0; i < elements; i++) {
          vertex.push(channel.read(index, i))
        }
      }
      // build vertex hash value
      const hash = vertex.join('|')
      if (!hashMap.has(hash)) {
        // write back new vertex
        for (const name of channelNames) {
          const channel = vChannels[name]
          const elements = channel.elements
          for (let i = 0; i < elements; i++) {
            channel.write(vCount, i, vertex.shift())
          }
        }
        // remember vertex position
        hashMap.set(hash, vCount)
        vCount += 1
      }
      newIndices.push(hashMap.get(hash))
    }

    const oldVCount = this.getVertexCount()
    if (oldVCount !== vCount) {
      Log.d(`[ModelBuilder] Mesh size reduced from ${oldVCount} to ${vCount} vertices.`)
      vBuffer.forEach((buf, i) => {
        this.vBuffer[i].data = buf.data
      })
      this.iBuffer.data = newIndices
    }
    return this
  }

  public calculateBoundings() {
    // TODO:
    // this.bBox.init(0, 0, 0, 0, 0, 0)

    // this.getChannel('position').forEach((item, i) => {
    //   if (i === 0) {
    //     this.bBox.min.x = item[0]
    //     this.bBox.min.y = item[1]
    //     this.bBox.min.z = item[2]

    //     this.bBox.max.x = item[0]
    //     this.bBox.max.y = item[1]
    //     this.bBox.max.z = item[2]
    //   } else {
    //     this.bBox.mergePoint({ x: item[0], y: item[1], z: item[2] })
    //   }
    // })
    // this.bSphere.initFromBox(this.bBox)
    return this
  }

  public calculateNormals(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    const semantic = 'normal'
    if (!this.hasChannel(semantic) && create) {
      this.chreateChannel(semantic, VertexLayout.preset[semantic], [0, 1, 0])
    }
    if (this.hasChannel(semantic)) {
      // TODO
      // calculateNormals(this.indices, this.channels, this.vCount, frontFace)
    }
    return this
  }

  public calculateTangents(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    const semantic1 = 'tangent'
    if (!this.hasChannel(semantic1) && create) {
      this.chreateChannel(semantic1, VertexLayout.preset[semantic1], [1, 0, 0])
    }
    const semantic2 = 'bitangent'
    if (!this.hasChannel(semantic2) && create) {
      this.chreateChannel(semantic2, VertexLayout.preset[semantic2], [0, 0, 1])
    }
    if (this.hasChannel(semantic1) && this.hasChannel(semantic2)) {
      // TODO
      // calculateTangents(this.indices, this.channels, this.vCount, frontFace)
    }
    return this
  }

  public calculateNormalsAndTangents(create: boolean = false, frontFace: FrontFace = FrontFace.CounterClockWise): this {
    this.calculateNormals(create, frontFace)
    this.calculateTangents(create, frontFace)
    return this
  }
}

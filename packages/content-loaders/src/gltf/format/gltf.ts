import { BinaryReader } from '@gglib/utils'
import { GLTFDocument } from './Document'

export class GLTF {
  public static readonly Document = Symbol('gltf Document')

  public static parse(content: string): GLTFDocument {
    return JSON.parse(content) as GLTFDocument
  }

  public static async parseBinary(content: ArrayBuffer): Promise<GLTFDocument> {
    const reader = new BinaryReader(content)

    const magic = reader.readString(4)
    const version = reader.readUInt()
    const length = reader.readUInt()
    if (magic !== 'glTF') {
      throw new Error('[glTF] invalid header')
    }
    if (version !== 2) {
      throw new Error(`[glTF] unsupported version. was ${version} supported is ${2}`)
    }
    if (length !== content.byteLength) {
      console.warn(`length expected to be ${content.byteLength} but was ${length}`)
    }

    const chunks = []
    while (reader.canRead) {
      const chunkLength = reader.readUInt()
      const chunkType = reader.readUInt()
      chunks.push({
        type: chunkType === 0x4E4F534A ? 'JSON' : 'BIN',
        data: reader.slice(chunkLength),
      })
    }

    const dataChunks = chunks.filter((it) => it.type === 'BIN').map((it) => it.data)
    const jsonChunk = chunks.find((it) => it.type === 'JSON')

    const blob = new Blob([jsonChunk.data])
    const fReader = new FileReader()
    return new Promise<GLTFDocument>((resolve, reject) => {
      fReader.onload = () => resolve({
        chunks: dataChunks,
        ...JSON.parse(fReader.result as string) as GLTFDocument,
      })
      fReader.onabort = reject
      fReader.readAsText(blob)
    })
  }

}

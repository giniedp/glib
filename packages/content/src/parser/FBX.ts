// https://code.blender.org/2013/08/fbx-binary-file-format-specification/

import { Log } from '@gglib/core'
import { BinaryReader } from './../BinaryReader'

export interface FBXNode {
  [k: string]: any
  type: string,
  properties?: FBXProperty[]
}

export type FBXProperty = number | number[]

function parseArray(reader: BinaryReader, read: (data: BinaryReader) => void) {
  const result = []
  const count = reader.readUInt()
  const encoding = reader.readUInt()

  let subReader = reader
  if (encoding !== 0) {
    throw new Error(`FBX deflate is not supported yet`)
  }
  for (let i = 0; i < count; i++) {
    result.push(read(subReader))
  }
  return result
}

function parseProperty(reader: BinaryReader): FBXProperty {
  const type = String.fromCharCode(reader.readByte())
  let value: any
  // Y: 2 byte signed Integer
  // C: 1 bit boolean (1: true, 0: false) encoded as the LSB of a 1 Byte value.
  // I: 4 byte signed Integer
  // F: 4 byte single-precision IEEE 754 number
  // D: 8 byte double-precision IEEE 754 number
  // L: 8 byte signed Integer
  // f: Array of 4 byte single-precision IEEE 754 number
  // d: Array of 8 byte double-precision IEEE 754 number
  // l: Array of 8 byte signed Integer
  // i: Array of 4 byte signed Integer
  // b: Array of 1 byte Booleans (always 0 or 1)
  switch (type) {
    case 'Y':
      value = reader.readShort()
      break
    case 'C':
      value = reader.readByte() & 1 // tslint:disable-line
      break
    case 'F':
      value = reader.readFloat()
      break
    case 'D':
      value = reader.readDouble()
      break
    case 'I':
      value = reader.readInt()
      break
    case 'L':
      value = reader.readLong()
      break
    case 'b':
      value = parseArray(reader, (r) => r.readByte() & 1) // tslint:disable-line
      break
    case 'f':
      value = parseArray(reader, (r) => r.readFloat())
      break
    case 'd':
      value = parseArray(reader, (r) => r.readDouble())
      break
    case 'i':
      value = parseArray(reader, (r) => r.readInt())
      break
    case 'l':
      value = parseArray(reader, (r) => r.readLong())
      break
    case 'R':
      value = reader.readByteArray(reader.readUInt())
      break
    case 'S':
      value = reader.readString(reader.readUInt())
      break
    default:
      throw new Error(`FBX Property type '${type}' is not supported'`)
  }
  return value
}

function parseProperties(reader: BinaryReader, count: number): FBXProperty[] {
  const properties: FBXProperty[] = []
  for (let i = 0; i < count; i++) {
    properties.push(parseProperty(reader))
  }
  return
}

function parseNode(reader: BinaryReader): FBXNode {
  const end = reader.readUInt()
  const propCount = reader.readUInt()
  const propLen = reader.readUInt()
  const nameLen = reader.readByte()

  if (end === 0 && propCount === 0 && propLen === 0 && nameLen === 0) {
    // 13 zero beytes indicate a NULL node
    return null
  }

  const name = reader.readString(nameLen)
  const properties = parseProperties(reader, propLen)
  const nodes = parseNodeList(reader, end)
  reader.seekAbsolute(end)

  return {
    type: name,
    properties: properties,
    children: nodes,
  }
}

function parseNodeList(reader: BinaryReader, end: number): FBXNode[] {
  const result: FBXNode[] = []
  while (reader.position < end) {
    const child = parseNode(reader)
    if (!child) {
      // FBX uses a null node as a delimiter for node lists
      break
    }
    result.push(child)
  }
  return result
}

export class FBX {
  public version: number
  public nodes: FBXNode[]
  constructor() {
    //
  }

  public static parse(data: any) {
    const reader = new BinaryReader(new Uint8Array(data))
    const magic = reader.readString(20)
    reader.seekAbsolute(23)
    const result = new FBX()
    result.version = reader.readUInt()
    result.nodes = parseNodeList(reader, reader.data.byteLength)
    Log.d(result)
  }
}

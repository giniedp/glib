import { BinaryReader } from '@gglib/utils'

// example byte buffer
// prettier-ignore
const bytes = new Uint8Array([
  0x50, 0x4e, 0x47, 0x21, // "PNG!"
  0x2a, 0x00,             // version = 42
  0x01,                   // flags = 1
  0x03, 0x00, 0x00, 0x00  // dataLength = 3
])

const reader = new BinaryReader(bytes.buffer)

const magic = reader.readString(4) // "PNG!"
const version = reader.readUShort() // 42
const flags = reader.readByte() // 1
const dataLength = reader.readUInt() // 3

console.log(magic, version, flags, dataLength)
console.log('bytes remaining:', reader.remaining) // 0

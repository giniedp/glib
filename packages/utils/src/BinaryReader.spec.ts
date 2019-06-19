// tslint:disable no-bitwise

import { BinaryReader } from '@gglib/utils'
describe('Glib.Core.BinaryReader', () => {
  let data
  let reader: BinaryReader
  beforeEach(() => {
    data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    reader = new BinaryReader(data.buffer)
  })

  it('readByte', () => {
    expect(reader.readByte()).toBe(1)
    expect(reader.readByte()).toBe(2)
    expect(reader.readByte()).toBe(3)
    expect(reader.readByte()).toBe(4)
  })

  it('readShort', () => {
    expect(reader.readShort()).toBe(1 | 2 << 8)
    expect(reader.readShort()).toBe(3 | 4 << 8)
  })

  it('readInt', () => {
    expect(reader.readInt()).toBe(1 | 2 << 8 | 3 << 16 | 4 << 24)
  })

  it('seekAbsolute', () => {
    reader.seekAbsolute(5)
    reader.seekAbsolute(5)
    expect(reader.readByte()).toBe(6)
  })

  it('seekRelative', () => {
    reader.seekRelative(2)
    reader.seekRelative(2)
    expect(reader.readByte()).toBe(5)
  })

  it('readBuffer', () => {
    let buffer = [0, 0, 0, 0]
    reader.readBuffer(buffer, 1, 2)
    expect(buffer).toEqual([0, 1, 2, 0])
  })
})

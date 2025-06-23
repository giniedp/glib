import { BinaryReader } from '@gglib/utils'

const MAGIC_RADIANCE = '#?RADIANCE'
const MAGIC_RGBE = '#?RGBE'

export interface HDRHeader {
  magic: string
  comments: string[]
  meta: Record<string, string>
  width: number
  height: number
}

export function readHDR(data: ArrayBuffer): {
  data: Float32Array
  width: number
  height: number
} {
  const reader = new BinaryReader(data)
  const header = readHeader(reader)
  const pixelData = readData(new Uint8Array(reader.data), reader.position, header.width, header.height)
  const hdrData = rgbeToFloat(pixelData)

  return {
    data: hdrData,
    width: header.width,
    height: header.height,
  }
}

function rgbeToFloat(buffer: Uint8Array): Float32Array {
  const pixelCount = buffer.byteLength / 4
  const result = new Float32Array(pixelCount * 4)

  let iOut = 0
  let iIn = 0
  for (let i = 0; i < pixelCount; i++) {
    iOut = i * 4
    iIn = i * 4

    const e = buffer[iIn + 3] - (128 + 8)
    const s = Math.pow(2, e)

    result[iOut + 0] = buffer[iIn + 0] * s
    result[iOut + 1] = buffer[iIn + 1] * s
    result[iOut + 2] = buffer[iIn + 2] * s
    result[iOut + 3] = 1.0
  }
  return result
}

function readLine(reader: BinaryReader): string {
  const NL = '\n'.charCodeAt(0)
  const chars: string[] = []
  while (reader.canRead) {
    const c = reader.readByte()
    if (c === NL) {
      break
    }
    chars.push(String.fromCharCode(c))
  }
  if (!reader.canRead) {
    throw new Error('Unexpected end of file while reading HDR header')
  }
  const line = chars.join('')
  // console.debug(`HDR: Read line: "${line}"`)
  return line
}

function readHeader(reader: BinaryReader): HDRHeader {
  const header: HDRHeader = {
    magic: '',
    comments: [],
    meta: {},
    width: 0,
    height: 0,
  }
  // first line always contains magic
  // either #?RADIANCE or #?RGBE
  const magic = readLine(reader)
  if (magic !== MAGIC_RADIANCE && magic !== MAGIC_RGBE) {
    throw new Error('Invalid HDR file magic: ' + magic)
  }
  header.magic = magic

  // multiple lines can contain comments or metadata
  // until a blank line is encountered
  while (reader.canRead) {
    const line = readLine(reader)
    // comments
    if (line.startsWith('#')) {
      header.comments.push(line.substring(1))
      continue
    }
    // end of header
    if (!line) {
      break
    }
    // metadata
    const index = line.indexOf('=')
    if (index > 0) {
      const key = line.substring(0, index)
      const value = line.substring(index + 1)
      header.meta[key] = value
    } else {
      console.warn(`Unexpected line in HDR header: ${line}`)
    }
  }

  // last line, after the blank line, contains resolution
  const size = readLine(reader)
  const match = size.match(/-Y (\d+) \+X (\d+)/)
  if (!match) {
    throw new Error('Invalid HDR file resolution line: ' + size)
  }
  header.height = parseInt(match[1], 10)
  header.width = parseInt(match[2], 10)
  return header
}

function readData(d8: Uint8Array, pos: number, width: number, height: number) {
  const pixels = new Uint8Array(width * height * 4)
  let ipos = 0
  // Read all scanlines
  for (let j = 0; j < height; j++) {
    const scanline = []

    let rgbe = d8.slice(pos, (pos += 4))
    const isNewRLE = rgbe[0] == 2 && rgbe[1] == 2 && rgbe[2] == ((width >> 8) & 0xff) && rgbe[3] == (width & 0xff)

    if (isNewRLE && width >= 8 && width < 32768) {
      for (let i = 0; i < 4; i++) {
        let ptr = i * width
        const ptr_end = (i + 1) * width
        let buf = undefined
        let count = undefined
        while (ptr < ptr_end) {
          buf = d8.slice(pos, (pos += 2))
          if (buf[0] > 128) {
            count = buf[0] - 128
            while (count-- > 0) scanline[ptr++] = buf[1]
          } else {
            count = buf[0] - 1
            scanline[ptr++] = buf[1]
            while (count-- > 0) scanline[ptr++] = d8[pos++]
          }
        }
      }

      for (let i = 0; i < width; i++) {
        pixels[ipos++] = scanline[i + 0 * width]
        pixels[ipos++] = scanline[i + 1 * width]
        pixels[ipos++] = scanline[i + 2 * width]
        pixels[ipos++] = scanline[i + 3 * width]
      }
    } else {
      pos -= 4

      for (let i = 0; i < width; i++) {
        rgbe = d8.slice(pos, (pos += 4))

        pixels[ipos++] = rgbe[0]
        pixels[ipos++] = rgbe[1]
        pixels[ipos++] = rgbe[2]
        pixels[ipos++] = rgbe[3]
      }
    }
  }
  return pixels
}

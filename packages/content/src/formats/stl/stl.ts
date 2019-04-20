import { BinaryReader, TextReader } from '@gglib/core'

export interface Solid {
  name: string
  facets: Facet[]
}

export interface Facet {
  normal: IVec3
  vertcies: IVec3[]
  attrCount: number
}

export interface IVec3 {
  x: number
  y: number
  z: number
}

export class STL {
  public header: string
  public solids: Solid[]

  public static parse(data: string | ArrayBuffer): STL  {
    if (typeof data === 'string') {
      return this.parseText(data)
    }
    const reader = new BinaryReader(data)
    const header = reader.readString(80)
    const numTriangles = reader.readUInt()
    const triangleSize = 50
    const totalSize = 80 + 2 + triangleSize * numTriangles

    if (totalSize === reader.view.byteLength) {
      return this.parseBinary(data)
    } else if (!header.trim().startsWith('solid')) {
      return this.parseBinary(data)
    } else {
      reader.seekAbsolute(0)
      return this.parseText(reader.readString(reader.view.byteLength))
    }
  }

  public static parseText(data: string): STL {
    const result: STL = {
      header: '',
      solids: [],
    }

    const reader = new TextReader(data)
    while (reader.canRead) {
      if (reader.peekToken() !== 'solid') {
        throw new Error(`expected "solid" keyword`)
      }
      result.solids.push(readSolid(reader))
    }

    return result
  }

  public static parseBinary(data: ArrayBuffer): STL {
    const result: STL = {
      header: '',
      solids: [],
    }
    const reader = new BinaryReader(data)
    result.header = reader.readString(80)

    const groups = new Map<number, Facet[]>()
    const numTriangles = reader.readUInt()
    for (let i = 0; i < numTriangles; i++) {
      const dat = [
        reader.readFloat(),
        reader.readFloat(),
        reader.readFloat(),

        reader.readFloat(),
        reader.readFloat(),
        reader.readFloat(),

        reader.readFloat(),
        reader.readFloat(),
        reader.readFloat(),

        reader.readFloat(),
        reader.readFloat(),
        reader.readFloat(),

        reader.readShort(),
      ]

      const attr = dat[12]

      if (!groups.has(attr)) {
        groups.set(attr, [])
      }
      groups.get(attr).push({
        normal: {
          x: dat[0],
          y: dat[1],
          z: dat[2],
        },
        vertcies: [{
          x: dat[3],
          y: dat[4],
          z: dat[5],
        }, {
          x: dat[6],
          y: dat[7],
          z: dat[8],
        }, {
          x: dat[9],
          y: dat[10],
          z: dat[11],
        }],
        attrCount: dat[12],
      })
    }

    groups.forEach((facets, attr) => {
      result.solids.push({
        name: '',
        facets: facets,
      })
    })

    return result
  }
}

function readSolid(reader: TextReader): Solid {
  // solid NAME
  // ...
  // endsolid NAME
  const result: Solid = {
    name: '',
    facets: [],
  }

  // consume: solid NAME
  // --
  reader.consumeToken('solid')
  if (reader.peekToken() === 'facet') {
    // name is skipped
  } else {
    // read name
    result.name = reader.nextToken()
  }

  // read the body
  // --
  while (reader.canRead && reader.peekToken() !== 'endsolid') {
    result.facets.push(readFacet(reader))
  }

  // consume: endsolid NAME
  // --
  reader.consumeToken('endsolid')
  if (reader.peekToken() === 'solid') {
    // name is skipped
  } else {
    // consume name, but we dont compare since some files use a different token here
    reader.nextToken()
  }

  return result
}

function readFacet(reader: TextReader): Facet {
  // facet normal X Y Z
  // ...
  // endfacet

  reader.consumeToken('facet')
  reader.consumeToken('normal')

  const facet: Facet = {
    normal: {
      x: parseFloat(reader.nextToken()),
      y: parseFloat(reader.nextToken()),
      z: parseFloat(reader.nextToken()),
    },
    vertcies: [],
    attrCount: 0,
  }

  while (reader.canRead && reader.peekToken() !== 'endfacet') {
    switch (reader.peekToken()) {
      case 'outer':
        readLoop(reader, (x: number, y: number, z: number) => {
          facet.vertcies.push({
            x: x,
            y: y,
            z: z,
          })
        })
        break
      default:
        throw new Error(`unknown token ${reader.peekToken()}`)
    }
  }

  reader.consumeToken('endfacet')

  return facet
}

function readLoop(reader: TextReader, emitter: (x: number, y: number, z: number) => void) {
  // outer loop
  //   vertex v1x v1y v1z
  //   vertex v2x v2y v2z
  //   vertex v3x v3y v3z
  // endloop
  reader.consumeToken('outer')
  reader.consumeToken('loop')

  while (reader.canRead && reader.peekToken() !== 'endloop') {
    reader.consumeToken('vertex')
    emitter(
      parseFloat(reader.nextToken()),
      parseFloat(reader.nextToken()),
      parseFloat(reader.nextToken()),
    )
  }

  reader.consumeToken('endloop')
}

// tslint:disable max-classes-per-file

function getLines(value: string): string[] {
  return value.replace(/\r/g, '\n').split('\n')
}

class LineReader {
  private lines: string[]
  private index: number
  public lastMatch: RegExpMatchArray

  public get line() {
    return this.lines[this.index]
  }

  public hasNext() {
    return this.index < this.lines.length - 1
  }

  constructor(input: string) {
    this.lines = input.replace(/\r/g, '\n').split('\n')
    this.index = -1
  }

  public next() {
    this.index++
    return this.index < this.lines.length
  }

  public match(regex: string | RegExp) {
    this.lastMatch = this.line.match(regex)
    return this.lastMatch
  }
}

export interface MD5Joint {
  name: string
  parentIndex: number
  position: { x: number, y: number, z: number },
  rotation: { x: number, y: number, z: number },
}

export interface MD5Vertex {
  index: number
  uv: { x: number, y: number }
  weightIndex: number
  weightCount: number
}

export interface MD5Triangle {
  index: number
  vIndex1: number
  vIndex2: number
  vIndex3: number
}

export interface MD5Weight {
  index: number
  jointIndex: number
  value: number
  position: { x: number, y: number, z: number },
}

export interface MD5Mesh {
  name?: string
  shader: string
  vert: MD5Vertex[]
  tri: MD5Triangle[]
  weight: MD5Weight[]
}

export class MD5 {

  public MD5Version: number
  public numJoints: number
  public numMeshes: number
  public commandline: string
  public joints: MD5Joint[]
  public meshes: MD5Mesh[]

  public parse(data: string, options = {}) {
    const reader = new LineReader(data)

    while (reader.next()) {
      if (reader.line.trim()) {
        // empty line
      } else if (reader.match(/numJoints\s+(\d+)/)) {
        this.numJoints = Number(reader.lastMatch[1])
      } else if (reader.match(/numMeshes\s+(\d+)/)) {
        this.numMeshes = Number(reader.lastMatch[1])
      } else if (reader.match(/MD5Version\s+(\d+)/)) {
        this.MD5Version = Number(reader.lastMatch[1])
      } else if (reader.match(/commandline\s+(.*)/)) {
        this.commandline = reader.lastMatch[1]
      } else if (reader.match(/joints\s+{/)) {
        this.joints = this.readJoints(reader)
      } else if (reader.match(/mesh\s+{/)) {
        this.meshes = this.meshes || []
        this.meshes.push(this.readMesh(reader))
      }
    }
  }

  private readJoints(reader: LineReader): MD5Joint[] {
    const result: MD5Joint[] = []
    while (reader.next() && !reader.line.match(/}/)) {
      // "origin" -1 ( 0 0 0 ) ( 0 0 0 )
      let match = reader.line.match(/^\s*"(.+)"\s(.+)\s\((.+)\)\s\((.+)\)/)
      if (match) {
        let pos = match[3].trim().split(/\s+/)
        let rot = match[4].trim().split(/\s+/)
        result.push({
          name: match[1],
          parentIndex: Number(match[2]),
          position: { x: Number(pos[0]), y: Number(pos[0]), z: Number(pos[0])},
          rotation: { x: Number(rot[0]), y: Number(rot[0]), z: Number(rot[0])},
        })
      }
    }
    return result
  }

  private readMesh(reader: LineReader): MD5Mesh {
    const result: MD5Mesh = {
      shader: '',
      vert: [],
      tri: [],
      weight: [],
    }
    while (reader.next() && !reader.line.match(/}/)) {
      if (reader.match(/shader "(.*)"/)) {
        result.shader = reader.lastMatch[1]
        continue
      }

      if (reader.match(/vert\s+(\d+)\s+\(.+\)\s+(\d+)\s+(\d+)/)) {
        const uv = reader.lastMatch[2].trim().split(/\s+/)
        result.vert.push({
          index: Number(reader.lastMatch[1]),
          uv: { x: Number(uv[0]), y: Number(uv[1]) },
          weightIndex: Number(reader.lastMatch[3]),
          weightCount: Number(reader.lastMatch[4]),
        })
        continue
      }

      if (reader.match(/tri\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/)) {
        result.tri.push({
          index: Number(reader.lastMatch[1]),
          vIndex1: Number(reader.lastMatch[2]),
          vIndex2: Number(reader.lastMatch[3]),
          vIndex3: Number(reader.lastMatch[4]),
        })
        continue
      }

      if (reader.match(/weight\s+(\d+)\s+(.+)\s(.+)\s\((.+)\)/)) {
        let pos = reader.lastMatch[4].trim().split(/\s+/)
        result.weight.push({
          index: Number(reader.lastMatch[1]),
          jointIndex: Number(reader.lastMatch[2]),
          value: Number(reader.lastMatch[3]),
          position: { x: Number(pos[0]), y: Number(pos[0]), z: Number(pos[0])},
        })
        continue
      }
    }

    return result
  }
}

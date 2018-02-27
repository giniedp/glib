// tslint:disable max-classes-per-file

function parseString(input: string): string {
  try {
    return JSON.parse(input)
  } catch (e) {
    return input
  }
}

class LineReader {
  private lines: string[]
  private index: number
  public lastMatch: RegExpMatchArray

  public get line() {
    return this.lines[this.index]
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
    if (this.line != null) {
      this.lastMatch = this.line.match(regex)
    } else {
      this.lastMatch = null
    }
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
  v1: number
  v2: number
  v3: number
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

  public static parse(data: string): MD5 {
    return new MD5().parse(data)
  }

  public MD5Version: number
  public numJoints: number
  public numMeshes: number
  public commandline: string
  public joints: MD5Joint[]
  public meshes: MD5Mesh[]

  public parse(data: string, options = {}) {
    const reader = new LineReader(data)
    while (reader.next()) {
      if (!reader.line.trim()) {
        // empty line
      } else if (reader.match(/^\s*numJoints\s+(\d+)/)) {
        this.numJoints = Number(reader.lastMatch[1])
      } else if (reader.match(/^\s*numMeshes\s+(\d+)/)) {
        this.numMeshes = Number(reader.lastMatch[1])
      } else if (reader.match(/^\s*MD5Version\s+(\d+)/)) {
        this.MD5Version = Number(reader.lastMatch[1])
      } else if (reader.match(/^\s*commandline\s+(.*)/)) {
        this.commandline = parseString(reader.lastMatch[1])
      } else if (reader.match(/^\s*joints\s+{/)) {
        this.joints = this.readJoints(reader)
      } else if (reader.match(/^\s*mesh\s+{/)) {
        this.meshes = this.meshes || []
        this.meshes.push(this.readMesh(reader))
      }
    }
    return this
  }

  private readJoints(reader: LineReader): MD5Joint[] {
    const result: MD5Joint[] = []
    while (reader.next() && !reader.line.match(/}/)) {
      // "origin" -1 ( 0 0 0 ) ( 0 0 0 )
      const match = reader.line.match(/^\s*"(.+)"\s(.+)\s\((.+)\)\s\((.+)\)/)
      if (match) {
        const pos = match[3].trim().split(/\s+/)
        const rot = match[4].trim().split(/\s+/)
        result.push({
          name: match[1],
          parentIndex: Number(match[2]),
          position: { x: Number(pos[0]), y: Number(pos[1]), z: Number(pos[2])},
          rotation: { x: Number(rot[0]), y: Number(rot[1]), z: Number(rot[2])},
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
    while (reader.next() && !reader.match(/\}/)) {
      if (reader.match(/^\s*shader\s"(.*)"/)) {
        result.shader = reader.lastMatch[1]
        continue
      }

      if (reader.match(/^\s*vert\s+(\d+)\s+\(\s*(.+)\s+(.+)\s*\)\s+(\d+)\s+(\d+)/)) {
        result.vert.push({
          index: Number(reader.lastMatch[1]),
          uv: {
            x: Number(reader.lastMatch[2]),
            y: Number(reader.lastMatch[3]),
          },
          weightIndex: Number(reader.lastMatch[4]),
          weightCount: Number(reader.lastMatch[5]),
        })
        continue
      }

      if (reader.match(/^\s*tri\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/)) {
        result.tri.push({
          index: Number(reader.lastMatch[1]),
          v1: Number(reader.lastMatch[2]),
          v2: Number(reader.lastMatch[3]),
          v3: Number(reader.lastMatch[4]),
        })
        continue
      }

      // weight 0 16 0.333333 ( -0.194917 0.111128 -0.362937 )
      if (reader.match(/^\s*weight\s+(\d+)\s+(.+)\s(.+)\s\(\s*(.+)\s+(.+)\s+(.+)\s*\)/)) {
        result.weight.push({
          index: Number(reader.lastMatch[1]),
          jointIndex: Number(reader.lastMatch[2]),
          value: Number(reader.lastMatch[3]),
          position: {
            x: Number(reader.lastMatch[4]),
            y: Number(reader.lastMatch[5]),
            z: Number(reader.lastMatch[6]),
          },
        })
        continue
      }
    }

    return result
  }
}

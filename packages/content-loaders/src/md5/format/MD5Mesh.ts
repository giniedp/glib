import { TextReader } from '@gglib/utils'
import { Joint } from './Joint'
import { Mesh } from './Mesh'

export class MD5Mesh {
  /**
   * The md5 format version
   */
  public MD5Version?: number

  /**
   * Total number of joints
   */
  public numJoints?: number

  /**
   * Total number of meshes
   */
  public numMeshes?: number

  /**
   * The command line that has been used to generate the md5mesh file
   */
  public commandline?: string

  /**
   * Collection of all meshes
   */
  public meshes: Mesh[]

  /**
   * Collection of all joints
   */
  public joints: Joint[]

  public static parse(data: string, options = {}): MD5Mesh {
    return readModel(new TextReader(data))
  }
}

function readModel(reader: TextReader): MD5Mesh {
  const doc: MD5Mesh = {
    meshes: [],
    joints: [],
  }
  while (reader.canRead) {
    const line = reader.peekLine().trim().split(' ')

    switch (line[0]) {
      case 'MD5Version':
        doc.MD5Version = Number(line[1])
        reader.nextLine()
        break
      case 'numJoints':
        doc.numJoints = Number(line[1])
        reader.nextLine()
        break
      case 'numMeshes':
        doc.numMeshes = Number(line[1])
        reader.nextLine()
        break
      case 'commandline':
        doc.commandline = line.slice(1).join(' ').trim().replace(/(^")|("$)/g, '')
        reader.nextLine()
        break
      case 'joints':
        reader.nextBlock('{', '}', (block) => {
          doc.joints = readJoints(block)
        })
        break
      case 'mesh':
        reader.nextBlock('{', '}', (block) => {
          doc.meshes.push(readMesh(block))
        })
        break
      default:
        reader.nextLine()
        break
    }
  }
  return doc
}

function readMesh(reader: TextReader): Mesh {
  const result: Mesh = {
    shader: '',
    vert: [],
    tri: [],
    weight: [],
  }
  let numVerts = 0
  let numTris = 0
  let numWeights = 0
  while (reader.canRead) {
    reader.nextLine((l) => {
      if (!l.peekLine().trim()) {
        return
      }
      switch (l.nextToken()) {
        case 'shader':
          result.shader = l.rest.trim().replace(/(^")|("$)/g, '')
          break
        case 'numverts':
          numVerts = Number(l.rest)
          break
        case 'numtris':
          numTris = Number(l.rest)
          break
        case 'numweights':
          numWeights = Number(l.rest)
          break
        case 'vert':
          // vert 0 ( 0.394531 0.513672 ) 0 1
          const vIndex = Number(l.nextToken())
          l.skipUntil('(', true)
          const uvX = Number(l.nextToken())
          const uvY = Number(l.nextToken())
          l.skipUntil(')', true)
          const weightIndex = Number(l.nextToken())
          const weightCount = Number(l.nextToken())
          result.vert[vIndex] = {
            index: vIndex,
            uv: { x: uvX, y: uvY },
            weightIndex: weightIndex,
            weightCount: weightCount,
          }
          break
        case 'tri':
          // tri 566 437 464 469
          const tIndex = Number(l.nextToken())
          const tX = Number(l.nextToken())
          const tY = Number(l.nextToken())
          const tZ = Number(l.nextToken())
          result.tri[tIndex] = {
            index: tIndex,
            v1: tX,
            v2: tY,
            v3: tZ,
          }
          break
        case 'weight':
          // weight 0 16 0.333333 ( -0.194917 0.111128 -0.362937 )
          const wIndex = Number(l.nextToken())
          const jIndex = Number(l.nextToken())
          const jWeight = Number(l.nextToken())
          l.skipUntil('(', true)
          const pX = Number(l.nextToken())
          const pY = Number(l.nextToken())
          const pZ = Number(l.nextToken())
          l.skipUntil(')', true)
          result.weight[wIndex] = {
            index: wIndex,
            jointIndex: jIndex,
            value: jWeight,
            position: {
              x: pX,
              y: pY,
              z: pZ,
            },
          }
          break
        default:
          break
      }
    })
  }
  if (result.tri.length !== numTris) {
    console.warn(`[MD5Mesh] expected ${numTris} tris but was given ${result.tri.length}`)
  }
  if (result.vert.length !== numVerts) {
    console.warn(`[MD5Mesh] expected ${numVerts} verts but was given ${result.vert.length}`)
  }
  if (result.weight.length !== numWeights) {
    console.warn(`[MD5Mesh] expected ${numWeights} weights but was given ${result.weight.length}`)
  }
  return result
}

function readJoints(reader: TextReader): Joint[] {
  const result: Joint[] = []
  while (reader.canRead) {
    // "origin" -1 ( 0 0 0 ) ( 0 0 0 )
    reader.nextLine((l) => {
      if (!l.peekLine().trim()) {
        return
      }

      const name = l.nextToken().trim().replace(/(^")|("$)/g, '')
      const parent = Number(l.nextToken())
      l.skipUntil('(', true)
      const pX = Number(l.nextToken())
      const pY = Number(l.nextToken())
      const pZ = Number(l.nextToken())
      l.skipUntil(')', true)
      l.skipUntil('(', true)
      const rX = Number(l.nextToken())
      const rY = Number(l.nextToken())
      const rZ = Number(l.nextToken())
      l.skipUntil(')', true)
      const t = 1.0 - (rX * rX) - (rY * rY) - (rZ * rZ)
      result.push({
        name: name,
        parentIndex: parent,
        position: { x: pX, y: pY, z: pZ },
        rotation: { x: rX, y: rY, z: rZ, w: t < 0 ? 0 : -Math.sqrt(t) },
      })
    })
  }
  return result
}

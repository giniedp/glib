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
        reader.readLine()
        break
      case 'numJoints':
        doc.numJoints = Number(line[1])
        reader.readLine()
        break
      case 'numMeshes':
        doc.numMeshes = Number(line[1])
        reader.readLine()
        break
      case 'commandline':
        doc.commandline = line.slice(1).join(' ').trim().replace(/(^")|("$)/g, '')
        reader.readLine()
        break
      case 'joints':
        reader.readUntil('{')
        reader.readBlock('{', '}', (block) => {
          doc.joints = readJoints(block)
        })
        break
      case 'mesh':
        reader.readUntil('{')
        reader.readBlock('{', '}', (block) => {
          doc.meshes.push(readMesh(block))
        })
        break
      default:
        reader.readLine()
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
    reader.readLine((l) => {
      if (!l.peekLine().trim()) {
        return
      }
      switch (l.readText()) {
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
          const vIndex = Number(l.readText())
          l.skipUntil('(', true)
          const uvX = Number(l.readText())
          const uvY = Number(l.readText())
          l.skipUntil(')', true)
          const weightIndex = Number(l.readText())
          const weightCount = Number(l.readText())
          result.vert[vIndex] = {
            index: vIndex,
            uv: { x: uvX, y: uvY },
            weightIndex: weightIndex,
            weightCount: weightCount,
          }
          break
        case 'tri':
          // tri 566 437 464 469
          const tIndex = Number(l.readText())
          const tX = Number(l.readText())
          const tY = Number(l.readText())
          const tZ = Number(l.readText())
          result.tri[tIndex] = {
            index: tIndex,
            v1: tX,
            v2: tY,
            v3: tZ,
          }
          break
        case 'weight':
          // weight 0 16 0.333333 ( -0.194917 0.111128 -0.362937 )
          const wIndex = Number(l.readText())
          const jIndex = Number(l.readText())
          const jWeight = Number(l.readText())
          l.skipUntil('(', true)
          const pX = Number(l.readText())
          const pY = Number(l.readText())
          const pZ = Number(l.readText())
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
    reader.readLine((l) => {
      if (!l.peekLine().trim()) {
        return
      }

      const name = l.readText().trim().replace(/(^")|("$)/g, '')
      const parent = Number(l.readText())
      l.skipUntil('(', true)
      const pX = Number(l.readText())
      const pY = Number(l.readText())
      const pZ = Number(l.readText())
      l.skipUntil(')', true)
      l.skipUntil('(', true)
      const rX = Number(l.readText())
      const rY = Number(l.readText())
      const rZ = Number(l.readText())
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

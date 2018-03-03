import { extend, WebWorker } from '@gglib/core'
import { Model, ModelBuilder, ModelOptions } from '@gglib/graphics'
import { OBJ, ObjData, ObjGroup } from '../parser'
import { Pipeline, PipelineContext, pipelineImporter, pipelinePreprocessor, pipelineProcessor } from '../Pipeline'
import { RawAsset } from './../Manager'

pipelineImporter(['.obj', 'application/x-obj'], Model, (context: PipelineContext) => {
  return objToJsonAsync(context.downloaded).then((json: any) => {
    context.imported = json
    return context.pipeline.process(context)
  })
})

const objToJsonAsync = WebWorker.register('objToJson', (data: RawAsset) => {
  let obj = OBJ.parse(data.content)
  let json = convert(obj)
  return json
})

function convert(data: ObjData) {
  let builder = ModelBuilder.begin({
    layout: 'PositionTextureNormalTangentBitangent',
    ignoreTransform: true,
  })

  let byMaterial = {}
  for (let group of data.groups) {
    byMaterial[group.material] = byMaterial[group.material] || []
    byMaterial[group.material].push(group)
  }
  for (let key in byMaterial) {
    if (byMaterial.hasOwnProperty(key))  {
      buildMesh(builder, data, byMaterial[key])
    }
  }

  return builder.endModelOptions({
    name: data.name,
    materials: data.materials as any,
  })
}

let V = 0
let VT = 1
let VN = 2

function readVertex(data: ObjData, element: number[]) {
  let vertex: any = {}
  vertex.position = data.v[element[V] - 1]

  if (element[VT] != null && data.vt != null) {
    vertex.texture = data.vt[element[VT] - 1]
  }
  if (element[VN] != null && data.vn != null) {
    vertex.normal = data.vn[element[VN] - 1]
  }
  return vertex
}

function buildMesh(builder: ModelBuilder, data: ObjData, groups: ObjGroup[]) {

  let index = 0
  let vertex = null
  for (let group of groups) {
    for (let face of group.f) {
      let count = 0
      while (count < face.length - 2) {

        if (builder.vertexCount >= (builder.maxVertexCount - 2)) {
          builder.endMeshOptions({
            name: group.name,
            materialId: group.material,
          })
          index = 0
        }
        vertex = readVertex(data, face[0])
        builder.addIndex(index)
        builder.addVertex(vertex)
        index += 1

        vertex = readVertex(data, face[count + 2])
        builder.addIndex(index)
        builder.addVertex(vertex)
        index += 1

        vertex = readVertex(data, face[count + 1])
        builder.addIndex(index)
        builder.addVertex(vertex)
        index += 1

        count += 1
      }
    }
    if (index > 0) {
      builder.endMeshOptions({
        name: group.name,
        materialId: group.material,
      })
      index = 0
    }
  }
}

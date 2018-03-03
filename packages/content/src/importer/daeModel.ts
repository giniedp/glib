import { extend, Uri } from '@gglib/core'
import {
  DataSize,
  DataType,
  Model,
  ModelBuilder,
  ModelMeshOptions,
  PrimitiveType,
  VertexLayout } from '@gglib/graphics'
import { IVec3, Mat4, Quat, Vec3 } from '@gglib/math'

import { Pipeline, PipelineContext, pipelineImporter, pipelinePreprocessor, pipelineProcessor } from '../Pipeline'
import * as DAE from './../parser/dae'

pipelineImporter(['.dae', 'application/xml'], Model, (context: PipelineContext) => {
  const dae = DAE.parse(context.downloaded.content)

  if (!dae.scene || !dae.scene.instanceVisialScene) {
    throw new Error('invalid dae document')
  }

  dae.scene.instanceVisialScene.getInstance().then((scene) => {

    let meshes: ModelMeshOptions[] = []
    scene.nodes.map((node) => {
      Promise.all(node.instanceGeometries.map((geometry) => geometry.getInstance())).then((geometries) => {
        geometries.map((geometry) => {
          meshes = meshes.concat(
            convertMesh(dae, geometry.mesh.lines, PrimitiveType.LineList),
            convertMesh(dae, geometry.mesh.linestrips, PrimitiveType.LineStrip),
            convertMesh(dae, geometry.mesh.triangles, PrimitiveType.TriangleList),
            convertMesh(dae, geometry.mesh.tristrips, PrimitiveType.TriangleStrip),
            convertMesh(dae, geometry.mesh.trifans, PrimitiveType.TriangleFan),
          )
        })
      })
    })

    const modelOptions = {
      meshes: meshes,
    }
    context.imported = modelOptions
    return context.pipeline.process(context)
  })
})

function convertSemantic(input: DAE.Input) {
  let name = input.semantic.toLowerCase()
  if (input.semantic.match(/VERTEX/gi)) {
    name = 'position'
  }
  if (input.set) {
    name += String(input.set)
  }
  return name
}

function convertLayout(dae: DAE.COLLADA, inputs: DAE.Input[]): VertexLayout {
  const result: VertexLayout = {}
  inputs.forEach((input) => {
    const source = dae.getSource(input.source)
    const dataType = DataType[source.accessor.params[0].type]
    result[convertSemantic(input)] = {
      type: dataType,
      offset: input.offset * DataSize[dataType],
      elements: source.accessor.stride,
    }
  })
  return result
}

function convertMesh(
  dae: DAE.COLLADA, source: any, type: any): ModelMeshOptions[] {
  const meshOptions: ModelMeshOptions[] = []
  if (!source) {
    return meshOptions
  }
  const builder = new ModelBuilder({
    layout: convertLayout(dae, source.inputs),
  })
  let vertex = {}
  source.collect({
    param: (input: any, param: any, value: any) => {
      const name = convertSemantic(input)
      vertex[name] = vertex[name] || []
      vertex[name].push(value)
    },
    endParam: () => {
      //
    },
    endPrimitive: () => {
      builder.addIndex(builder.vertexCount)
      builder.addVertex(vertex)
      vertex = {}
    },
    endList: () => {
      meshOptions.push(builder.endMeshOptions({
        primitiveType: type,
      }))
    },
  })
  return meshOptions
}

function convertTransform(node: DAE.Node): Mat4 {
  return node.transforms.map((it) => {
    switch (it.type) {
      case 'lookat':
        return Mat4.createLookAt(
          Vec3.convert(it.data.slice(0, 3)),
          Vec3.convert(it.data.slice(3, 6)),
          Vec3.convert(it.data.slice(6, 9)),
        )
      case 'matrix':
        return Mat4.createFromBuffer(it.data)
      case 'rotate':
        const axis = Vec3.convert(it.data)
        const angle = it.data[3] * Math.PI / 180
        return Mat4.createAxisAngle(axis, angle)
      case 'scale':
        return Mat4.createScale(it.data[0], it.data[1], it.data[2])
      case 'translate':
        return Mat4.createTranslation(it.data[0], it.data[1], it.data[2])
      default:
        return Mat4.createIdentity()
    }
  }).reduce((l, r) => l.concat(r), Mat4.createIdentity())
}

import {
  DataTypeName,
  dataTypeSize,
  MaterialOptions,
  Model,
  ModelBuilder,
  ModelMeshOptions,
  ModelOptions,
  PrimitiveType,
  valueOfDataType,
  VertexLayout,
} from '@gglib/graphics'

import { PipelineContext } from '../../PipelineContext'
import { loader } from '../../utils'

import { Mat4, Vec3 } from '@gglib/math'
import * as DAE from '../../formats/dae'

export const daeToColladaDocument = loader<null, DAE.COLLADA>({
  input: ['.dae', 'application/xml'],
  output: DAE.COLLADA,
  handle: async (_, context) => {
    const data = await context.manager.downloadDocument(context.source)
    return DAE.COLLADA.parse(data.content)
  },
})

export const colladaDocumentToModelOptions = loader<DAE.COLLADA, ModelOptions>({
  input: DAE.COLLADA,
  output: Model.Options,
  handle: async (dae, context) => {

    if (!dae.scene || !dae.scene.instanceVisualScene) {
      throw new Error('invalid dae document')
    }

    const scene = await dae.scene.instanceVisualScene.getScene()
    const meshes: ModelMeshOptions[] = []
    const materials = new Map<string, DAE.InstanceMaterial>()

    await walkNodes(scene.nodes, Mat4.createIdentity(), async (geometry, transform, material) => {
      if (geometry.mesh.polygons.length) {
        console.warn('polygons are not supported => ignored')
      }
      if (geometry.mesh.polylist.length) {
        console.warn('polylist is assumed to be a list of triangles. if it is not, the model will be broken.')
      }

      [
        ...convertMesh(dae, geometry.mesh.lines, PrimitiveType.LineList),
        ...convertMesh(dae, geometry.mesh.linestrips, PrimitiveType.LineStrip),
        ...convertMesh(dae, geometry.mesh.triangles, PrimitiveType.TriangleList),
        ...convertMesh(dae, geometry.mesh.polylist, PrimitiveType.TriangleList), // assume poly list is a list of triangle polygons
        ...convertMesh(dae, geometry.mesh.tristrips, PrimitiveType.TriangleStrip),
        ...convertMesh(dae, geometry.mesh.trifans, PrimitiveType.TriangleFan),
      ].forEach((mesh) => {
        material.techniqueCommonInstanceMaterial.forEach((it) => {
          if (it.symbol === mesh.materialId) {
            mesh.materialId = it.symbol + it.target
            materials.set(mesh.materialId, it)
          }
        })
        meshes.push(mesh)
      })
    })
    return {
      materials: await Promise.all(Array.from(materials.values()).map((it) => loadMaterial(it, context))),
      meshes: meshes,
    }
  },
})

async function walkNodes(
  nodes: DAE.Node[],
  transform: Mat4,
  cb: (geometry: DAE.Geometry, transform: Mat4, material: DAE.BindMaterial,
) => Promise<void>) {
  for (const node of nodes) {

    const subTransform = Mat4.multiply(transform, createTransform(node.transforms))
    await Promise.all(node.instanceGeometries.map(async (it) => {
      const geometry = await it.getGeometry()
      const material = it.bindMaterial
      await cb(geometry, subTransform, material)
    }))

    const subNodes = await Promise.all(node.instanceNodes.map((it) => it.getNode()))
    await walkNodes(subNodes, subTransform, cb)
    await walkNodes(node.nodes, subTransform, cb)
  }
}

function convertSemantic(input: DAE.Input) {
  let name = input.semantic.toLowerCase()
  if (input.semantic.match(/VERTEX/gi)) {
    name = 'position'
  }
  if (input.semantic.match(/TEXCOORD/gi)) {
    name = 'texture'
  }
  if (input.set) {
    name += String(input.set)
  }
  return name
}

function convertLayout(dae: DAE.COLLADA, inputs: DAE.Input[]): VertexLayout {
  const result: VertexLayout = {}
  let offset = 0
  inputs.forEach((input) => {
    const source = dae.getSource(input.source)
    const dataType = valueOfDataType(source.accessor.params[0].type as DataTypeName) // TODO:
    result[convertSemantic(input)] = {
      type: dataType,
      offset: offset,
      elements: source.accessor.stride,
    }
    offset += source.accessor.stride * dataTypeSize(dataType)
  })
  return result
}

function convertMesh(
  dae: DAE.COLLADA,
  source: DAE.MeshBuilderDef[],
  type: PrimitiveType,
): ModelMeshOptions[] {
  const meshOptions: ModelMeshOptions[] = []
  if (!source) {
    return meshOptions
  }
  source.forEach((it) => {
    const layout = convertLayout(dae, it.inputs)
    const builder = new ModelBuilder({ layout: layout })
    builder.ensureLayoutChannel('normal')
    builder.ensureLayoutChannel('tangent')
    builder.ensureLayoutChannel('bitangent')
    const indexMap = new Map<string, number>()
    let vertex = {}
    it.build({
      param: (input: DAE.Input, param: DAE.Param, value: any) => {
        const name = convertSemantic(input)
        vertex[name] = vertex[name] || []
        vertex[name].push(value)
      },
      endAttribute: () => {
        //
      },
      endVertex: (hash: number[]) => {
        const id = hash.join('-')
        if (indexMap.has(id)) {
          builder.addIndex(indexMap.get(id))
        } else {
          indexMap.set(id, builder.vertexCount)
          builder.addIndex(builder.vertexCount)
          builder.addVertex(vertex)
        }
        vertex = {}
      },
      endPrimitive: () => {
        meshOptions.push(builder
        .calculateBoundings()
        .endMeshOptions({
          primitiveType: type,
          materialId: it.material,
        }))
      },
    })
  })

  return meshOptions
}

function createTransform(transforms: DAE.NodeTranform[]) {
  return transforms.map((it) => {
    switch (it.type) {
      case 'lookat':
        return Mat4.createLookAt(
          Vec3.createFromBuffer(it.data, 0),
          Vec3.createFromBuffer(it.data, 3),
          Vec3.createFromBuffer(it.data, 6),
        )
      case 'matrix':
        return Mat4.createFromBuffer(it.data)
      case 'rotate':
        return Mat4.createAxisAngle(Vec3.createFromBuffer(it.data, 0), it.data[3] * Math.PI / 180)
      case 'scale':
        return Mat4.createScale(it.data[0], it.data[1], it.data[2])
      case 'skew':
        console.warn('[DAE] skew transform is not supported')
        return Mat4.createIdentity()
      case 'translate':
        return Mat4.createTranslation(it.data[0], it.data[1], it.data[2])
      default:
        return Mat4.createIdentity()
    }
  }).reduce((result, m) => {
    return result == null ? m : result.multiply(m)
  }, null) || Mat4.createIdentity()
}

async function loadMaterial(instance: DAE.InstanceMaterial, context: PipelineContext) {

  const result: MaterialOptions = {
    name: instance.symbol + instance.target,
    effect: 'default',
    parameters: {},
  }

  const mat = await instance.getMaterial()
  const fx = await mat.instanceEffect.getEffect()

  if (fx.profileCommon) {
    const common = fx.profileCommon
    let tech: DAE.CommonTechnique
    if (common.techniqueBlinn) {
      tech = common.techniqueBlinn
      result.effect = 'blinn'
    } else if (common.techniqueConstant) {
      tech = common.techniqueConstant
      result.effect = 'unlit'
    } else if (common.techniqueLambert) {
      tech = common.techniqueLambert
      result.effect = 'lambert'
    } else if (common.techniquePhong) {
      tech = common.techniquePhong
      result.effect = 'phong'
    }

    if (tech.ambient && tech.ambient.color) {
      result.parameters['AmbientColor'] = tech.ambient.color
    }

    if (tech.diffuse && tech.diffuse.color) {
      result.parameters['DiffuseColor'] = tech.diffuse.color
    }

    if (tech.emission && tech.emission.color) {
      result.parameters['EmissionColor'] = tech.emission.color
    }

    if (tech.specular && tech.specular.color) {
      result.parameters['SpecularColor'] = tech.specular.color
    }

    if (tech.shininess && tech.shininess.value != null) {
      result.parameters['SpecularPower'] = tech.shininess.value
    }

    if (tech.reflective && tech.reflective.color) {
      result.parameters['ReflectiveColor'] = tech.reflective.color
    }

    if (tech.reflectivity && tech.reflectivity.value != null) {
      result.parameters['ReflectiveColor'] = tech.reflective.color
    }
  }

  return result
}
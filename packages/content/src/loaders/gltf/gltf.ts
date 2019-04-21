import { Log } from '@gglib/core'
import { ArrayType, MaterialOptions, Model, ModelMeshOptions, ModelOptions, ModelSkin, ModelJointPose, ModelJoint } from '@gglib/graphics'
import { BoundingBox, BoundingSphere, Mat4, Quat } from '@gglib/math'

import {
  Accessor,
  AccessorType,
  Document,
  GLTF,
  KHR_materials_pbrSpecularGlossiness,
  KHR_materials_unlit,
  KHR_texture_transform,
  Node,
  PbrMaterialSpecularGlossiness,
  TextureInfo,
  TextureTransform,
} from '../../formats/gltf'
import { PipelineContext } from '../../PipelineContext'
import { loader, resolveUri } from '../../utils'

export const glbToGLTFDocument = loader<null, Document>({
  input: ['.glb', 'model/gltf-binary'],
  output: GLTF.Document,
  handle: async (_, context) => {
    const data = await context.manager.downloadArrayBuffer(context.source)
    return GLTF.parseBinary(data.content)
  },
})

export const gltfToGLTFDocument = loader<null, Document>({
  input: ['.gltf', 'model/gltf+json'],
  output: GLTF.Document,
  handle: async (_, context) => {
    const data = await context.manager.downloadText(context.source)
    return GLTF.parse(data.content)
  },
})

export const gltfDocumentToModleOptions = loader<Document, ModelOptions>({
  input: GLTF.Document,
  output: Model.Options,
  handle: async (input, context) => {
    const scene = input.scenes[input.scene || 0]

    const nodes: Node[] = []
    walkNodes(input, scene.nodes, (node) => {
      if (node.mesh != null) {
        nodes.push(node)
      }
    })

    return loadModel(context, input, nodes[0])
  },
})

export const gltfDocumentToModleOptionsArray = loader<Document, ModelOptions[]>({
  input: GLTF.Document,
  output: Model.OptionsArray,
  handle: async (input, context) => {
    const scene = input.scenes[input.scene || 0]

    const nodes: Node[] = []
    walkNodes(input, scene.nodes, (node) => {
      if (node.mesh != null) {
        nodes.push(node)
      }
    })

    return Promise.all(nodes.map(async (node) => loadModel(context, input, node)))
  },
})

function walkNodes(doc: Document, nodes: number[], callback: (node: Node) => void) {
  nodes.forEach((id) => {
    const node = doc.nodes[id]
    callback(node)
    if (node.children && node.children.length) {
      walkNodes(doc, node.children, callback)
    }
  })
}

async function loadModel(
  context: PipelineContext,
  doc: Document,
  node: Node,
): Promise<ModelOptions> {

  const meshes = await loadMesh(context, doc, node)

  const mtlMap = new Map<number | string, Promise<MaterialOptions>>()
  for (const mesh of meshes) {
    if (!mtlMap.has(mesh.materialId)) {
      mtlMap.set(mesh.materialId, loadMaterial(context, doc, mesh.materialId as number))
    }
  }

  const materials = Array.from(mtlMap.entries())
  for (const mesh of meshes) {
    mesh.materialId = materials.findIndex(([id]) => id === mesh.materialId)
  }

  return {
    name: node.name,
    materials: await Promise.all(materials.map(([, promise]) => promise)),
    meshes: meshes,
    skin: node.skin == null ? null : await loadSkin(context, doc, node.skin),
  }
}

async function loadMaterial(
  context: PipelineContext,
  doc: Document,
  materialIndex: number,
): Promise<MaterialOptions> {
  const material = (doc.materials || [])[materialIndex] || {}

  const params = {}
  let effect = 'default'

  if (material.normalTexture != null) {
    params['NormalMap'] = await loadTexture(context, doc, material.normalTexture.index)
    readTextureTransforms(params, 'NormalMap', material.normalTexture)
  }
  if (material.occlusionTexture != null) {
    params['OcclusionMap'] = await loadTexture(context, doc, material.occlusionTexture.index)
    readTextureTransforms(params, 'OcclusionMap', material.occlusionTexture)
  }
  if (material.emissiveTexture != null) {
    params['EmissionMap'] = await loadTexture(context, doc, material.emissiveTexture.index)
    readTextureTransforms(params, 'EmissionMap', material.emissiveTexture)
  }
  if (material.emissiveFactor != null) {
    params['EmissionColor'] = material.emissiveFactor
  }
  if (material.alphaCutoff != null) {
    params['AlphaClip'] = material.alphaCutoff
  }
  if (material.alphaMode != null) {
    // TODO
  }
  if (material.doubleSided != null) {
    // TODO
  }

  if (material.pbrMetallicRoughness) {
    effect = 'pbr'

    const pbr = material.pbrMetallicRoughness
    if (pbr.baseColorFactor != null) {
      params['DiffuseColor'] = pbr.baseColorFactor
    }
    if (pbr.baseColorTexture != null) {
      params['DiffuseMap'] = await loadTexture(context, doc, pbr.baseColorTexture.index)
      readTextureTransforms(params, 'DiffuseMap', pbr.baseColorTexture)
    }
    if (pbr.metallicFactor != null || pbr.roughnessFactor) {
      params['MetallicRoughness'] = [pbr.metallicFactor || 0, pbr.roughnessFactor || 0]
    }
    if (pbr.metallicRoughnessTexture != null) {
      params['MetallicRoughnessMap'] = await loadTexture(context, doc, pbr.metallicRoughnessTexture.index)
      readTextureTransforms(params, 'MetallicRoughnessMap', pbr.metallicRoughnessTexture)
    }
  }

  if (material.extensions && material.extensions[KHR_materials_pbrSpecularGlossiness]) {
    effect = 'default'

    const gloss: PbrMaterialSpecularGlossiness = material.extensions[KHR_materials_pbrSpecularGlossiness]
    if (gloss.diffuseFactor) {
      params['DiffuseColor'] = gloss.diffuseFactor
    }
    if (gloss.diffuseTexture) {
      params['DiffuseMap'] = await loadTexture(context, doc, gloss.diffuseTexture.index)
      readTextureTransforms(params, 'DiffuseMap', gloss.diffuseTexture)
    }
    if (gloss.specularFactor) {
      params['SpecularColor'] = gloss.specularFactor
    }
    if (gloss.glossinessFactor) {
      params['Glossiness'] = gloss.glossinessFactor
    }
    if (gloss.specularGlossinessTexture) {
      params['SpecularMap'] = await loadTexture(context, doc, gloss.specularGlossinessTexture.index)
      readTextureTransforms(params, 'SpecularMap', gloss.specularGlossinessTexture)
    }
  }

  if (material.extensions && material.extensions[KHR_materials_unlit]) {
    effect = 'unlit'
  }

  return {
    name: material.name,
    effect: effect,
    parameters: params,
  }
}

function readTextureTransforms(params: any, name: string, info: TextureInfo) {
  if (info.extensions && info.extensions[KHR_texture_transform]) {
    const transform = info.extensions[KHR_texture_transform] as TextureTransform
    const offsetScale = [0, 0, 1, 1]
    if (transform.offset) {
      offsetScale[0] = transform.offset[0] || 0
      offsetScale[1] = transform.offset[1] || 0
    }
    if (transform.scale) {
      offsetScale[2] = transform.scale[0]
      offsetScale[3] = transform.scale[1]
    }
    if (transform.offset || transform.scale) {
      params[name + 'OffsetScale'] = offsetScale
    }
  }
}

async function loadSkin(context: PipelineContext, doc: Document, skinIndex: number): Promise<ModelSkin> {
  const skin = doc.skins[skinIndex]

  let hierarchy: ModelJoint[] = []
  let bindPose: ModelJointPose[] = []
  let nodes = skin.joints.map((it) => doc.nodes[it])

  skin.joints.forEach((i) => {
    const node = doc.nodes[i]
    hierarchy.push({
      name: node.name,
      parent: nodes.findIndex((it) => it.children && it.children.indexOf(i) >= 0),
    })
    const s = node.scale || [1, 1, 1]
    const q = node.rotation || [0, 0, 0, 1]
    const t = node.translation || [0, 0, 0]
    // TODO: decompose node.matrix
    bindPose.push({
      scale: { x: s[0], y: s[1], z: s[2] },
      rotation: { x: q[0], y: q[1], z: q[2], w: q[3] },
      translation: { x: t[0], y: t[1], z: t[2] },
    })
  })

  const result: ModelSkin = {
    hierarchy: hierarchy,
    bindPose: bindPose,
  }

  if (!skin.inverseBindMatrices) {
    return result
  }

  const inverseBindBuffer = await loadBufferView(context, doc, doc.accessors[skin.inverseBindMatrices])
  if (inverseBindBuffer instanceof Float32Array) {
    const inverseBindMatrices = []
    for (let i = 0; i < hierarchy.length * 16; i += 16) {
      inverseBindMatrices.push(inverseBindBuffer.slice(i, i + 16))
    }
    result.inverseBindPose = inverseBindMatrices
  }

  return result
}

function loadMatrix(node: Node): number[] {
  if (node.matrix) {
    return Mat4.createFromBuffer(node.matrix).toArray()
  } else {
    const s = node.scale || [1, 1, 1]
    const r = node.rotation || [0, 0, 0, 1]
    const t = node.translation || [0, 0, 0]
    return Mat4.concatChain(
      Mat4.createTranslation(t[0], t[1], t[2]),
      Mat4.createFromQuaternion(Quat.convert(r)),
      Mat4.createScale(s[0], s[1], s[2]),
    ).toArray()
  }
}

async function loadMesh(
  context: PipelineContext,
  doc: Document,
  node: Node,
): Promise<ModelMeshOptions[]> {

  const mesh = doc.meshes[node.mesh]
  let min = [0, 0, 0]
  let max = [0, 0, 0]
  const result = mesh.primitives.map(async (part): Promise<ModelMeshOptions> => {
    const semantics: string[] = []

    const indexBuffer = part.indices == null ? null : (async (accessor: Accessor) => {
      const bufferView = await loadBufferView(context, doc, accessor)
      return context.manager.device.createIndexBuffer({
        data: bufferView,
        stride: doc.bufferViews[accessor.bufferView].byteStride,
        dataType: accessor.componentType as number,
      })
    })(doc.accessors[part.indices])

    const vertexBuffers = Object.keys(part.attributes).map(async (semantic) => {
      semantics.push(semantic)
      const accessor = doc.accessors[part.attributes[semantic]]
      if (semantic === 'POSITION') {
        min = [...accessor.min]
        max = [...accessor.max]
      }
      const bufferView = await loadBufferView(context, doc, accessor)
      return context.manager.device.createVertexBuffer({
        data: bufferView,
        dataType: accessor.componentType as number,
        stride: doc.bufferViews[accessor.bufferView].byteStride,
        layout: {
          [semantic.toLowerCase().replace(/_0$/, '').replace(/^texcoord/, 'texture')]: {
            offset: 0,
            normalize: accessor.normalized,
            elements: elementCount(accessor.type),
            type: accessor.componentType as number,
          },
        },
      })
    })

    const sphere = BoundingSphere.createFromBox(BoundingBox.create(...min, ...max))
    return {
      boundingBox: [...min, ...max],
      boundingSphere: [sphere.center.x, sphere.center.y, sphere.center.z, sphere.radius],
      vertexBuffer: await Promise.all(vertexBuffers),
      indexBuffer: await indexBuffer,
      materialId: part.material,
      primitiveType: part.mode,
      name: mesh.name,
    }
  })

  return Promise.all(result)
}

async function loadTexture(context: PipelineContext, doc: Document, index: number) {
  const tex = doc.textures[index]
  const sampler = doc.samplers ? doc.samplers[tex.sampler] : null
  const image = doc.images[tex.source]
  if (image.uri) {
    return context.manager.device.createTexture({
      data: resolveUri(image.uri, context),
      sampler: sampler ? {
        minFilter: sampler.minFilter,
        magFilter: sampler.magFilter,
        wrapU: sampler.wrapS,
        wrapV: sampler.wrapT,
      } : null,
    })
  }
  if (image.bufferView) {
    switch (image.mimeType) {
      case 'image/png':
        // TODO:
        // context.loader.transform(ImagePng, ImageData, ..., context)
        break
      case 'image/jpeg':
        // TODO:
        // context.loader.transform(ImageJpeg, ImageData, ..., context)
      default:
    }
  }
  Log.w(`[glTF] loading image from buffer is not supported yet`)
  return null
}

async function loadBufferView(
  context: PipelineContext,
  doc: Document,
  accessor: Accessor,
) {
  const bufferView = doc.bufferViews[accessor.bufferView]
  const bufferIndex = bufferView.buffer
  const buffer = await loadBuffer(context, doc, bufferIndex)
  const offset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0)
  return new ArrayType[accessor.componentType](await buffer, offset, accessor.count * elementCount(accessor.type))
}

async function loadBuffer(
  context: PipelineContext,
  doc: Document,
  bufferIndex: number,
): Promise<ArrayBuffer> {
  doc.chunks = doc.chunks || []
  if (!doc.chunks[bufferIndex]) {
    if (!doc.buffers || !doc.buffers[bufferIndex]) {
      throw new Error(`[glTF] buffer not found: ${bufferIndex}`)
    }
    const buffer = doc.buffers[bufferIndex]
    if (buffer.uri) {
      doc.chunks[bufferIndex] = (await context.manager.downloadArrayBuffer(resolveUri(buffer.uri, context))).content
    }
  }
  return doc.chunks[bufferIndex]
}

function elementCount(type: AccessorType) {
  return {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
  }[type]
}

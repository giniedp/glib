import {
  ArrayType,
  MaterialOptions,
  Model,
  ModelMeshPartOptions,
  ModelOptions,
  BufferOptions,
  VertexLayout,
  Buffer,
  dataTypeSize,
  nameOfDataType,
  AnimationData,
  AnimationDataChannels,
  ModelBuilderChannel,
  calculateNormals,
} from '@gglib/graphics'
import { BoundingBox, BoundingSphere } from '@gglib/math'
import { Log, copy, append } from '@gglib/utils'

import {
  AccessorType,
  Document,
  DocumentReader,
  GLTF,
  KHR_materials_pbrSpecularGlossiness,
  KHR_materials_unlit,
  KHR_texture_transform,
  PbrMaterialSpecularGlossiness,
  TextureInfo,
  TextureTransform,
  MeshPrimitive,
  Scene,
  Mesh,
} from '../../formats/gltf'
import { PipelineContext } from '../../PipelineContext'
import { loader, resolveUri } from '../../utils'
import { ModelMeshOptions } from '@gglib/graphics/src/ModelMesh'

/**
 * @public
 */
export const loadGlbToGLTFDocument = loader({
  input: ['.glb', 'model/gltf-binary'],
  output: GLTF.Document,
  handle: async (_, context): Promise<Document> => {
    const data = await context.manager.downloadArrayBuffer(context.source)
    return GLTF.parseBinary(data.content)
  },
})

/**
 * @public
 */
export const loadGltfToGLTFDocument = loader({
  input: ['.gltf', 'model/gltf+json'],
  output: GLTF.Document,
  handle: async (_, context): Promise<Document> => {
    const data = await context.manager.downloadText(context.source)
    return GLTF.parse(data.content)
  },
})

/**
 * @public
 */
export const loadGltfDocumentToModleOptions = loader({
  input: GLTF.Document,
  output: Model.Options,
  handle: async (input: Document, context): Promise<ModelOptions> => {
    const reader = new DocumentReader(input, async (buffer) => {
      return (await context.manager.downloadArrayBuffer(resolveUri(buffer.uri, context))).content
    })
    const scene = input.scenes[input.scene || 0]
    return loadModel(context, reader, scene)
  },
})

async function loadMaterial(
  context: PipelineContext,
  reader: DocumentReader,
  materialIndex: number,
): Promise<MaterialOptions> {
  const material = (reader.doc.materials || [])[materialIndex] || {}

  const params = {}
  let effect = 'default'

  if (material.normalTexture != null) {
    params['NormalMap'] = await loadTexture(context, reader, material.normalTexture.index)
    readTextureTransforms(params, 'NormalMap', material.normalTexture)
  }
  if (material.occlusionTexture != null) {
    params['OcclusionMap'] = await loadTexture(context, reader, material.occlusionTexture.index)
    readTextureTransforms(params, 'OcclusionMap', material.occlusionTexture)
  }
  if (material.emissiveTexture != null) {
    params['EmissionMap'] = await loadTexture(context, reader, material.emissiveTexture.index)
    readTextureTransforms(params, 'EmissionMap', material.emissiveTexture)
  }
  if (material.emissiveFactor != null) {
    params['EmissionColor'] = material.emissiveFactor
  }
  if (material.alphaMode != null) {
    switch (material.alphaMode) {
      case 'BLEND':
        params['Blend'] = true
        break
      case 'MASK':
        if (material.alphaCutoff != null) {
          params['AlphaClip'] = material.alphaCutoff
        } else {
          params['AlphaClip'] = 0.5
        }
        break
      case 'OPAQUE':
        //
        break
    }
  }
  if (material.doubleSided) {
    params['DoubleSided'] = true
  }

  if (material.pbrMetallicRoughness) {
    effect = 'pbr'

    const pbr = material.pbrMetallicRoughness
    if (pbr.baseColorFactor != null) {
      params['DiffuseColor'] = pbr.baseColorFactor
    }
    if (pbr.baseColorTexture != null) {
      params['DiffuseMap'] = await loadTexture(context, reader, pbr.baseColorTexture.index)
      readTextureTransforms(params, 'DiffuseMap', pbr.baseColorTexture)
    }
    if (pbr.metallicFactor != null || pbr.roughnessFactor) {
      params['MetallicRoughness'] = [pbr.metallicFactor || 0, pbr.roughnessFactor || 0]
    }
    if (pbr.metallicRoughnessTexture != null) {
      params['MetallicRoughnessMap'] = await loadTexture(context, reader, pbr.metallicRoughnessTexture.index)
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
      params['DiffuseMap'] = await loadTexture(context, reader, gloss.diffuseTexture.index)
      readTextureTransforms(params, 'DiffuseMap', gloss.diffuseTexture)
    }
    if (gloss.specularFactor) {
      params['SpecularColor'] = gloss.specularFactor
    }
    if (gloss.glossinessFactor) {
      params['Glossiness'] = gloss.glossinessFactor
    }
    if (gloss.specularGlossinessTexture) {
      params['SpecularMap'] = await loadTexture(context, reader, gloss.specularGlossinessTexture.index)
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
    const offsetScale = [1, 1, 0, 0]
    if (transform.scale) {
      offsetScale[0] = transform.scale[0]
      offsetScale[1] = transform.scale[1]
    }
    if (transform.offset) {
      offsetScale[2] = transform.offset[0] || 0
      offsetScale[3] = transform.offset[1] || 0
    }
    if (transform.offset || transform.scale) {
      params[name + 'ScaleOffset'] = offsetScale
    }
  }
}

// async function loadSkin(context: PipelineContext, doc: Document, skinIndex: number): Promise<ModelSkin> {
//   const gltfSkin = doc.skins[skinIndex]
//   const hierarchy: ModelJoint[] = []
//   const bindPose: ModelJointPose[] = []
//   const nodes = gltfSkin.joints.map((it) => doc.nodes[it])

//   gltfSkin.joints.forEach((index) => {
//     const node = doc.nodes[index]
//     hierarchy.push({
//       name: node.name,
//       parent: nodes.findIndex((it) => it.children?.indexOf(index) >= 0),
//     })
//     const s = node.scale || [1, 1, 1]
//     const q = node.rotation || [0, 0, 0, 1]
//     const t = node.translation || [0, 0, 0]
//     // TODO: decompose node.matrix
//     bindPose.push({
//       scale: { x: s[0], y: s[1], z: s[2] },
//       rotation: { x: q[0], y: q[1], z: q[2], w: q[3] },
//       translation: { x: t[0], y: t[1], z: t[2] },
//     })
//   })

//   const result: ModelSkin = {
//     hierarchy: hierarchy,
//     bindPose: bindPose,
//   }

//   if (!gltfSkin.inverseBindMatrices) {
//     return result
//   }

//   const accessor = doc.accessors[gltfSkin.inverseBindMatrices]
//   if (accessor.type !== 'MAT4' || accessor.componentType !== AccessorComponentType.FLOAT) {
//     // TODO: warn?
//     return result
//   }

//   const bufferView = doc.bufferViews[accessor.bufferView]
//   const buffer = await loadBuffer(context, doc, bufferView.buffer)
//   const byteOffset = (accessor.byteOffset || 0) + (accessor.byteOffset || 0)

//   const inverseBindBuffer = new Float32Array(buffer, byteOffset, accessor.count * 16)
//   if (inverseBindBuffer instanceof Float32Array) {
//     const inverseBindMatrices = []
//     for (let i = 0; i < hierarchy.length * 16; i += 16) {
//       inverseBindMatrices.push(inverseBindBuffer.slice(i, i + 16))
//     }
//     result.inverseBindPose = inverseBindMatrices
//   }

//   return result
// }

// function loadMatrix(node: Node): Mat4Data {
//   if (node.matrix) {
//     return Mat4.createFromArray(node.matrix).toArray() as Mat4Data
//   } else {
//     const s = node.scale || [1, 1, 1]
//     const r = node.rotation || [0, 0, 0, 1]
//     const t = node.translation || [0, 0, 0]
//     return Mat4.createScale(s[0], s[1], s[2])
//       .rotateQuaternion(r[0], r[1], r[2], r[3])
//       .setTranslation(t[0], t[1], t[2])
//       .toArray() as Mat4Data
//   }
// }

async function loadAnimations(reader: DocumentReader): Promise<AnimationData[]> {
  const result: AnimationData[] = []

  for (const srcAnimation of reader.doc.animations || []) {
    const animation: AnimationData = {
      name: srcAnimation.name || null,
      type: 'channels',
      duration: null,
      channels: null,
    }

    const channels = new Map<number, AnimationDataChannels>()

    for (const srcChannel of srcAnimation.channels) {
      const target = srcChannel.target.node
      if (!channels.has(target)) {
        channels.set(target, { target: target })
      }
      const channel = channels.get(target)
      const path = srcChannel.target.path
      if (path in channel) {
        Log.w('channel samples ignored. It targets same path of same node as one of the previous channels.')
        continue
      }

      const srcSampler = srcAnimation.samplers[srcChannel.sampler]
      const accIn = await reader.loadAccessor(srcSampler.input)
      const accOut = await reader.loadAccessor(srcSampler.output)

      console.log(srcSampler, accIn, accOut)

      const interpolation = (srcSampler.interpolation?.toLocaleLowerCase() as any) || 'linear'
      const isCubic = interpolation === 'cubicspline'

      channel[path] = {
        interpolation: interpolation,
        samples: [],
      }

      for (let i = 0; i < accIn.attributeCount; i++) {
        const time = accIn.readComponent(i, 0)
        const i3 = i * 3
        switch (path) {
          case 'rotation':
            channel.rotation.samples = append(
              channel.rotation.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV4(i3 + 0),
                    value: accOut.readV4(i3 + 1),
                    to: accOut.readV4(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV4(i),
                  },
            )
            break
          case 'scale':
            channel.scale.samples = append(
              channel.scale.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV3(i3 + 0),
                    value: accOut.readV3(i3 + 1),
                    to: accOut.readV3(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV3(i),
                  },
            )
            break
          case 'translation':
            channel.translation.samples = append(
              channel.translation.samples,
              isCubic
                ? {
                    time: time,
                    ti: accOut.readV3(i3 + 0),
                    value: accOut.readV3(i3 + 1),
                    to: accOut.readV3(i3 + 2),
                  }
                : {
                    time: time,
                    value: accOut.readV3(i),
                  },
            )
            break
          case 'weights':
            // TODO:
            break
        }
      }
    }

    animation.channels = Array.from(channels.values())

    if (animation.channels.length) {
      result.push(animation)
    }
  }

  return result
}

async function loadModel(context: PipelineContext, reader: DocumentReader, scene: Scene): Promise<ModelOptions> {
  return {
    roots: [...scene.nodes],
    nodes: copy(true, reader.doc.nodes),
    animations: await loadAnimations(reader),
    meshes: await loadMeshes(context, reader),
  }
}

async function loadMeshes(context: PipelineContext, reader: DocumentReader): Promise<ModelMeshOptions[]> {
  const result: ModelMeshOptions[] = []
  for (const mesh of reader.doc.meshes) {
    const parts = await loadMeshParts(reader, mesh)
    const mtlMap = new Map<number | string, Promise<MaterialOptions>>()
    for (const part of parts) {
      if (!mtlMap.has(part.materialId)) {
        mtlMap.set(part.materialId, loadMaterial(context, reader, part.materialId as number))
      }
    }

    const materials = Array.from(mtlMap.entries())
    for (const part of parts) {
      part.materialId = materials.findIndex(([id]) => id === part.materialId)
    }

    result.push({
      name: mesh.name,
      materials: await Promise.all(materials.map(([, promise]) => promise)),
      parts: parts,
    })
  }

  return result
}

async function loadMeshParts(
  reader: DocumentReader,
  mesh: Mesh,
): Promise<ModelMeshPartOptions[]> {
  let min = [0, 0, 0]
  let max = [0, 0, 0]
  const doc = reader.doc
  const result = mesh.primitives.map(
    async (part): Promise<ModelMeshPartOptions> => {
      Object.keys(part.attributes).forEach(async (semantic) => {
        const accessor = doc.accessors[part.attributes[semantic]]
        if (semantic === 'POSITION') {
          min = [...accessor.min]
          max = [...accessor.max]
        }
      })

      const iBufferOptions = await loadIndexBuffer(reader, part)
      const vBufferOptions = await loadVertexBuffers(reader, part)

      return {
        boundingBox: [...min, ...max],
        boundingSphere: BoundingSphere.createFromBox(BoundingBox.create(...min, ...max)).toArray(),
        materialId: part.material,
        primitiveType: part.mode,
        indexBuffer: iBufferOptions,
        vertexBuffer: vBufferOptions,
      }
    },
  )

  return Promise.all(result)
}

async function loadIndexBuffer(reader: DocumentReader, part: MeshPrimitive): Promise<BufferOptions> {
  if (part.indices == null) {
    return null
  }
  const acc = await reader.loadAccessor(part.indices)
  return {
    data: acc.getDataWithoutOffset(),
    stride: acc.byteStride,
    dataType: acc.componentType as number,
  }
}

async function loadVertexBuffers(reader: DocumentReader, part: MeshPrimitive): Promise<BufferOptions[]> {

  const vbOptions: BufferOptions[] = []
  const bufferViewGroups = new Map<number, string[]>()
  const doc = reader.doc

  for (const attribute of Object.keys(part.attributes)) {
    const accessor = doc.accessors[part.attributes[attribute]]
    if (!bufferViewGroups.has(accessor.bufferView)) {
      bufferViewGroups.set(accessor.bufferView, [])
    }
    bufferViewGroups.get(accessor.bufferView).push(attribute)
  }

  for (const [bufferViewId, attributes] of Array.from(bufferViewGroups.entries())) {
    const bufferView = doc.bufferViews[bufferViewId]
    const buffer = await reader.loadBuffer(bufferView.buffer)

    const bufferOptions: BufferOptions = {
      stride: bufferView.byteStride,
      layout: {},
    }

    for (const attribute of attributes) {
      const accessor = doc.accessors[part.attributes[attribute]]
      const semantic = attribute
        .toLowerCase()
        .replace(/_0$/, '')
        .replace(/^texcoord/, 'texture')

      if (bufferOptions.dataType == null) {
        bufferOptions.dataType = accessor.componentType as number
      } else if (bufferOptions.dataType !== (accessor.componentType as number)) {
        console.warn(
          `interleaved buffer with different component types detected: ${nameOfDataType(
            bufferOptions.dataType as any,
          )}, ${nameOfDataType(accessor.componentType as any)}`,
        )
        if (dataTypeSize(accessor.componentType as any) > dataTypeSize(bufferOptions.dataType)) {
          bufferOptions.dataType = accessor.componentType as number
        }
      }

      bufferOptions.layout[semantic] = {
        type: accessor.componentType as number,
        elements: elementCount(accessor.type),
        normalize: accessor.normalized || false,
        offset: accessor.byteOffset || 0,
      }
    }

    const layoutStride = VertexLayout.countBytes(bufferOptions.layout)
    if (!bufferOptions.stride) {
      // tightly packed buffer
      bufferOptions.stride = layoutStride
    } else if (bufferOptions.stride !== layoutStride) {
      // interlaved buffer, sparse packed
    }

    if (!bufferOptions.data) {
      bufferOptions.data = new ArrayType[bufferOptions.dataType](
        buffer,
        bufferView.byteOffset || 0,
        bufferView.byteLength / dataTypeSize(bufferOptions.dataType),
      )
    }

    vbOptions.push(bufferOptions)
  }

  return vbOptions
}

async function loadTexture(context: PipelineContext, reader: DocumentReader, index: number) {
  return reader.loadTexture(index, async (texture, sampler, image) => {
    if (image.uri) {
      return context.manager.device.createTexture({
        data: resolveUri(image.uri, context),
        samplerParams: sampler
          ? {
              minFilter: sampler.minFilter,
              magFilter: sampler.magFilter,
              wrapU: sampler.wrapS,
              wrapV: sampler.wrapT,
            }
          : null,
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
  })
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

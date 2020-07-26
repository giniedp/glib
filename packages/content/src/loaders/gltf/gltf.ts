import { Model, ModelOptions } from '@gglib/graphics'

import { Document, DocumentReader, GLTF } from '../../formats/gltf'
import { loader, resolveUri } from '../../utils'
import { loadGltfModel } from './gltfModels'

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
    return loadGltfModel(context, reader, scene)
  },
})

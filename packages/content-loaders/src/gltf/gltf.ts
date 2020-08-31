import { Model, ModelOptions } from '@gglib/graphics'
import { loader, resolveUri, Loader } from '@gglib/content'

import { GLTFDocument, GLTF } from './format'
import { loadGltfModel } from './gltfModels'
import { GLTFReader } from './reader'

/**
 * @public
 */
export const loadGlbToGLTFDocument: Loader<string, GLTFDocument> = loader({
  input: ['.glb', 'model/gltf-binary'],
  output: GLTF.Document,
  handle: async (_, context): Promise<GLTFDocument> => {
    const data = await context.manager.downloadArrayBuffer(context.source)
    return GLTF.parseBinary(data.content)
  },
})

/**
 * @public
 */
export const loadGltfToGLTFDocument: Loader<string, GLTFDocument> = loader({
  input: ['.gltf', 'model/gltf+json'],
  output: GLTF.Document,
  handle: async (_, context): Promise<GLTFDocument> => {
    const data = await context.manager.downloadText(context.source)
    return GLTF.parse(data.content)
  },
})

/**
 * @public
 */
export const loadGltfDocumentToModleOptions: Loader<GLTFDocument, ModelOptions> = loader({
  input: GLTF.Document,
  output: Model.Options,
  handle: async (input: GLTFDocument, context): Promise<ModelOptions> => {
    const reader = new GLTFReader(input, async (buffer) => {
      return (await context.manager.downloadArrayBuffer(resolveUri(buffer.uri, context))).content
    })
    const scene = input.scenes[input.scene || 0]
    return loadGltfModel(context, reader, scene)
  },
})

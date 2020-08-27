import {
  ContentManager,
  Pipeline,
} from '@gglib/content'

import {
  loadMaterialOptionsToMaterial,
  loadMaterialOptionsToMaterialArray,
  loadModelOptionsToModel,
  loadShaderEffectOptionsToShaderEffect,
  loadShaderEffectOptionsToShaderEffectArray,
  loadGgfxToShaderEffectOptions,
  loadGlbToGLTFDocument,
  loadGltfDocumentToModleOptions,
  loadGltfToGLTFDocument,
} from '../index'

import { DeviceGL, Model, Material, MaterialOptions, ShaderEffect } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test'

describe('content/loaders/gltf', () => {
  afterAll(clearScripts)
  beforeAll(() => {
    device = new DeviceGL()
    manager = new ContentManager(device)

    defineScript('default.ggfx', 'application/x-yaml', `
name: effect name
program:
// comment
technique:
  name: technique name
  pass:
    name: pass name
    vertexShader:
      void main(void) {
        gl_Position = vec4(0, 0, 0, 0);
      }
    fragmentShader:
      void main(void) {
        gl_FragColor = vec4(0, 0, 0, 2);
      }
    `)
  })

  let device: DeviceGL
  let manager: ContentManager
  beforeEach(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      pipeline: new Pipeline(),
    })

    manager.pipeline.register(loadGlbToGLTFDocument)
    manager.pipeline.register(loadGltfToGLTFDocument)
    manager.pipeline.register(loadGltfDocumentToModleOptions)
    manager.pipeline.register(loadModelOptionsToModel)
    manager.pipeline.register(loadMaterialOptionsToMaterial)
    manager.pipeline.register(loadMaterialOptionsToMaterialArray)
    manager.pipeline.register(loadGgfxToShaderEffectOptions)
    manager.pipeline.register(loadShaderEffectOptionsToShaderEffect)
    manager.pipeline.register({
      input: Material.OptionsTechnique,
      output: Material.Options,
      handle: async (input: MaterialOptions, context) => {
        if (!input?.technique) {
          return null
        }
        return {
          ...input,
          effect: await context.manager.load('default.ggfx', ShaderEffect.Options)
        }
      }
    })
  })

  describe('/assets/logo/gglib.glb', () => {
    it('loads', async () => {
      const result = await manager.load('/assets/logo/gglib.glb', Model.Options)
      expect(result.meshes.length).toBe(1)
      expect(result.meshes[0].parts.length).toBe(3)
      expect(result.meshes[0].materials.length).toBe(3)
    })
  })

  describe('/assets/logo/gglib.gltf', () => {
    it('loads', async () => {
      const result = await manager.load('/assets/logo/gglib.gltf', Model.Options)
      expect(result.meshes.length).toBe(1)
      expect(result.meshes[0].parts.length).toBe(3)
      expect(result.meshes[0].materials.length).toBe(3)
    })
  })
})

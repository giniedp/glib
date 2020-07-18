import {
  ContentManager,
  loadGgfxToShaderEffectOptions,
  loadGlbToGLTFDocument,
  loadGltfDocumentToModleOptions,
  loadGltfToGLTFDocument,
  loadMaterialOptionsToMaterial,
  loadMaterialOptionsToMaterialArray,
  loadModelOptionsToModel,
  loadShaderEffectOptionsToShaderEffect,
  loadShaderEffectOptionsToShaderEffectArray,
  Pipeline,
} from '@gglib/content'
import { DeviceGL, Model } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test/utils.spec'

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
      loader: new Pipeline(),
    })

    manager.loader.register(loadGlbToGLTFDocument)
    manager.loader.register(loadGltfToGLTFDocument)
    manager.loader.register(loadGltfDocumentToModleOptions)
    manager.loader.register(loadModelOptionsToModel)
    manager.loader.register(loadMaterialOptionsToMaterial)
    manager.loader.register(loadMaterialOptionsToMaterialArray)
    manager.loader.register(loadGgfxToShaderEffectOptions)
    manager.loader.register(loadShaderEffectOptionsToShaderEffect)
    manager.loader.register(loadShaderEffectOptionsToShaderEffectArray)

    manager.rewriteUrl = (url) => {
      if (url.match(/assets\/models\/gltf\/pbr/)) {
        return '/default.ggfx'
      }
      return url
    }
  })

  describe('assets/models/gltf/box.gltf', () => {
    it('loads', (done) => {
      manager.load('/assets/models/gltf/box.gltf', Model).then((model) => {
        expect(model.meshes.length).toBe(1)
        expect(model.meshes[0].parts.length).toBe(1)
        expect(model.meshes[0].materials.length).toBe(1)
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('assets/models/gltf/box-binary.glb', () => {
    it('loads', (done) => {
      manager.load('assets/models/gltf/box-binary.glb', Model).then((model) => {
        expect(model.meshes.length).toBe(1)
        expect(model.meshes[0].parts.length).toBe(1)
        expect(model.meshes[0].materials.length).toBe(1)
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('assets/models/gltf/box-embedded.gltf', () => {
    it('loads', (done) => {
      manager.load('assets/models/gltf/box-embedded.gltf', Model).then((model) => {
        expect(model.meshes.length).toBe(1)
        expect(model.meshes[0].parts.length).toBe(1)
        expect(model.meshes[0].materials.length).toBe(1)
      })
      .catch(fail)
      .then(done)
    })
  })
})

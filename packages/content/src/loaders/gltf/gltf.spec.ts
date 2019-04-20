import { loaders, Manager, Pipeline } from '@gglib/content'
import { Device, Model } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test/utils.spec'

describe('content/loaders/gltf', () => {
  afterAll(clearScripts)
  beforeAll(() => {
    device = new Device()
    manager = new Manager(device)

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

  let device: Device
  let manager: Manager
  beforeEach(() => {
    device = new Device()
    manager = new Manager(device, {
      loader: new Pipeline(),
    })

    manager.loader.register(loaders.glbToGLTFDocument)
    manager.loader.register(loaders.gltfToGLTFDocument)
    manager.loader.register(loaders.gltfDocumentToModleOptions)
    manager.loader.register(loaders.modelOptionsToModel)
    manager.loader.register(loaders.materialOptionsToMaterial)
    manager.loader.register(loaders.materialOptionsToMaterialArray)
    manager.loader.register(loaders.ggfxToShaderEffectOptions)
    manager.loader.register(loaders.shaderEffectOptionsToShaderEffect)
    manager.loader.register(loaders.shaderEffectOptionsToShaderEffectArray)

    manager.rewriteUrl = (url) => {
      if (url.match(/assets\/gltf\/pbr/)) {
        return '/default.ggfx'
      }
      return url
    }
  })

  describe('assets/gltf/box.gltf', () => {
    it('loads', (done) => {
      manager.load('/assets/gltf/box.gltf', Model).then((model) => {
        expect(model.meshes.length).toBe(1)
        expect(model.materials.length).toBe(1)
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('assets/gltf/box-binary.glb', () => {
    it('loads', (done) => {
      manager.load('assets/gltf/box-binary.glb', Model).then((model) => {
        expect(model.meshes.length).toBe(1)
        expect(model.materials.length).toBe(1)
      })
      .catch(fail)
      .then(done)
    })
  })

  describe('assets/gltf/box-embedded.gltf', () => {
    it('loads', (done) => {
      manager.load('assets/gltf/box-embedded.gltf', Model).then((model) => {
        expect(model.meshes.length).toBe(1)
        expect(model.materials.length).toBe(1)
      })
      .catch(fail)
      .then(done)
    })
  })
})

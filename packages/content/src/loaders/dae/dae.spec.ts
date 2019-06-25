import {
  ContentManager,
  loadColladaDocumentToModelOptions,
  loadDaeToColladaDocument,
  loadGgfxToShaderEffectOptions,
  loadMaterialOptionsToMaterial,
  loadMaterialOptionsToMaterialArray,
  loadModelOptionsToModel,
  loadShaderEffectOptionsToShaderEffect,
  loadShaderEffectOptionsToShaderEffectArray,
  Pipeline,
} from '@gglib/content'
import { Device, Model } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test/utils.spec'

describe('content/loaders/dae', () => {
  afterAll(clearScripts)
  beforeAll(() => {
    device = new Device()
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

  let device: Device
  let manager: ContentManager
  beforeEach(() => {
    device = new Device()
    manager = new ContentManager(device, {
      loader: new Pipeline(),
    })

    manager.loader.register(loadDaeToColladaDocument)
    manager.loader.register(loadColladaDocumentToModelOptions)
    manager.loader.register(loadModelOptionsToModel)
    manager.loader.register(loadMaterialOptionsToMaterial)
    manager.loader.register(loadMaterialOptionsToMaterialArray)
    manager.loader.register(loadGgfxToShaderEffectOptions)
    manager.loader.register(loadShaderEffectOptionsToShaderEffect)
    manager.loader.register(loadShaderEffectOptionsToShaderEffectArray)

    manager.rewriteUrl = (url) => {
      switch (url) {
        case '/assets/dae/default':
          return '/default.ggfx'
        case '/assets/dae/lambert':
          return '/default.ggfx'
        default:
          return url
      }
    }
  })

  describe('assets/dae/cube.dae', () => {
    it('loads', (done) => {
      manager.load('/assets/dae/cubes.dae', Model).then((model) => {
        expect(model.meshes.length).toBe(9)
        expect(model.materials.length).toBe(3)
      })
      .catch(fail)
      .then(done)
    })
  })
})

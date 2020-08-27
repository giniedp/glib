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
  loadColladaDocumentToModelOptions,
  loadDaeToColladaDocument,
} from '../index'
import { DeviceGL, Model } from '@gglib/graphics'
import { clearScripts } from '../test'

describe('content/loaders/dae', () => {
  afterAll(clearScripts)
  beforeAll(() => {
    device = new DeviceGL()
    manager = new ContentManager(device)
  })

  let device: DeviceGL
  let manager: ContentManager
  beforeEach(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      pipeline: new Pipeline(),
    })

    manager.pipeline.register(loadDaeToColladaDocument)
    manager.pipeline.register(loadColladaDocumentToModelOptions)
    manager.pipeline.register(loadModelOptionsToModel)
    manager.pipeline.register(loadMaterialOptionsToMaterial)
    manager.pipeline.register(loadMaterialOptionsToMaterialArray)
    manager.pipeline.register(loadGgfxToShaderEffectOptions)
    manager.pipeline.register(loadShaderEffectOptionsToShaderEffect)
    manager.pipeline.register(loadShaderEffectOptionsToShaderEffectArray)
  })

  describe('assets/dae/cube.dae', () => {
    it('loads ModelOptions', async () => {
      const result = await manager.load('/assets/models/dae/cubes.dae', Model.Options)
      expect(result.meshes.length).toBe(1)
      expect(result.meshes[0].parts.length).toBe(9)
      expect(result.meshes[0].materials.length).toBe(3)
    })
  })
})

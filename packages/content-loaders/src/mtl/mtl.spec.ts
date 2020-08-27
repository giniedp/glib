import { ContentManager, Pipeline } from '@gglib/content'
import { DeviceGL, Material } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test'
import { loadMtlToMaterialOptions, loadMtlToMaterialOptionsArray } from './mtl'

describe('content loader mtl', () => {

  let device: DeviceGL
  let manager: ContentManager

  afterAll(clearScripts)
  beforeAll(() => {
    device = new DeviceGL()
    manager = new ContentManager(device, {
      loader: new Pipeline()
    })
    manager.loader.register(loadMtlToMaterialOptions)
    manager.loader.register(loadMtlToMaterialOptionsArray)

    defineScript('material.mtl', 'application/x-mtl', `
# some comment
newmtl material name
Ka 1 2 3
map_Ka texture.png
d 0.1
Ns 16
    `)
  })
  describe('mtlMaterial', () => {
    it('loads .mtl to MaterialOptions', async () => {
      const result = await manager.load('material.mtl', Material.Options)
      expect(result).toBeDefined()
      expect(result.name).toBe('material name')
      expect(result.technique).toBe('default')
      expect(result.parameters.AmbientColor).toEqual([1, 2, 3])
    })
  })
})

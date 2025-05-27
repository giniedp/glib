import { ContentLoader } from '@gglib/content'
import { DeviceGL } from '@gglib/graphics'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { clearScripts, defineScript } from '../test'
import { MTLLoader } from './MTLLoader'

describe('content loader mtl', () => {
  let device: DeviceGL
  let content: ContentLoader

  afterAll(clearScripts)
  beforeAll(() => {
    device = new DeviceGL()
    content = new ContentLoader(device)
    content.registerLoader({
      extensions: MTLLoader.extensions,
      mimeTypes: MTLLoader.mimeTypes,
      loader: MTLLoader,
    })

    defineScript(
      'material.mtl',
      'application/x-mtl',
      `
# some comment
newmtl material name
Ka 1 2 3
map_Ka texture.png
d 0.1
Ns 16
    `,
    )
  })
  describe('mtlMaterial', () => {
    it('loads .mtl to MaterialOptions', async () => {
      const result = await content.loadAsset('material.mtl')
      expect(result).toBeDefined()
      expect(result.materials).toHaveLength(1)
      expect(result.materials[0].name).toBe('material name')
      expect(result.materials[0].parameters.AmbientColor).toEqual([1, 2, 3])
    })
  })
})

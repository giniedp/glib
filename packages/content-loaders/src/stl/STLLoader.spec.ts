import { DeviceGL, GeometryOptions, MaterialOptions, Model } from '@gglib/graphics'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { clearScripts, defineScript } from '../test'

import { ContentLoader } from '@gglib/content'
import '../gglib'
import { STLLoader } from './STLLoader'

describe('content loader stl', () => {
  let device: DeviceGL
  let content: ContentLoader

  afterAll(clearScripts)
  beforeAll(() => {
    device = new DeviceGL()
    content = new ContentLoader(device)
    content.registerLoader({
      extensions: STLLoader.extensions,
      mimeTypes: STLLoader.mimeTypes,
      loader: STLLoader,
    })

    defineScript(
      'model.stl',
      'text/plain',
      `
solid cube
  facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 0 1 0
      vertex 1 1 0
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 1 1 0
      vertex 1 0 0
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 0 0 1
      vertex 0 1 1
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 0 1 1
      vertex 0 1 0
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 1 0 1
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 0 0
      vertex 1 0 1
      vertex 0 0 1
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 0 1
      vertex 1 0 1
      vertex 1 1 1
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 0 1
      vertex 1 1 1
      vertex 0 1 1
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 1 0 0
      vertex 1 1 0
      vertex 1 1 1
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 1 0 0
      vertex 1 1 1
      vertex 1 0 1
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 1 0
      vertex 0 1 1
      vertex 1 1 1
    endloop
  endfacet
  facet normal 0 0 0
    outer loop
      vertex 0 1 0
      vertex 1 1 1
      vertex 1 1 0
    endloop
  endfacet
endsolid cube
    `.trim(),
    )
  })

  describe('stlModel', () => {
    it('loads from DOM', async () => {
      const result = await content.loadAsset('model.stl', Model.Options)
      expect(result).toBeDefined()
      expect(result.meshes.length).toBe(1)

      const mesh = result.meshes[0]
      expect(mesh.materials.length).toBe(1)
      expect(mesh.parts.length).toBe(1)
      expect(mesh.name).toBeFalsy()

      const material = mesh.materials[0] as MaterialOptions
      expect(material).toEqual({
        technique: 'default',
        parameters: {
          DiffuseColor: [1, 1, 1],
          SpecularColor: [1, 1, 1],
          SpecularPower: 16,
        },
      })

      const meshPart = mesh.parts[0] as GeometryOptions
      expect(meshPart.materialId).toBe(0)
      expect(meshPart.name).toBe('cube')
    })

    it('loads logo model', async () => {
      await content.loadAsset('/assets/logo/gglib.stl', Model.Options)
    })

    it('loads logo binary model', async () => {
      await content.loadAsset('/assets/logo/gglib-binary.stl', Model.Options)
    })
  })
})

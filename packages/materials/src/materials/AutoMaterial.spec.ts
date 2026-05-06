import { createDevice, Device } from '@gglib/graphics'
import { Mat3, Mat4 } from '@gglib/math'
import { beforeEach, describe, expect, it } from 'vitest'
import { AutoMaterial } from './AutoMaterial'

describe('AutoMaterial', () => {
  let device: Device
  let material: AutoMaterial

  beforeEach(() => {
    device = createDevice({})
    material = new AutoMaterial(device, {
      properties: {},
    })
    expect(material.needsUpdate).toBe(true)
    material.needsUpdate = false
  })

  const tests = [
    {
      param: 'Alpha',
      sequence: [
        { value: 0.5, needsUpdate: true },
        { value: 0.6, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: 0.5, expect: ['SHADE_FUNCTION', 'ALPHA'] },
      ],
    },
    {
      param: 'AlphaClip',
      sequence: [
        { value: 0.5, needsUpdate: true },
        { value: 0.6, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: 0.5, expect: ['SHADE_FUNCTION', 'ALPHA_CLIP'] },
      ],
    },

    {
      param: 'AmbientColor',
      sequence: [
        { value: [0, 0, 0], needsUpdate: true },
        { value: [1, 0, 0], needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'AMBIENT_COLOR'] },
      ],
    },

    {
      param: 'AmbientColorMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'AMBIENT_COLOR_MAP'] },
      ],
    },

    {
      param: 'AmbientColorMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'AMBIENT_COLOR_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'BaseColor',
      sequence: [
        { value: [0, 0, 0], needsUpdate: true },
        { value: [1, 0, 0], needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'BASE_COLOR'] },
      ],
    },

    {
      param: 'BaseColorMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'BASE_COLOR_MAP'] },
      ],
    },

    {
      param: 'BaseColorMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'BASE_COLOR_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'SpecularColor',
      sequence: [
        { value: [0, 0, 0], needsUpdate: true },
        { value: [1, 0, 0], needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'SPECULAR_COLOR'] },
      ],
    },

    {
      param: 'SpecularColorMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'SPECULAR_COLOR_MAP'] },
      ],
    },

    {
      param: 'SpecularColorMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'SPECULAR_COLOR_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'EmissiveColor',
      sequence: [
        { value: [0, 0, 0], needsUpdate: true },
        { value: [1, 0, 0], needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'EMISSIVE_COLOR'] },
      ],
    },

    {
      param: 'EmissiveColorMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'EMISSIVE_COLOR_MAP'] },
      ],
    },

    {
      param: 'EmissiveColorMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'EMISSIVE_COLOR_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'NormalMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'NORMAL_MAP'] },
      ],
    },

    {
      param: 'NormalMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'NORMAL_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'OcclusionMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'OCCLUSION_MAP'] },
      ],
    },

    {
      param: 'OcclusionMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'OCCLUSION_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'ParallaxMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'PARALLAX_MAP'] },
      ],
    },

    {
      param: 'ParallaxMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'PARALLAX_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'MetallicRoughnessMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'METALLIC_ROUGHNESS_MAP'] },
      ],
    },

    {
      param: 'MetallicRoughnessMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'METALLIC_ROUGHNESS_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'SmoothnessMap',
      sequence: [
        { value: {}, needsUpdate: true },
        { value: {}, needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: [0, 0, 0], expect: ['SHADE_FUNCTION', 'SMOOTHNESS_MAP'] },
      ],
    },

    {
      param: 'SmoothnessMapTransform',
      sequence: [
        { value: Mat3.createIdentity(), needsUpdate: true },
        { value: Mat3.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: true },
      ],
      defines: [
        { value: null, expect: ['SHADE_FUNCTION'] },
        { value: Mat3.createIdentity(), expect: ['SHADE_FUNCTION', 'SMOOTHNESS_MAP_TRANSFORM'] },
      ],
    },

    {
      param: 'World',
      sequence: [
        { value: null, needsUpdate: false },
        { value: Mat4.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: false },
      ],
      defines: [{ value: null, expect: ['SHADE_FUNCTION'] }],
    },

    {
      param: 'View',
      sequence: [
        { value: null, needsUpdate: false },
        { value: Mat4.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: false },
      ],
      defines: [{ value: null, expect: ['SHADE_FUNCTION'] }],
    },

    {
      param: 'Projection',
      sequence: [
        { value: null, needsUpdate: false },
        { value: Mat4.createIdentity(), needsUpdate: false },
        { value: null, needsUpdate: false },
      ],
      defines: [{ value: null, expect: ['SHADE_FUNCTION'] }],
    },
  ]

  describe.each(tests)('Parameter $param', (test) => {
    it('exists', () => {
      expect(test.param in material).toBe(true)
    })

    it('marks for update', () => {
      expect(material[test.param]).toBeUndefined()
      for (const item of test.sequence) {
        material.needsUpdate = false
        material[test.param] = item.value
        expect(material[test.param]).toEqual(item.value)
        expect(material.needsUpdate, `case ${item.value}`).toEqual(item.needsUpdate)
      }
    })

    it('defines directive', () => {
      for (const item of test.defines) {
        const defines = {}
        material[test.param] = item.value
        material.updateDefines(defines)
        expect(Object.keys(defines).sort()).toEqual(item.expect.sort())
      }
    })
  })
})

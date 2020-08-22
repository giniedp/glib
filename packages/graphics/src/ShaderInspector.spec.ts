import { ShaderInspector } from './index'
import { ProgramInspection } from './ShaderInspector'

describe('ShaderInspector', () => {
  describe('glsl 3', () => {
    let inspection: ProgramInspection
    beforeEach(() => {
      inspection = ShaderInspector.inspectProgram(
        `
    precision highp float;
    precision highp int;

    // @binding vec4Uniform
    uniform vec4 uVec4Uniform;

    // @binding vec3Uniform
    uniform vec3 uVec3Uniform;

    // @binding vec2Uniform
    uniform vec2 uVec2Uniform;

    // @binding floatUniform
    uniform float uFloatUniform;


    // @binding vec4Attribute
    attribute vec4 vVec4Attribute;

    // @binding vec3Attribute
    attribute vec3 vVec3Attribute;

    // @binding vec2Attribute
    attribute vec2 vVec2Attribute;

    // @binding floatAttribute
    attribute float vFloatAttribute;

    `,
        `
    precision highp float;
    precision highp int;

    uniform sampler2D tex1;

    uniform sampler2D tex2;

    // @register 0
    uniform sampler2D tex3;

    uniform sampler2D tex4;

    varying vec2 texCoord;
    varying vec4 texColor;

    `,
      )
    })

    it('inspects attributes', () => {
      expect(inspection.inputs.vec4Attribute).toEqual({
        binding: 'vec4Attribute',
        name: 'vVec4Attribute',
        type: 'vec4',
        layout: null,
      })

      expect(inspection.inputs.vec3Attribute).toEqual({
        binding: 'vec3Attribute',
        name: 'vVec3Attribute',
        type: 'vec3',
        layout: null,
      })

      expect(inspection.inputs.vec2Attribute).toEqual({
        binding: 'vec2Attribute',
        name: 'vVec2Attribute',
        type: 'vec2',
        layout: null,
      })

      expect(inspection.inputs.floatAttribute).toEqual({
        binding: 'floatAttribute',
        name: 'vFloatAttribute',
        type: 'float',
        layout: null,
      })
    })

    it('inspects uniforms', () => {
      expect(inspection.uniforms.vec4Uniform).toEqual({
        binding: 'vec4Uniform',
        name: 'uVec4Uniform',
        type: 'vec4',
        layout: null,
      })

      expect(inspection.uniforms.vec3Uniform).toEqual({
        binding: 'vec3Uniform',
        name: 'uVec3Uniform',
        type: 'vec3',
        layout: null,
      })

      expect(inspection.uniforms.vec2Uniform).toEqual({
        binding: 'vec2Uniform',
        name: 'uVec2Uniform',
        type: 'vec2',
        layout: null,
      })

      expect(inspection.uniforms.floatUniform).toEqual({
        binding: 'floatUniform',
        name: 'uFloatUniform',
        type: 'float',
        layout: null,
      })

      expect(inspection.uniforms.floatUniform).toEqual({
        binding: 'floatUniform',
        name: 'uFloatUniform',
        type: 'float',
        layout: null,
      })

      expect(inspection.uniforms.tex1).toEqual({
        name: 'tex1',
        type: 'sampler2D',
        register: 1,
        layout: null,
      })

      expect(inspection.uniforms.tex2).toEqual({
        name: 'tex2',
        type: 'sampler2D',
        register: 2,
        layout: null,
      })

      expect(inspection.uniforms.tex3).toEqual({
        name: 'tex3',
        type: 'sampler2D',
        register: 0,
        layout: null,
      })

      expect(inspection.uniforms.tex4).toEqual({
        name: 'tex4',
        type: 'sampler2D',
        register: 3,
        layout: null,
      })
    })
  })
})

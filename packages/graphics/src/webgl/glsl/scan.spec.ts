import { glsl } from '../../utils'
import { GlslScanResult, scan } from './scan'

fdescribe('Glsl.scan', () => {

  describe('variables', () => {
    function testVariable(type: string) {
      const name = `u${type.toUpperCase()}`
      const result = scan(`
        // some comment
        // @binding myBindingName
        uniform ${type} ${name};
      `)
      expect(result.variables[name]).toEqual({
        type: type,
        name: name,
        size: null,
        comment: `some comment\n@binding myBindingName`,
        qualifier: { uniform: true },
      })
    }

    function testVariableArray(type: string) {
      const name = `u${type.toUpperCase()}`
      const result = scan(`
        // some comment
        // @binding myBindingName
        uniform ${type} ${name}[2];
      `)
      expect(result.variables[name]).toEqual({
        type: type,
        name: name,
        size: 2,
        comment: `some comment\n@binding myBindingName`,
        qualifier: { uniform: true },
      })
    }

    describe('bool', () => {
      it('plain', () => testVariable('bool'))
      it('array', () => testVariableArray('bool'))
    })
    describe('int', () => {
      it('plain', () => testVariable('int'))
      it('array', () => testVariableArray('int'))
    })
    describe('uint', () => {
      it('plain', () => testVariable('uint'))
      it('array', () => testVariableArray('uint'))
    })
    describe('float', () => {
      it('plain', () => testVariable('float'))
      it('array', () => testVariableArray('float'))
    })
    describe('double', () => {
      it('plain', () => testVariable('double'))
      it('array', () => testVariableArray('double'))
    })
    describe('half', () => {
      it('plain', () => testVariable('half'))
      it('array', () => testVariableArray('half'))
    })
    describe('long', () => {
      it('plain', () => testVariable('long'))
      it('array', () => testVariableArray('long'))
    })
    describe('short', () => {
      it('plain', () => testVariable('short'))
      it('array', () => testVariableArray('short'))
    })
    describe('bvec2', () => {
      it('plain', () => testVariable('bvec2'))
      it('array', () => testVariableArray('bvec2'))
    })
    describe('bvec3', () => {
      it('plain', () => testVariable('bvec3'))
      it('array', () => testVariableArray('bvec3'))
    })
    describe('bvec4', () => {
      it('plain', () => testVariable('bvec4'))
      it('array', () => testVariableArray('bvec4'))
    })
    describe('dvec2', () => {
      it('plain', () => testVariable('dvec2'))
      it('array', () => testVariableArray('dvec2'))
    })
    describe('dvec3', () => {
      it('plain', () => testVariable('dvec3'))
      it('array', () => testVariableArray('dvec3'))
    })
    describe('dvec4', () => {
      it('plain', () => testVariable('dvec4'))
      it('array', () => testVariableArray('dvec4'))
    })
    describe('fvec2', () => {
      it('plain', () => testVariable('fvec2'))
      it('array', () => testVariableArray('fvec2'))
    })
    describe('fvec3', () => {
      it('plain', () => testVariable('fvec3'))
      it('array', () => testVariableArray('fvec3'))
    })
    describe('fvec4', () => {
      it('plain', () => testVariable('fvec4'))
      it('array', () => testVariableArray('fvec4'))
    })
    describe('hvec2', () => {
      it('plain', () => testVariable('hvec2'))
      it('array', () => testVariableArray('hvec2'))
    })
    describe('hvec3', () => {
      it('plain', () => testVariable('hvec3'))
      it('array', () => testVariableArray('hvec3'))
    })
    describe('hvec4', () => {
      it('plain', () => testVariable('hvec4'))
      it('array', () => testVariableArray('hvec4'))
    })
    describe('ivec2', () => {
      it('plain', () => testVariable('ivec2'))
      it('array', () => testVariableArray('ivec2'))
    })
    describe('ivec3', () => {
      it('plain', () => testVariable('ivec3'))
      it('array', () => testVariableArray('ivec3'))
    })
    describe('ivec4', () => {
      it('plain', () => testVariable('ivec4'))
      it('array', () => testVariableArray('ivec4'))
    })
    describe('uvec2', () => {
      it('plain', () => testVariable('uvec2'))
      it('array', () => testVariableArray('uvec2'))
    })
    describe('uvec3', () => {
      it('plain', () => testVariable('uvec3'))
      it('array', () => testVariableArray('uvec3'))
    })
    describe('uvec4', () => {
      it('plain', () => testVariable('uvec4'))
      it('array', () => testVariableArray('uvec4'))
    })
    describe('vec2', () => {
      it('plain', () => testVariable('vec2'))
      it('array', () => testVariableArray('vec2'))
    })
    describe('vec3', () => {
      it('plain', () => testVariable('vec3'))
      it('array', () => testVariableArray('vec3'))
    })
    describe('vec4', () => {
      it('plain', () => testVariable('vec4'))
      it('array', () => testVariableArray('vec4'))
    })
    describe('mat2', () => {
      it('plain', () => testVariable('mat2'))
      it('array', () => testVariableArray('mat2'))
    })
    describe('mat2x2', () => {
      it('plain', () => testVariable('mat2x2'))
      it('array', () => testVariableArray('mat2x2'))
    })
    describe('mat2x3', () => {
      it('plain', () => testVariable('mat2x3'))
      it('array', () => testVariableArray('mat2x3'))
    })
    describe('mat2x4', () => {
      it('plain', () => testVariable('mat2x4'))
      it('array', () => testVariableArray('mat2x4'))
    })
    describe('mat3', () => {
      it('plain', () => testVariable('mat3'))
      it('array', () => testVariableArray('mat3'))
    })
    describe('mat3x2', () => {
      it('plain', () => testVariable('mat3x2'))
      it('array', () => testVariableArray('mat3x2'))
    })
    describe('mat3x3', () => {
      it('plain', () => testVariable('mat3x3'))
      it('array', () => testVariableArray('mat3x3'))
    })
    describe('mat3x4', () => {
      it('plain', () => testVariable('mat3x4'))
      it('array', () => testVariableArray('mat3x4'))
    })
    describe('mat4', () => {
      it('plain', () => testVariable('mat4'))
      it('array', () => testVariableArray('mat4'))
    })
    describe('mat4x2', () => {
      it('plain', () => testVariable('mat4x2'))
      it('array', () => testVariableArray('mat4x2'))
    })
    describe('mat4x3', () => {
      it('plain', () => testVariable('mat4x3'))
      it('array', () => testVariableArray('mat4x3'))
    })
    describe('mat4x4', () => {
      it('plain', () => testVariable('mat4x4'))
      it('array', () => testVariableArray('mat4x4'))
    })

    fdescribe('interface', () => {
      const shader = glsl`
        #version 300 es

        uniform perScene {
          vec4 color1;
          vec4 color2;
        };

        uniform perModel {
          vec4 color3;
        };

        uniform {
          vec4 color4;
        };

        in vec3 a_position;
        out vec3 v_color;

        void main() {
          gl_Position = vec4(a_position, 1.0);
          v_color = color1.rgb + color2.rgb + color3.rgb;
        }
      `
      it('test', () => {
        const data = scan(shader)
        expect(Object.keys(data.interfaces)).toEqual(['perScene', 'perModel'])
        expect(Object.keys(data.variables)).not.toContain('color1')
        expect(Object.keys(data.variables)).toContain('color4')
      })
    })
  })


  describe('structs', () => {
    let data: GlslScanResult
    beforeEach(() => {
      data = scan(glsl`
        struct Ray {
          vec3 origin;
          vec3 dir;
        };

        uniform struct Material {
          vec3 color;
        } material;

        struct LightParams {
          vec4 Color;
          vec4 Position;
          vec4 Direction;
        };
        // @binding Lights
        uniform LightParams uLights;
      `)
    })

    it('detects structs', () => {
      expect(data.structs.Ray).toEqual({
        comment: null,
        members: [
          {
            type: 'vec3',
            comment: null,
            name: 'origin',
            qualifier: {},
            size: null,
          },
          {
            type: 'vec3',
            comment: null,
            name: 'dir',
            qualifier: {},
            size: null,
          },
        ],
        name: 'Ray',
      })

      expect(data.structs.Material).toEqual({
        comment: null,
        members: [
          {
            type: 'vec3',
            comment: null,
            name: 'color',
            qualifier: {},
            size: null,
          },
        ],
        name: 'Material',
      })

      expect(data.variables.material).toEqual({
        type: 'Material',
        name: 'material',
        size: null,
        comment: null,
        qualifier: { uniform: true },
      })

      expect(data.structs.LightParams).toEqual({
        comment: null,
        members: [
          {
            type: 'vec4',
            comment: null,
            name: 'Color',
            qualifier: {},
            size: null,
          },
          {
            type: 'vec4',
            comment: null,
            name: 'Position',
            qualifier: {},
            size: null,
          },
          {
            type: 'vec4',
            comment: null,
            name: 'Direction',
            qualifier: {},
            size: null,
          },
        ],
        name: 'LightParams',
      })

      expect(data.variables.uLights).toEqual({
        type: 'LightParams',
        name: 'uLights',
        size: null,
        comment: '@binding Lights',
        qualifier: { uniform: true },
      })
    })
  })
})


import { glsl } from "../../utils"
import { inspect, inspectProgram } from "./inspect"
import { Keywords } from "./keywords"

describe('ShaderInspector', () => {
  describe('uniforms', () => {
    describe('simple types', () => {
      const tests = Array.from(Keywords.simpleTypes.values()).map((type) => {
        return {
          name: `uniform ${type}`,
          shader: `
            // @binding ${type}Uniform
            uniform ${type} u${type.toUpperCase()};
          `,
          expect: {
            binding: `${type}Uniform`,
            name: `u${type.toUpperCase()}`,
            type: type,
            layout: null,
          },
        }
      })

      describe('vertex shader', () => {
        for (const test of tests) {
          it(test.name, () => {
            const data = inspectProgram(test.shader, '')
            expect(Object.keys(data.uniforms)).toContain(test.expect.name)
            expect(data.uniforms[test.expect.name]).toEqual(test.expect)
          })
        }
      })

      describe('fragment shader', () => {
        for (const test of tests) {
          it(test.name, () => {
            const data = inspectProgram('', test.shader)
            expect(Object.keys(data.uniforms)).toContain(test.expect.name)
            expect(data.uniforms[test.expect.name]).toEqual(test.expect)
          })
        }
      })
    })

    describe('sampler', () => {
      const shader = glsl`
        uniform sampler2D tex1;
        uniform sampler2D tex2;

        // @register 0
        uniform sampler2D tex3;
        uniform sampler2D tex4;
      `
      it('has register', () => {
        const data = inspectProgram(shader, '')

        expect(data.uniforms.tex1).toEqual({
          name: 'tex1',
          type: 'sampler2D',
          register: 1,
          layout: null,
        })

        expect(data.uniforms.tex2).toEqual({
          name: 'tex2',
          type: 'sampler2D',
          register: 2,
          layout: null,
        })

        expect(data.uniforms.tex3).toEqual({
          name: 'tex3',
          type: 'sampler2D',
          register: 0,
          layout: null,
        })

        expect(data.uniforms.tex4).toEqual({
          name: 'tex4',
          type: 'sampler2D',
          register: 3,
          layout: null,
        })
      })
    })

    describe('arrays', () => {
      const tests = Array.from(Keywords.simpleTypes.values()).map((type) => {
        return {
          name: `uniform ${type}[2]`,
          shader: `
            // @binding ${type}Uniform
            uniform ${type} u${type.toUpperCase()}[2];
          `,
          expect: {
            binding: `${type}Uniform[0]`,
            name: `u${type.toUpperCase()}[0]`,
            type: type,
            layout: null
          },
        }
      })

      describe('vertex shader', () => {
        for (const test of tests) {
          it(test.name, () => {
            const data = inspectProgram(test.shader, '')
            expect(Object.keys(data.uniforms)).toContain(`${test.expect.name}`)
            expect(data.uniforms[`${test.expect.name}`]).toEqual(test.expect)
          })
        }
      })

      describe('fragment shader', () => {
        for (const test of tests) {
          it(test.name, () => {
            const data = inspectProgram('', test.shader)
            expect(Object.keys(data.uniforms)).toContain(`${test.expect.name}`)
            expect(data.uniforms[`${test.expect.name}`]).toEqual(test.expect)
          })
        }
      })
    })

    describe('structs', () => {
      it('detects all members', () => {
        const data = inspectProgram(`
          struct LightParams {
            vec4 Color;
            vec4 Position;
            vec4 Direction;
          };
          // @binding Lights
          uniform LightParams uLights;
        `, '')
        expect(Object.keys(data.uniforms)).toContain('uLights.Color')
        expect(Object.keys(data.uniforms)).toContain('uLights.Position')
        expect(Object.keys(data.uniforms)).toContain('uLights.Direction')
      })

      it('detects struct arrays', () => {
        const data = inspectProgram(`
          struct LightParams {
            vec4 Color;
            vec4 Position;
            vec4 Direction;
          };
          // @binding Lights
          uniform LightParams uLights[2];
        `, '')
        expect(Object.keys(data.uniforms)).toContain('uLights[0].Color')
        expect(Object.keys(data.uniforms)).toContain('uLights[0].Position')
        expect(Object.keys(data.uniforms)).toContain('uLights[0].Direction')
        expect(Object.keys(data.uniforms)).toContain('uLights[1].Color')
        expect(Object.keys(data.uniforms)).toContain('uLights[1].Position')
        expect(Object.keys(data.uniforms)).toContain('uLights[1].Direction')
      })
    })
  })

  describe('attributes', () => {
    describe('simple types', () => {
      const tests = Array.from(Keywords.simpleTypes.values()).map((type) => {
        const name = `u${type.toUpperCase()}`
        return {
          name: `attribute ${type}`,
          shader: `
            // @binding ${type}Attribute
            attribute ${type} ${name};
          `,
          expect: {
            binding: `${type}Attribute`,
            name: name,
            type: type,
            layout: null,
          },
        }
      })

      describe('vertex shader', () => {
        for (const test of tests) {
          it(test.name, () => {
            const data = inspectProgram(test.shader, '')
            expect(Object.keys(data.inputs)).toContain(test.expect.name)
            expect(data.inputs[test.expect.name]).toEqual(test.expect)
          })
        }
      })

      describe('fragment shader', () => {
        for (const test of tests) {
          it(test.name, () => {
            const data = inspectProgram('', test.shader)
            expect(Object.keys(data.inputs)).toEqual([])
          })
        }
      })
    })
  })

  describe('varying', () => {
    describe('simple types', () => {
      const tests = Array.from(Keywords.simpleTypes.values()).map((type) => {
        const name = `v${type.toUpperCase()}`
        return {
          name: `varying ${type}`,
          shader: `
            // @binding ${type}Varying
            varying ${type} ${name};
          `,
          expect: {
            binding: `${type}Varying`,
            name: name,
            type: type,
            layout: null,
          },
        }
      })

      describe('vertex shader', () => {
        for (const test of tests) {
          it(test.name, () => {
            const data = inspectProgram(test.shader, '')
            expect(data.inputs).toEqual({})
            expect(data.uniforms).toEqual({})
          })
        }
      })

      describe('fragment shader', () => {
        for (const test of tests) {
          it(test.name, () => {
            const data = inspectProgram('', test.shader)
            expect(data.inputs).toEqual({})
            expect(data.uniforms).toEqual({})
          })
        }
      })
    })
  })

})

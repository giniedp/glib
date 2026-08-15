import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WebglDevice } from '../WebglDevice'

const COMMON_VS = /* glsl */ `
  #version 300 es
  layout(location = 0) in vec3 a_position;
  void main() {
    gl_Position = vec4(a_position, 1.0);
  }
`

const FS_UNIFORM = /* glsl */ `
  #version 300 es
  precision highp float;
  uniform vec4 u_color;
  out vec4 outColor;
  void main() {
    outColor = u_color;
  }
`

const FS_UNIFORM_ARRAY = /* glsl */ `
  #version 300 es
  precision highp float;
  uniform vec4 u_color[4];
  out vec4 outColor;
  void main() {
    outColor = u_color[0];
  }
`

const FS_UNIFORM_STRUCT = /* glsl */ `
  #version 300 es
  precision highp float;
  struct Color {
    vec4 value;
  };
  uniform Color u_color;
  out vec4 outColor;
  void main() {
    outColor = u_color.value;
  }
`

const FS_UNIFORM_STRUCT_ARRAY = /* glsl */ `
  #version 300 es
  precision highp float;
  struct Color {
    vec4 value;
  };
  uniform Color u_color[2];
  out vec4 outColor;
  void main() {
    outColor = u_color[0].value;
  }
`
describe('WebglProgram', () => {
  let device: WebglDevice
  beforeEach(() => {
    device = new WebglDevice({})
  })

  afterEach(() => {
    device.dispose()
  })

  describe('Location Uniforms', () => {
    it('should resolve uniform by name', async () => {
      const program = device.createShaderModule({
        glsl: { vertex: COMMON_VS, fragment: FS_UNIFORM },
      })
      await program.compiled
      expect(program.isValid).toBe(true)

      expect(program.program.get('u_color')).not.toBe(null)
      expect(program.program.get('u_color').name).toBe('u_color')
      expect(program.program.get('u_color').type).toBe('vec4')

      expect(program.program.get('u_color[0]')).toBe(null)
    })

    it('should resolve uniform array', async () => {
      const program = device.createShaderModule({
        glsl: { vertex: COMMON_VS, fragment: FS_UNIFORM_ARRAY },
      })
      await program.compiled
      expect(program.isValid).toBe(true)

      expect(program.program.get('u_color')).not.toBe(null)
      expect(program.program.get('u_color').name).toBe('u_color[0]')
      expect(program.program.get('u_color').type).toBe('vec4')

      expect(program.program.get('u_color[0]')).not.toBe(null)
      expect(program.program.get('u_color[0]').name).toBe('u_color[0]')
      expect(program.program.get('u_color[0]').type).toBe('vec4')

      expect(program.program.get('u_color[1]')).not.toBe(null)
      expect(program.program.get('u_color[1]').name).toBe('u_color[1]')
      expect(program.program.get('u_color[1]').type).toBe('vec4')
    })

    it('should resolve uniform struct ', async () => {
      const program = device.createShaderModule({
        glsl: { vertex: COMMON_VS, fragment: FS_UNIFORM_STRUCT },
      })
      await program.compiled
      expect(program.isValid).toBe(true)

      expect(program.program.get('u_color')).toBe(null)

      expect(program.program.get('u_color.value')).not.toBe(null)
      expect(program.program.get('u_color.value').name).toBe('u_color.value')
      expect(program.program.get('u_color.value').type).toBe('vec4')
    })

    it('should resolve uniform struct array', async () => {
      const program = device.createShaderModule({
        glsl: { vertex: COMMON_VS, fragment: FS_UNIFORM_STRUCT_ARRAY },
      })
      await program.compiled
      expect(program.isValid).toBe(true)

      expect(program.program.get('u_color')).toBe(null)
      expect(program.program.get('u_color[0]')).toBe(null)

      expect(program.program.get('u_color[0].value')).not.toBe(null)
      expect(program.program.get('u_color[0].value').name).toBe('u_color[0].value')
      expect(program.program.get('u_color[0].value').type).toBe('vec4')

      expect(program.program.get('u_color[1].value')).not.toBe(null)
      expect(program.program.get('u_color[1].value').name).toBe('u_color[1].value')
      expect(program.program.get('u_color[1].value').type).toBe('vec4')
    })
  })
})

import { ContentManager } from '@gglib/content'
import { DeviceGL, Model, Material, MaterialOptions, ShaderEffect } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test'

import '../gglib'
import './obj'

describe('content loader obj', () => {

  let device: DeviceGL
  let manager: ContentManager

  afterAll(clearScripts)
  beforeAll(() => {
    device = new DeviceGL()
    manager = new ContentManager(device)
    manager.loader.register({
      input: Material.OptionsTechnique,
      output: Material.Options,
      handle: async (input: MaterialOptions, context) => {
        if (!input?.technique) {
          return null
        }
        return {
          ...input,
          effect: await context.manager.load('default.ggfx', ShaderEffect.Options)
        }
      }
    })

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

    defineScript('materials.mtl', 'application/x-mtl', `
# some comment
newmtl myMaterial
Ka 1 2 3
map_Ka texture.png
d 0.1
Ns 16
    `)

    defineScript('model.obj', 'text/obj', `
# cube.obj
#
mtllib materials.mtl
usemtl myMaterial
g cube

v  0.0  0.0  0.0
v  0.0  0.0  1.0
v  0.0  1.0  0.0
v  0.0  1.0  1.0
v  1.0  0.0  0.0
v  1.0  0.0  1.0
v  1.0  1.0  0.0
v  1.0  1.0  1.0

vn  0.0  0.0  1.0
vn  0.0  0.0 -1.0
vn  0.0  1.0  0.0
vn  0.0 -1.0  0.0
vn  1.0  0.0  0.0
vn -1.0  0.0  0.0

f  1//2  7//2  5//2
f  1//2  3//2  7//2
f  1//6  4//6  3//6
f  1//6  2//6  4//6
f  3//3  8//3  7//3
f  3//3  4//3  8//3
f  5//5  7//5  8//5
f  5//5  8//5  6//5
f  1//4  5//4  6//4
f  1//4  6//4  2//4
f  2//1  6//1  8//1
f  2//1  8//1  4//1
    `)
  })

  describe('objModel', () => {
    it('loads from DOM', (done) => {
      manager.load('model.obj', Model).then((result: Model) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.meshes.length).toBe(1)
        expect(result.meshes[0].parts.length).toBe(1)
        expect(result.meshes[0].materials.length).toBe(1)
        expect(result.meshes[0].parts[0].vertexBuffer[0].elementCount).toBe(6 * 4) // 4 vertices for each side of the cube
      })
      .catch(fail)
      .then(done)
    })
  })
})

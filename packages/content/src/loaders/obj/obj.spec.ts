import { ContentManager } from '@gglib/content'
import { Device, Model } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test/utils.spec'

import '../ggfx'
import '../ggmat'
import '../native'
import './obj'

describe('content loader obj', () => {

  let device: Device
  let manager: ContentManager

  afterAll(clearScripts)
  beforeAll(() => {
    device = new Device()
    manager = new ContentManager(device)

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
      manager.rewriteUrl = (url) => {
        switch (url) {
          case '/default':
            return '/default.ggfx'
          default:
            return url
        }
      }
      manager.load('model.obj', Model).then((result: Model) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.meshes.length).toBe(1)
        expect(result.materials.length).toBe(1)
        expect(result.meshes[0].vertexBuffer[0].elementCount).toBe(6 * 4) // 4 vertices for each side of the cube
      })
      .catch(fail)
      .then(done)
    })
  })
})

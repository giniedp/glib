import { Manager } from '@gglib/content'
import { Device, Model } from '@gglib/graphics'

describe('glib/content/manager/importer', () => {

  let device: Device
  let manager: Manager

  function defineScript(id: string, type: string, scriptContent: string) {
    const head = document.getElementsByTagName('head').item(0)
    const script = document.createElement('script')
    script.setAttribute('id', id)
    script.setAttribute('type', type)
    script.textContent = scriptContent
    head.appendChild(script)
  }

  beforeAll(() => {
    device = new Device()
    manager = new Manager(device)
    defineScript('model.obj', 'text/obj', `
# cube.obj
#

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
      manager.load(Model, 'model.obj').then((result: Model) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.meshes.length).toBe(1)
        expect(result.meshes[0].vertexBuffer.elementCount).toBe(4 * 6) // 4 vertices for each side
        done()
      }).catch((e) => {
        fail(e)
        done()
      })
    })
  })
})

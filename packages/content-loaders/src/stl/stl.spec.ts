import { ContentManager } from '@gglib/content'
import { DeviceGL, Model } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test'

import '../ggfx'
import '../ggmat'
import '../native'
import './stl'

describe('content loader stl', () => {

  let device: DeviceGL
  let manager: ContentManager

  afterAll(clearScripts)
  beforeAll(() => {
    device = new DeviceGL()
    manager = new ContentManager(device)
    defineScript('default.ggfx', 'application/x-yml', `
name: effect name
program:
// comment
technique:
  name: TECHNIQUE0
  pass:
    name: PASS0
    vertexShader:
      void main(void) {
        gl_Position = vec4(0, 0, 0, 0);
      }
    fragmentShader:
      void main(void) {
        gl_FragColor = vec4(0, 0, 0, 2);
      }
    `.trim())
    defineScript('model.stl', 'text/plain', `
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
    `.trim())
  })

  describe('stlModel', () => {
    it('loads from DOM', (done) => {
      manager.rewriteUrl = (url) => {
        switch (url) {
          case '/default':
            return '/default.ggfx'
          default:
            return url
        }
      }
      manager.load('model.stl', Model).then((result: Model) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.meshes.length).toBe(1)
        expect(result.meshes[0].parts.length).toBe(1)
        expect(result.meshes[0].parts[0].vertexBuffer[0].elementCount).toBe(36)
      }).catch(fail).then(done)
    })
  })
})

import { ContentManager } from '@gglib/content'
import { DeviceGL, Model } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test/utils.spec'

import '../ggfx'
import '../ggmat'
import '../native'
import './ggmod'

describe('content loader ggmod', () => {

  let device: DeviceGL
  let manager: ContentManager

  afterAll(clearScripts)

  beforeAll(() => {
    device = new DeviceGL()
    manager = new ContentManager(device)

    defineScript('effect.ggfx', 'application/x-yml', `
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
    `)

    defineScript('material.ggmat', 'application/json;format=ggmat', JSON.stringify({
      name: 'material1',
      effect: 'effect.ggfx',
      parameters: {},
    }))

    defineScript('cube.ggmod', 'application/json;format=ggmod', JSON.stringify({
      name: 'triangle model',
      boundingBox: [0, 0, 0, 1, 1, 1],
      boundingSphere: [0.5, 0.5, 0.5, 1],
      materials: ['material.ggmat', {
        name: 'material2',
        effect: 'effect.ggfx',
        parameters: {},
      }],
      meshes: [{
        name: 'triangle mesh',
        boundingBox: [0, 0, 0, 1, 1, 1],
        boundingSphere: [0.5, 0.5, 0.5, 1],
        materialId: 0,
        indexBuffer: [0, 1, 2, 1, 2, 3],
        vertexBuffer: {
          layout: {
            position: {
              type: 'float', offset: 0, elements: 3,
            },
          },
          data: [
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            0.0,  0.5, 0.0,
          ],
        },
      }],
    }))
  })

  describe('jsonModel', () => {
    it('loads Model from DOM', (done) => {
      manager.load('cube.ggmod', Model).then((result: Model) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.meshes[0].materials[0].effect.techniques.length).toBe(1)
        expect(result.meshes[0].materials[0].effect.techniques[0].name).toBe('TECHNIQUE0')
        expect(result.meshes[0].materials[0].effect.techniques[0].passes.length).toBe(1)
        expect(result.meshes[0].materials[0].effect.techniques[0].passes[0].name).toBe('PASS0')
      }).catch(fail)
        .then(done)
    })
  })
})

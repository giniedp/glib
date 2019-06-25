import { ContentManager } from '@gglib/content'
import { Device, ShaderEffect } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test/utils.spec'

import '../native'
import './ggfx'

describe('content loader ggfx', () => {

  let device: Device
  let manager: ContentManager

  afterAll(clearScripts)

  beforeAll(() => {
    device = new Device()
    manager = new ContentManager(device)
    defineScript('effect.ggfx', 'text/yml', `
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
  })

  describe('ymlEffect', () => {
    it('loads from DOM', (done) => {
      manager.load('effect.ggfx', ShaderEffect).then((result: ShaderEffect) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.name).toBe('effect name')
        expect(result.techniques.length).toBe(1)
        expect(result.techniques[0].name).toBe('technique name')
        expect(result.techniques[0].passes[0].name).toBe('pass name')
        done()
      }).catch((e) => {
        fail(e)
        done()
      })
    })
  })
})

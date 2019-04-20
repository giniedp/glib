import { Manager } from '@gglib/content'
import { Device, Material, MaterialOptions, ShaderEffect } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test/utils.spec'

import '../ggfx'
import '../ggmat'
import '../native'
import './mtl'

describe('content loader mtl', () => {

  let device: Device
  let manager: Manager

  afterAll(clearScripts)
  beforeAll(() => {
    device = new Device()
    manager = new Manager(device)
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

    defineScript('material.mtl', 'application/x-mtl', `
# some comment
newmtl material name
Ka 1 2 3
map_Ka texture.png
d 0.1
Ns 16
    `)
  })
  describe('mtlMaterial', () => {

    it('loads from DOM', (done) => {
      manager.rewriteUrl = (url) => {
        switch (url) {
          case '/default':
            return '/default.ggfx'
          default:
            return url
        }
      }

      manager.load('material.mtl', Material).then((result) => {
        expect(result).toBeDefined()
        expect(result.name).toBe('material name')
        expect(result.effect instanceof ShaderEffect).toBe(true)
        done()
      }).catch((e) => {
        fail(e)
        done()
      })
    })
  })
})

import { Manager } from '@gglib/content'
import { Device, Material } from '@gglib/graphics'
import { clearScripts, defineScript } from '../test/utils.spec'

import '../native'
import './ggmat'

describe('content loader ggmat', () => {

  let device: Device
  let manager: Manager

  afterAll(clearScripts)

  beforeAll(() => {
    device = new Device()
    manager = new Manager(device)
    defineScript('effect.ggfx', 'application/json', `
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

    defineScript('material.ggmat', 'application/json', JSON.stringify({
      name: 'material name',
      effect: 'effect.ggfx',
      parameters: {},
    }))
  })

  describe('jsonMaterial', () => {
    it('loads Material from DOM', (done) => {
      manager.load('material.ggmat', Material).then((result: Material) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.effect.techniques.length).toBe(1)
        expect(result.effect.techniques[0].name).toBe('TECHNIQUE0')
        expect(result.effect.techniques[0].passes.length).toBe(1)
        expect(result.effect.techniques[0].passes[0].name).toBe('PASS0')
        expect(result.effect.techniques[0].passes[0].program.linked).toBe(true)
      })
      .then(done)
      .catch(fail)
    })

    it('loads Material[] from DOM', (done) => {
      manager.load('material.ggmat', Material.Array).then((result: Material[]) => {
        expect(result[0]).toBeDefined()
        expect(result[0].device).toBe(device)
        expect(result[0].effect.techniques.length).toBe(1)
        expect(result[0].effect.techniques[0].name).toBe('TECHNIQUE0')
        expect(result[0].effect.techniques[0].passes.length).toBe(1)
        expect(result[0].effect.techniques[0].passes[0].name).toBe('PASS0')
        expect(result[0].effect.techniques[0].passes[0].program.linked).toBe(true)
      })
      .then(done)
      .catch(fail)
    })
  })
})

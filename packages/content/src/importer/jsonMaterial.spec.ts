import { Manager } from '@gglib/content'
import { Device, ShaderEffect } from '@gglib/graphics'

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
    defineScript('effect.json', 'application/json', JSON.stringify({
      technique: [{
        pass: {
          vertexShader: `
            void main(void) {
              gl_Position = vec4(0, 0, 0, 0);
            }
          `,
          fragmentShader: `
            void main(void) {
              gl_FragColor = vec4(0, 0, 0, 2);
            }
          `,
        },
      }],
    }))

    defineScript('material.json', 'application/json', JSON.stringify({
      name: 'material name',
      effect: 'effect.json',
      parameters: {},
    }))
  })

  describe('jsonMaterial', () => {
    it('loads Material from DOM', (done) => {
      manager.load('Material', 'material.json').then((result: ShaderEffect) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.techniques.length).toBe(1)
        expect(result.techniques[0].name).toBe('TECHNIQUE0')
        expect(result.techniques[0].passes.length).toBe(1)
        expect(result.techniques[0].passes[0].name).toBe('PASS0')
        expect(result.techniques[0].passes[0].program.linked).toBe(true)
        done()
      }).catch((e) => {
        fail(e)
        done()
      })
    })

    it('loads Material[] from DOM', (done) => {
      manager.load('Material[]', 'material.json').then((result: ShaderEffect[]) => {
        expect(result[0]).toBeDefined()
        expect(result[0].device).toBe(device)
        expect(result[0].techniques.length).toBe(1)
        expect(result[0].techniques[0].name).toBe('TECHNIQUE0')
        expect(result[0].techniques[0].passes.length).toBe(1)
        expect(result[0].techniques[0].passes[0].name).toBe('PASS0')
        expect(result[0].techniques[0].passes[0].program.linked).toBe(true)
        done()
      }).catch((e) => {
        fail(e)
        done()
      })
    })
  })
})

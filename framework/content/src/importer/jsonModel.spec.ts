import { Manager } from '@glib/content'
import { Device, Model, ShaderEffect } from '@glib/graphics'

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
              gl_FragColor = vec4(0, 0, 0, 1);
            }
          `,
        },
      }],
    }))

    defineScript('material.json', 'application/json', JSON.stringify({
      name: 'material1',
      effect: 'effect.json',
      parameters: {},
    }))

    defineScript('cube.json', 'application/json', JSON.stringify({
      name: 'cube model',
      boundingBox: [0, 0, 0, 1, 1, 1],
      boundingSphere: [0.5, 0.5, 0.5, 1],
      materials: ['material.json', {
        name: 'material2',
        effect: 'effect.json',
        parameters: {},
      }],
      meshes: [{

      }],
    }))
  })

  describe('jsonModel', () => {
    it('loads Model from DOM', (done) => {
      manager.load('Model', 'cube.json').then((result: Model) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.materials[0].techniques.length).toBe(1)
        expect(result.materials[0].techniques[0].name).toBe('TECHNIQUE0')
        expect(result.materials[0].techniques[0].passes.length).toBe(1)
        expect(result.materials[0].techniques[0].passes[0].name).toBe('PASS0')
        expect(result.materials[0].techniques[0].passes[0].program.linked).toBe(true)
        done()
      }).catch((e) => {
        fail(e)
        done()
      })
    })
  })
})

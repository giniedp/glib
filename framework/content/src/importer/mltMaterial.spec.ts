import { Manager } from '@glib/content'
import { Device, ShaderEffect } from '@glib/graphics'

// tslint:disable-next-line
const RED10x20 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAUCAYAAAC07qxWAAAAGElEQVR42mP8z8AARIQB46jCUYWjCkEAAMXUJ+1sUc+CAAAAAElFTkSuQmCC'

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
    defineScript('basicEffect', 'application/x-yaml', `
name: effect name
program:
// comment
techniques:
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
    `)
  })
  describe('mtlMaterial', () => {

    it('loads from DOM', (done) => {
      manager.load('Material', 'material.mtl').then((result: ShaderEffect) => {
        expect(result).toBeDefined()
        expect(result.device).toBe(device)
        expect(result.name).toBe('material name')
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

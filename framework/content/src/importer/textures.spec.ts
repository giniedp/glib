import { Manager } from '@glib/content'
import { Device, Texture, TextureType } from '@glib/graphics'

// tslint:disable-next-line
const RED10x20 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAUCAYAAAC07qxWAAAAGElEQVR42mP8z8AARIQB46jCUYWjCkEAAMXUJ+1sUc+CAAAAAElFTkSuQmCC'

describe('glib/content/manager/importer', () => {

  let device: Device
  let manager: Manager

  beforeEach(() => {
    device = new Device()
    manager = new Manager(device)
  })

  describe('Texture', () => {
    it('loads from data:image/png', (done) => {
      manager.load(Texture, RED10x20).then((result) => {
        expect(result).toBeDefined()
        expect(result instanceof Texture).toBe(true)
        expect(result.type).toBe(TextureType.Texture2D)
        expect(result.image.src).toBe(RED10x20)
        done()
      }).catch((res) => {
        fail(res)
        done()
      })
    })
  })

  describe('Texture2D', () => {
    it('loads from data:image/png', (done) => {
      manager.load<Texture>('Texture2D', RED10x20).then((result) => {
        expect(result).toBeDefined()
        expect(result instanceof Texture).toBe(true)
        expect(result.type).toBe(TextureType.Texture2D)
        expect(result.image.src).toBe(RED10x20)
        done()
      }).catch((res) => {
        fail(res)
        done()
      })
    })
  })
})

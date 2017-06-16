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

  describe('Image', () => {
    it('loads from data:image/png', (done) => {
      manager.load(Image, RED10x20, { await: true }).then((result) => {
        expect(result).toBeDefined()
        expect(result.src).toBe(RED10x20)
        expect(result.width).toBe(10)
        expect(result.height).toBe(20)
        done()
      }).catch((res) => {
        fail(res)
        done()
      })
    })
  })
})

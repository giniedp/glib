import { Device } from '@gglib/graphics'
import { Clipmap } from './Clipmap'

describe('Clipmap', () => {
  let device: Device
  let climpap: Clipmap

  beforeEach(() => {
    device = new Device({ context: 'webgl2' })
    climpap = new Clipmap(device, 0, 15)
  })

  it ('invalidates area', () => {
    climpap.update(7, 7)
    expect(climpap.invalid.length).toBe(1)
    expect(climpap.invalid[0]).toEqual({ x: 0, y: 0, width: 15, height: 15 })

    climpap.clear()
    climpap.update(9, 9)
    expect(climpap.invalid.length).toBe(2)
    expect(climpap.invalid[0]).toEqual({ x: 0, y: 0, width: 2, height: 15 })
    expect(climpap.invalid[1]).toEqual({ x: 0, y: 0, width: 15, height: 2 })

    climpap.clear()
    climpap.update(7, 7)
    expect(climpap.invalid.length).toBe(2)
    expect(climpap.invalid[0]).toEqual({ x: 0, y: 0, width: 2, height: 15 })
    expect(climpap.invalid[1]).toEqual({ x: 0, y: 0, width: 15, height: 2 })
  })

})

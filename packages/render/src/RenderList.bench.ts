import { BasicMaterial, createDevice, cubeGeometry, Device, Mesh } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { bench, describe } from 'vitest'
import { Renderer } from './Renderer'
import { RenderList } from './RenderList'
import { RenderListMode } from './RenderListMode'

describe('BasicRenderList', () => {
  let device: Device
  let renderer: Renderer
  let list: RenderList
  bench('sort', () => {}, {
    setup: () => {
      device = createDevice({
        canvas: document.createElement('canvas'),
      })
      renderer = new Renderer(device)
      const view = renderer.createView({
        camera: {
          world: Mat4.createIdentity(),
          view: Mat4.createIdentity(),
          projection: Mat4.createIdentity(),
        },
      })
      list = new RenderList()
      list.begin(RenderListMode.Opaque, view, {})
      const cube = cubeGeometry(device, {
        materialId: 0,
      })
      for (let i = 0; i < 1000; i++) {
        new Mesh(device, {
          materials: [new BasicMaterial(device)],
          parts: [cube],
        })
      }
    },
  })
})

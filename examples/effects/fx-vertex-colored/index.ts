import { defaultProgram } from '@gglib/effects'
import { buildCube, Color, Device, ModelBuilder } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const vertexColorEffect = device.createEffect({
  program: defaultProgram({
    V_COLOR1: true,
  }),
})

const model = ModelBuilder.begin({
  layout: ['position', 'color'],
})
  .withTransform(Mat4.createTranslation(-2, 0, 0), (b) => {
    b.defaultAttributes.color = [Color.DarkRed.rgba]
    buildCube(b, { size: 2 })
    b.endMesh({
      materialId: 0,
      name: 'Red Cube',
    })
  })
  .withTransform(Mat4.createTranslation(0, 2, 0), (b) => {
    b.defaultAttributes.color = [Color.DarkGreen.rgba]
    buildCube(b, { size: 2 })
    b.endMesh({
      materialId: 0,
      name: 'Green Cube',
    })
  })
  .withTransform(Mat4.createTranslation(2, 0, 0), (b) => {
    b.defaultAttributes.color = [Color.DarkBlue.rgba]
    buildCube(b, { size: 2 })
    b.endMesh({
      materialId: 0,
      name: 'Blue Cube',
    })
  })
  .endModel(device, {
    materials: [{
      effect: vertexColorEffect,
      parameters: {},
    }],
  })

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

let time = 0
loop((dt) => {
  time += dt

  device.resize()
  device.clear(0xff2e2620, 1)

  cam.initTranslation(0, 0, 5.0)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)

  model.materials.forEach((mtl) => {
    mtl.parameters.World = world
    mtl.parameters.View = view
    mtl.parameters.Projection = proj
    mtl.parameters.CameraPosition = cam.getTranslation()
  })
  model.draw()
})

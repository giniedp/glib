import { defaultProgram } from '@gglib/effects'
import { Device, ModelBuilder } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

let device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const unlitColoredProgram = device.createProgram(defaultProgram({
  DIFFUSE_COLOR: true,
}))
const unlitTexturedProgram = device.createProgram(defaultProgram({
  DIFFUSE_MAP: true,
}))

const model = ModelBuilder.begin()
  .withTransform(Mat4.createTranslation(0, -1, 0), (b) => {
    b.append('Plane', { size: 20, tesselation: 4 })
    b.endMesh({
      materialId: 'water',
      name: 'Water Surface',
    })
  })
  .withTransform(Mat4.createTranslation(-2, 0, 0), (b) => {
    b.append('Cube', { size: 2 })
    b.endMesh({
      materialId: 'red',
      name: 'Red Cube',
    })
  })
  .withTransform(Mat4.createTranslation(0, 2, 0), (b) => {
    b.append('Cube', { size: 2 })
    b.endMesh({
      materialId: 'green',
      name: 'Green Cube',
    })
  })
  .withTransform(Mat4.createTranslation(2, 0, 0), (b) => {
    b.append('Cube', { size: 2 })
    b.endMesh({
      materialId: 'blue',
      name: 'Blue Cube',
    })
  })
  .endModel(device, {
    materials: [{
      name: 'red',
      effect: { program: unlitColoredProgram },
      parameters: {
        DiffuseColor: [1, 0, 0],
      },
    }, {
      name: 'green',
      effect: { program: unlitColoredProgram },
      parameters: {
        DiffuseColor: [0, 1, 0],
      },
    }, {
      name: 'blue',
      effect: { program: unlitColoredProgram },
      parameters: {
        DiffuseColor: [0, 0, 1],
      },
    }, {
      name: 'water',
      effect: { program: unlitTexturedProgram },
      parameters: {
        DiffuseMap: device.createTexture({ data: '/assets/textures/proto_water.png' }),
      },
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
    mtl.parameters['World'] = world
    mtl.parameters['View'] = view
    mtl.parameters['Projection'] = proj
    mtl.parameters['CameraPosition'] = cam.getTranslation()
  })
  model.draw()
})

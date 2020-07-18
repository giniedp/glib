import { defaultProgram } from '@gglib/effects'
import { buildCube, DeviceGL, ModelBuilder, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const textureMappedEffect = device.createEffect({
  program: defaultProgram({
    DIFFUSE_MAP: true,
    DIFFUSE_MAP_SCALE_OFFSET: true,
  }),
})

const model = ModelBuilder.begin({
  layout: ['position', 'texture'],
})
  .withTransform(Mat4.createTranslation(-2, 0, 0), (b) => {
    buildCube(b, { size: 2 })
    b.endMeshPart({
      materialId: 'red',
      name: 'Red Cube',
    })
  })
  .withTransform(Mat4.createTranslation(0, 2, 0), (b) => {
    buildCube(b, { size: 2 })
    b.endMeshPart({
      materialId: 'green',
      name: 'Green Cube',
    })
  })
  .withTransform(Mat4.createTranslation(2, 0, 0), (b) => {
    buildCube(b, { size: 2 })
    b.endMeshPart({
      materialId: 'blue',
      name: 'Blue Cube',
    })
  })
  .closeMesh({
    materials: [{
      name: 'red',
      effect: textureMappedEffect,
      parameters: {
        DiffuseMap: device.createTexture({ data: '/assets/textures/prototype/proto_red.png' }),
      },
    }, {
      name: 'green',
      effect: textureMappedEffect,
      parameters: {
        DiffuseMap: device.createTexture({ data: '/assets/textures/prototype/proto_green.png' }),
      },
    }, {
      name: 'blue',
      effect: textureMappedEffect,
      parameters: {
        DiffuseMap: device.createTexture({ data: '/assets/textures/prototype/proto_blue.png' }),
      },
    }],
  })
  .endModel(device)

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

loop((time, dt) => {

  device.resize()
  device.clear(0xff2e2620, 1)

  cam.initTranslation(0, 0, 5.0)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)

  model.meshes.forEach((mesh) => {
    mesh.materials.forEach((mtl) => {
      mtl.parameters.World = world
      mtl.parameters.View = view
      mtl.parameters.Projection = proj
      mtl.parameters.CameraPosition = cam.getTranslation()
      const t = Math.sin(time / 1000)
      mtl.parameters.DiffuseMapScaleOffset = [
        t + 1,    // scale X
        t + 1,    // scale Y
        -t * 0.5, // offset X
        -t * 0.5, // offset Y
      ]
    })
  })
  model.draw()
})

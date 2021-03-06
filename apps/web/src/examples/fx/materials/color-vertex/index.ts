import { materialProgram } from '@gglib/fx-materials'
import { buildCube, Color, ModelBuilder, createDevice, buildSphere, buildCone } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the device as usual
const device = createDevice({ canvas: '#canvas' })

// Create a default program with onlye vertex color enabled
const vertexColorEffect = device.createEffect({
  program: materialProgram({
    V_COLOR1: true,
  }),
})

// Initialize the modelbuilder and use a layout with a `color` semantic
const model = ModelBuilder.begin({
  layout: ['position', 'color'],
})
  .withTransform(Mat4.createTranslation(-2.2, 0, 0), (b) => {
    b.defaults.color = [Color.Red.rgba]
    b.append(buildCube, { size: 2 })
  })
  .withTransform(Mat4.createTranslation(0, 0, 0), (b) => {
    b.defaults.color = [Color.Green.rgba]
    b.append(buildSphere, { radius: 1 })
  })
  .withTransform(Mat4.createTranslation(2.2, -1, 0), (b) => {
    b.defaults.color = [Color.Blue.rgba]
    b.append(buildCone, { upperRadius: 0, lowerRadius: 1, height: 2 })
  })
  .closeMesh({
    materials: [{
      effect: vertexColorEffect,
      parameters: {},
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

  cam.initTranslation(0, 0, 4.0)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)

  model.meshes.forEach((mesh) => {
    mesh.materials.forEach((mtl) => {
      mtl.parameters.World = world
      mtl.parameters.View = view
      mtl.parameters.Projection = proj
      mtl.parameters.CameraPosition = cam.getTranslation()
    })
  })
  model.draw()
})

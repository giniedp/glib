import { defaultProgram } from '@gglib/fx-materials'
import { buildCube, ModelBuilder, createDevice, Color, buildSphere, buildCone } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device as usual
const device = createDevice({ canvas: '#canvas' })

// Create a default program with only diffuse color enabled
const textureMappedEffect = device.createEffect({
  program: defaultProgram({
    DIFFUSE_COLOR: true,
  }),
})

// Initialize the modelbuilder with only `position` attribute
const model = ModelBuilder.begin({
  layout: ['position'],
})
.withTransform(Mat4.createTranslation(-2.2, 0, 0), (b) => {
  b.defaults.color = [Color.Red.rgba]
  b.append(buildCube, { size: 2 })
  b.closeMeshPart({ materialId: 0 })
})
.withTransform(Mat4.createTranslation(0, 0, 0), (b) => {
  b.defaults.color = [Color.Green.rgba]
  b.append(buildSphere, { radius: 1 })
  b.closeMeshPart({ materialId: 1 })
})
.withTransform(Mat4.createTranslation(2.2, -1, 0), (b) => {
  b.defaults.color = [Color.Blue.rgba]
  b.append(buildCone, { upperRadius: 0, lowerRadius: 1, height: 2 })
  b.closeMeshPart({ materialId: 2 })
})
  // Close the mesh and generate materials from color table.
  // All materials use the same shader program instance
  .closeMesh({
    materials: [{
      effect: textureMappedEffect,
      parameters: {
        DiffuseColor: Color.Red.xyzw,
      },
    }, {
      effect: textureMappedEffect,
      parameters: {
        DiffuseColor: Color.Green.xyzw,
      },
    }, {
      effect: textureMappedEffect,
      parameters: {
        DiffuseColor: Color.Blue.xyzw,
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

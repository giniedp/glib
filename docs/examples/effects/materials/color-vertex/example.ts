import { beginGeometry, buildCone, buildCube, buildSphere, Color, createDevice } from '@gglib/graphics'
import { materialProgram } from '@gglib/materials'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  // Create the device as usual
  const device = createDevice({ canvas })

  // Create a default program with onlye vertex color enabled
  const vertexColorEffect = device.createEffect({
    program: materialProgram({
      V_COLOR1: true,
    }),
  })

  // Initialize the modelbuilder and use a layout with a `color` semantic
  const mesh = beginGeometry({
    layout: [['position', 'color']],
  })
    .withTransform(Mat4.createTranslationXYZ(-2.2, 0, 0), (b) => {
      b.defaults.color = [Color.Red.rgba]
      b.append(buildCube, { size: 2 })
    })
    .withTransform(Mat4.createTranslationXYZ(0, 0, 0), (b) => {
      b.defaults.color = [Color.Green.rgba]
      b.append(buildSphere, { radius: 1 })
    })
    .withTransform(Mat4.createTranslationXYZ(2.2, -1, 0), (b) => {
      b.defaults.color = [Color.Blue.rgba]
      b.append(buildCone, { upperRadius: 0, lowerRadius: 1, height: 2 })
    })
    .endMesh(device, {
      materials: [
        {
          effect: vertexColorEffect,
          properties: {},
        },
      ],
    })!

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const cam = Mat4.createIdentity()

  function frame() {
    device.resize()
    device.clear(0xff2e2620, 1)

    cam.initTranslationXYZ(0, 0, 4.0)
    Mat4.invert(cam, view)
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)

    mesh.materials.forEach((mtl) => {
      mtl.properties.World = world
      mtl.properties.View = view
      mtl.properties.Projection = proj
      mtl.properties.CameraPosition = cam.getTranslation()
    })
    mesh.draw()
  }
  const looper = loop(frame)
  return () => {
    looper.stop()
  }
}

import { Color, beginGeometry, buildCone, buildCube, buildSphere, createDevice } from '@gglib/graphics'
import { materialProgram } from '@gglib/materials'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })

  const textureMappedEffect = device.createEffect({
    program: materialProgram({
      DIFFUSE_COLOR: true,
    }),
  })

  const mesh = beginGeometry({
    layout: [['position']],
  })
    .withTransform(Mat4.createTranslationXYZ(-2.2, 0, 0), (b) => {
      b.defaults.color = [Color.Red.rgba]
      b.append(buildCube, { size: 2 })
      b.closeGeometry({ materialId: 0 })
    })
    .withTransform(Mat4.createTranslationXYZ(0, 0, 0), (b) => {
      b.defaults.color = [Color.Green.rgba]
      b.append(buildSphere, { radius: 1 })
      b.closeGeometry({ materialId: 1 })
    })
    .withTransform(Mat4.createTranslationXYZ(2.2, -1, 0), (b) => {
      b.defaults.color = [Color.Blue.rgba]
      b.append(buildCone, { upperRadius: 0, lowerRadius: 1, height: 2 })
      b.closeGeometry({ materialId: 2 })
    })

    .endMesh(device, {
      materials: [
        {
          effect: textureMappedEffect,
          parameters: {
            DiffuseColor: Color.Red.xyzw,
          },
        },
        {
          effect: textureMappedEffect,
          parameters: {
            DiffuseColor: Color.Green.xyzw,
          },
        },
        {
          effect: textureMappedEffect,
          parameters: {
            DiffuseColor: Color.Blue.xyzw,
          },
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
      mtl.parameters.World = world
      mtl.parameters.View = view
      mtl.parameters.Projection = proj
      mtl.parameters.CameraPosition = cam.getTranslation()
    })
    mesh.draw()
  }

  const looper = loop(frame)
  return () => {
    looper.stop()
  }
}

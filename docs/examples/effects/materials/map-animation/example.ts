import { beginGeometry, buildCone, buildCube, buildCylinder, createDevice } from '@gglib/graphics'
import { materialProgram } from '@gglib/materials'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })

  const textureMappedEffect = device.createEffect({
    program: materialProgram({
      DIFFUSE_MAP: true,
      DIFFUSE_MAP_SCALE_OFFSET: true,
    }),
  })

  const mesh = beginGeometry({
    layout: [['position', 'texture']],
  })
    .withTransform(Mat4.createTranslationXYZ(-2.2, 0, 0), (b) => {
      b.append(buildCube, { size: 2 })
      b.closeGeometry({ materialId: 0 })
    })
    .withTransform(Mat4.createTranslationXYZ(0, 0, 0), (b) => {
      b.append(buildCylinder, { radius: 1, height: 2, offset: -1 })
      b.closeGeometry({ materialId: 1 })
    })
    .withTransform(Mat4.createTranslationXYZ(2.2, -1, 0), (b) => {
      b.append(buildCone, { upperRadius: 0, lowerRadius: 1, height: 2 })
      b.closeGeometry({ materialId: 2 })
    })
    .endMesh(device, {
      materials: [
        {
          effect: textureMappedEffect,
          parameters: {
            DiffuseMap: device.createTexture({ source: '/textures/cc0textures.com/TilesColor.jpg' }),
          },
        },
        {
          effect: textureMappedEffect,
          parameters: {
            DiffuseMap: device.createTexture({ source: '/textures/cc0textures.com/TilesColor.jpg' }),
          },
        },
        {
          effect: textureMappedEffect,
          parameters: {
            DiffuseMap: device.createTexture({ source: '/textures/cc0textures.com/TilesColor.jpg' }),
          },
        },
      ],
    })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const cam = Mat4.createIdentity()

  function frame(time: number) {
    device.resize()
    device.clear(0xff2e2620, 1)

    cam.initTranslationXYZ(0, 0, 3.0)
    Mat4.invert(cam, view)
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)

    for (const mtl of mesh.materials) {
      mtl.parameters.World = world
      mtl.parameters.View = view
      mtl.parameters.Projection = proj
      mtl.parameters.CameraPosition = cam.getTranslation()
      const t = Math.sin(time / 1000)
      mtl.parameters.DiffuseMapScaleOffset = [
        t + 1, // scale X
        t + 1, // scale Y
        -t * 0.5, // offset X
        -t * 0.5, // offset Y
      ]
    }
    mesh.draw()
  }

  const looper = loop(frame)
  return () => {
    looper.stop()
  }
}

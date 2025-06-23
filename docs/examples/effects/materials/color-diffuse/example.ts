import { Mesh, coneGeometry, createDevice, cubeGeometry, sphereGeometry } from '@gglib/graphics'
import { materialProgram } from '@gglib/materials'
import { Mat4 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })

  const effect = device.createEffect({
    program: materialProgram({
      BASE_COLOR: true,
    }),
  })

  const mesh = new Mesh(device, {
    parts: [
      cubeGeometry(device, {
        name: 'Cube',
        materialId: 0,
        transform: Mat4.createTranslationXYZ(-2.2, 0, 0),
        size: 2,
      }),
      sphereGeometry(device, {
        name: 'Sphere',
        materialId: 1,
        transform: Mat4.createTranslationXYZ(0, 0, 0),
        radius: 1,
      }),
      coneGeometry(device, {
        name: 'Cone',
        materialId: 2,
        transform: Mat4.createTranslationXYZ(2.2, -1, 0),
        upperRadius: 0,
        lowerRadius: 1,
        height: 2,
      }),
    ],
    materials: [
      {
        effect: effect,
        parameters: {
          BaseColor: [1, 0, 0, 1],
        },
      },
      {
        effect: effect,
        parameters: {
          BaseColor: [0, 1, 0, 1],
        },
      },
      {
        effect: effect,
        parameters: {
          BaseColor: [0, 0, 1, 1],
        },
      },
    ],
  })

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

  device.scheduler.add(frame)
  return () => device.dispose()
}

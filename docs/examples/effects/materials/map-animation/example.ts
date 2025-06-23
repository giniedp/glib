import {
  beginGeometry,
  buildCone,
  buildCube,
  buildCylinder,
  createDevice,
  Device,
  Material,
  SamplerState,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { materialProgram } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat3, Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const material = new Material(device, {
    program: materialProgram({
      BASE_COLOR_MAP: true,
      BASE_COLOR_MAP_TRANSFORM: true,
    }),
    parameters: {
      BaseColorMap: device.createTexture({
        source: '/textures/cc0textures.com/TilesColor.jpg',
        sampler: SamplerState.LinearWrap,
        generateMipmap: true,
      }),
    },
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
      materials: [material, material, material],
    })

  const world = Mat4.createIdentity()
  const camera = demoCamera()
  const textureTransform = Mat3.createIdentity()

  function frame(time: number) {
    device.resize()
    device.clear(0xff2e2620, 1)

    camera.update(mouse, device)

    const t = Math.sin(time / 1000)

    textureTransform.initIdentity()
    textureTransform.scaleXYZ(2 + t, 2 + t, 1)
    textureTransform.elements[6] = -t * 0.5
    textureTransform.elements[7] = -t * 0.5
    textureTransform.rotateZ(time / 1000)

    for (const mtl of mesh.materials) {
      mtl.parameters.World = world
      mtl.parameters.View = camera.view
      mtl.parameters.Projection = camera.projection
      mtl.parameters.CameraPosition = camera.position

      mtl.parameters.BaseColorMapTransform = textureTransform
    }
    mesh.draw()
  }

  const looper = loop(frame)
  return () => {
    looper.stop()
  }
}

function demoCamera() {
  const data = {
    theta: 0,
    phi: 90,
    distance: 6,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
    update: (mouse: Mouse, device: Device) => updateCamera(data, mouse, device),
  }
  return data
}

function updateCamera(camera: ReturnType<typeof demoCamera>, mouse: Mouse, device: Device) {
  mouse.update()
  if (mouse.leftButtonIsPressed) {
    camera.theta -= mouse.dx * 0.1
    camera.phi -= mouse.dy * 0.1
  }
  if (mouse.middleButtonIsPressed) {
    camera.distance += mouse.dy * 0.01
    camera.distance = Math.max(0.1, camera.distance)
  }

  // prettier-ignore
  camera.position.initSpherical(
    camera.phi * DEGREE_TO_RAD,
    camera.theta * DEGREE_TO_RAD,
    camera.distance,
  )
  camera.view.initLookAt(camera.position, Vec3.Zero, Vec3.Up).invert()
  camera.projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.01, 1000)
}

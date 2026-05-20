import { ContentLoader } from '@gglib/content'
import {
  BasicMaterial,
  Color,
  createDevice,
  Device,
  planeGeometry,
  PlatformId,
  TaskContext,
  Texture,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { TGA } from '@gglib/loaders'

import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { mountUi, redrawUi } from 'tweak-ui'

const files = {
  avatar: '/testimages/tga/avatar.tga',
  cbw8: '/testimages/tga/cbw8.tga',
  ccm8: '/testimages/tga/ccm8.tga',
  ctc16: '/testimages/tga/ctc16.tga',
  ctc24: '/testimages/tga/ctc24.tga',
  ctc32: '/testimages/tga/ctc32.tga',
  ubw8: '/testimages/tga/ubw8.tga',
  ucm8: '/testimages/tga/ucm8.tga',
  utc16: '/testimages/tga/utc16.tga',
  utc24: '/testimages/tga/utc24.tga',
  utc32: '/testimages/tga/utc32.tga',
}
const params = {
  texture: files.avatar,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const content = new ContentLoader(device)
  content.registerLoader(TGA.Loader)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  let timeDelta = 0
  let texture: Texture
  mountUi(tools, (ui) => {
    loadTexture(params.texture)
    ui.select(params, 'texture', {
      options: files,
      onchange: () => loadTexture(params.texture),
    })
    ui.group('Texture', () => {
      ui.string({
        label: 'Size',
        disabled: true,
        get value() {
          return `${texture ? texture.width : 0} x ${texture ? texture.height : 0}`
        },
      })
      ui.string({
        label: 'Format',
        disabled: true,
        get value() {
          return texture?.format
        },
      })
      ui.string({
        label: 'Mip levels',
        disabled: true,
        get value() {
          return texture?.mipLevelCount
        },
      })
      ui.string({
        label: 'Size in bytes',
        disabled: true,
        get value() {
          return texture?.sizeInBytes
        },
      })
    })
  })

  const material = new BasicMaterial(device)
  const geometry = planeGeometry(device, {
    vertexTransform: Mat4.createAxisAngle(Vec3.UnitX, 90 * DEGREE_TO_RAD),
  })

  const world = Mat4.createScaleUniform(3)
  const camera = demoCamera()

  function loadTexture(url: string) {
    content
      .loadTexture(url)
      .then((result) => {
        texture = result
        redrawUi()
        material.Texture = result
        material.TextureEnabled = 1
      })
      .catch((e) => {
        console.error(e)
      })
  }

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    timeDelta = ctx.dt
    device.resize()
    camera.update(mouse, device)

    pass.flush()
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.effect.applyInputs(material.inputBlocks)
    material.effect.draw(pass, geometry)
    pass.submit()
    pass.flush()

    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

function demoCamera() {
  const data = {
    theta: 0,
    phi: 90,
    distance: 2,
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
  camera.view.initLookAt(camera.position, Vec3.Zero, Vec3.UnitY).invert()
  camera.projection.initPerspectiveFieldOfView(
    45 * DEGREE_TO_RAD,
    device.output.aspectRatio,
    0.01,
    1000,
    device.ndcMinZ,
  )
}

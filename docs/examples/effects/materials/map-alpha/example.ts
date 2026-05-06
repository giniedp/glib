import {
  BlendState,
  CullState,
  DepthState,
  Device,
  LightType,
  Material,
  Mesh,
  SamplerState,
  createDevice,
  cubeGeometry,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { LightParams, materialProgram } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })

  const material = new Material(device, {
    program: materialProgram({
      ALPHA_MAP: true,
      ALPHA_CLIP: true,
      BASE_COLOR_MAP: true,
      NORMAL_MAP: true,
      V_TANGENT: true,
      LIGHT: true,
      LIGHT_COUNT: 1,
      SHADE_FUNCTION: 'shadePbr',
      ROUGHNESS: true,
      METALLIC: true,
    }),
    parameters: {
      BaseColorMap: device.createTexture({
        source: '/textures/cc0textures.com/MetalWalkway010_2K_Color.jpg',
        sampler: SamplerState.LinearWrap,
        generateMipmap: true,
      }),
      NormalMap: device.createTexture({
        source: '/textures/cc0textures.com/MetalWalkway010_2K_Normal.jpg',
        sampler: SamplerState.LinearWrap,
        generateMipmap: true,
      }),
      AlphaMap: device.createTexture({
        source: '/textures/cc0textures.com/MetalWalkway010_2K_Opacity.jpg',
        sampler: SamplerState.LinearWrap,
        generateMipmap: true,
      }),
      Alpha: 1,
      AlphaClip: 0.9,
      Roughness: 0.25,
      Metallic: 0.0,
    },
  })

  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const light = new LightParams()
  light.enabled = true
  light.type = LightType.Directional
  light.color = [1, 1, 1]
  light.direction = [0, 0, -1]

  const camera = demoCamera()
  const world = Mat4.createIdentity()
  const mesh = new Mesh(device, {
    parts: [cubeGeometry(device)],
    materials: [material],
  })

  function frame(time: number) {
    device.cullState = CullState.CullNone
    device.blendState = BlendState.Disabled
    device.depthState = DepthState.Disabled
    device.resize()
    device.clear(0xff2e2620, 1)

    camera.update(mouse, device)

    mesh.materials.forEach((mtl) => {
      mtl.parameters.World = world
      mtl.parameters.View = camera.view
      mtl.parameters.Projection = camera.projection
      mtl.parameters.CameraPosition = camera.position

      light.assign(0, mtl.parameters)
    })
    mesh.draw()
  }

  TweakUi.mount(tools, (ui) => {
    ui.collapsible('Light', () => {
      ui.checkbox(light, 'enabled')
      ui.color(light, 'color', { format: '[n]rgb' })
      ui.spherical(light, 'direction', {
        codec: TweakUi.sphericalCodec({
          axes: { 0: 'right', 1: 'up', 2: 'back' },
          length: -1,
          result: () => light.direction,
        }),
      })
      ui.slider(material.parameters, 'AlphaClip')
      ui.slider(material.parameters, 'Alpha')
      ui.slider(material.parameters, 'Metallic')
      ui.slider(material.parameters, 'Roughness')
    })
  })
  const looper = loop(frame)
  return () => {
    looper.stop()
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
  camera.view.initLookAt(camera.position, Vec3.Zero, Vec3.Up).invert()
  camera.projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.01, 1000)
}

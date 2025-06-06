import { createDevice, cubeGeometry, LightType, Mesh } from '@gglib/graphics'
import { LightParams, materialProgram } from '@gglib/materials'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })

  const lightingEffect = device.createEffect({
    program: materialProgram({
      DIFFUSE_MAP: true,
      NORMAL_MAP: true,
      EMISSION_MAP: true,
      EMISSION_COLOR: true,
      V_TANGENT: true,
      LIGHT: true,
      LIGHT_COUNT: 1,
      SHADE_FUNCTION: 'shadeBlinn',
    }),
  })

  const light = new LightParams()
  light.enabled = true
  light.type = LightType.Directional
  light.color = [1, 1, 1]
  light.direction = [-1, -1, 0]

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const cam = Mat4.createIdentity()

  const mesh = new Mesh(device, {
    parts: [cubeGeometry(device, { size: 2 })],
    materials: [
      {
        effect: lightingEffect,
        parameters: {
          DiffuseMap: device.createTexture({ source: '/textures/cc0textures.com/LavaColor.jpg' }),
          NormalMap: device.createTexture({ source: '/textures/cc0textures.com/LavaNormal.jpg' }),
          EmissionMap: device.createTexture({ source: '/textures/cc0textures.com/LavaEmission.jpg' }),
          EmissionColor: [0.5, 0.5, 0.5],
        },
      },
    ],
  })

  function frame(time: number) {
    device.resize()
    device.clear(0xff2e2620, 1)

    cam.setTranslationXYZ(0, 0, 2)
    Mat4.invert(cam, view)
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 10)
    world.initRotationY(time / 4000)

    for (const mtl of mesh.materials) {
      mtl.parameters.World = world
      mtl.parameters.View = view
      mtl.parameters.Projection = proj
      mtl.parameters.CameraPosition = cam.getTranslation()

      light.assign(0, mtl.parameters)
    }
    mesh.draw()
  }

  TweakUi.mount(tools, (ui) => {
    ui.collapsible('Light', () => {
      ui.checkbox(light, 'enabled')
      ui.color(light, 'color', { format: '[n]rgb' })

      ui.collapsible('Direction', () => {
        ui.spherical(light, 'direction', {
          codec: TweakUi.sphericalCodec({
            axes: { 0: 'right', 1: 'up', 2: 'back' },
            length: -1,
            result: () => light.direction,
          }),
        })
      })
    })
  })

  const looper = loop(frame)
  return () => {
    looper.stop()
  }
}

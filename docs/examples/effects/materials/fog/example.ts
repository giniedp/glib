import { beginGeometry, buildCube, Color, createDevice, LightType } from '@gglib/graphics'
import { LightParams, materialProgram } from '@gglib/materials'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })

  const lightingEffect = device.createEffect({
    program: materialProgram({
      FOG: true,
      BASE_COLOR_MAP: true,
      NORMAL_MAP: true,
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

  const mesh = beginGeometry()
    .append((b) => {
      for (let i = 0; i < 10; i++) {
        b.withTransform(Mat4.createTranslationXYZ(i * 2, -1, -i * 2), buildCube)
      }
    })
    .endMesh(device, {
      materials: [
        {
          effect: lightingEffect,
          properties: {
            BaseColorMap: device.createTexture({ source: '/textures/prototype/proto_alpha_d.png' }),
            NormalMap: device.createTexture({ source: '/textures/prototype/proto_alpha_n.png' }),
            FogColor: Color.fromRgba(0xff2e2620).xyzw,
            FogParams: [
              5, // fog start
              10, // fog end
              0.5, // density
              1, // type 0=off, 1=exp, 2=exp2, 3=linear
            ],
          },
        },
      ],
    })

  function frame(time: number) {
    device.resize()
    device.clear(0xff2e2620, 1)

    cam.setTranslationXYZ(0, 0, 2)
    Mat4.invert(cam, view)
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)
    // world.initRotationY(time / 4000)

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
    const params = mesh.materials[0].parameters
    ui.collapsible('Fog', () => {
      ui.slider(params.FogParams as number[], 0, { min: 0, max: 10, step: 0.01, label: 'Start' })
      ui.slider(params.FogParams as number[], 1, { min: 0, max: 10, step: 0.01, label: 'End' })
      ui.slider(params.FogParams as number[], 2, { min: 0, max: 10, step: 0.01, label: 'Density' })
      ui.select(params.FogParams as number[], 3, {
        label: 'Type',
        options: [
          { label: 'off', value: 0 },
          { label: 'exp', value: 1 },
          { label: 'exp2', value: 2 },
          { label: 'linear', value: 3 },
        ],
      })
    })
    ui.group('Light', () => {
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

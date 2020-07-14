import { defaultProgram, LightParams } from '@gglib/effects'
import { buildCube, DeviceGL, LightType, ModelBuilder, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const lightingEffect = device.createEffect({
  program: defaultProgram({
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

const model = ModelBuilder.begin().tap((b) => {
  buildCube(b, { size: 2 })
})
  .endModel(device, {
    materials: [{
      effect: lightingEffect,
      parameters: {
        DiffuseMap: device.createTexture({ data: '/assets/textures/prototype/proto_red.png' }),
        NormalMap: device.createTexture({ data: '/assets/textures/prototype/proto_gray_n.png' }),
        EmissionMap: device.createTexture({ data: '/assets/textures/prototype/proto_alpha_op.png' }),
        EmissionColor: [0.2, 0.2, 0.2],
      },
    }],
  })

loop((time, dt) => {

  device.resize()
  device.clear(0xff2e2620, 1)

  cam.setTranslation(0, 0, 2)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 10)
  world.initRotationY(time / 4000)

  model.materials.forEach((mtl) => {
    mtl.parameters.World = world
    mtl.parameters.View = view
    mtl.parameters.Projection = proj
    mtl.parameters.CameraPosition = cam.getTranslation()

    light.assign(0, mtl.parameters)
  })
  model.draw()
})

TweakUi.build('#tweak-ui', (q) => {
  q.group('Light', { open: true }, (b) => {
    b.checkbox(light, 'enabled')
    b.color(light, 'color', { format: '[n]rgb' })

    b.select(light, 'type', {
      options: {
        Directional: LightType.Directional,
        Point: LightType.Point,
        Spot: LightType.Spot,
      },
    })

    b.group('Direction', {
      open: true,
      // hidden: () => light.type === LightType.Point,
    }, (d) => {
      d.slider(light.direction, 0, { min: -1, max: 1, step: 0.01, label: 'X' })
      d.slider(light.direction, 1, { min: -1, max: 1, step: 0.01, label: 'Y' })
      d.slider(light.direction, 2, { min: -1, max: 1, step: 0.01, label: 'Z' })
    })

    b.group('Position', {
      open: true,
      hidden: () => light.type === LightType.Directional,
    }, (p) => {
      p.slider(light.position, 0, { min: -5, max: 5, step: 0.01, label: 'X' })
      p.slider(light.position, 1, { min: -5, max: 5, step: 0.01, label: 'Y' })
      p.slider(light.position, 2, { min: -5, max: 5, step: 0.01, label: 'Z' })
    })

    b.slider(light, 'range', {
      min: 0, max: 10, step: 0.01,
      hidden: () => light.type === LightType.Directional,
    })

    b.slider(light, 'angle', {
      min: 0, max: 90, step: 0.1,
      hidden: () => light.type !== LightType.Spot,
    })
  })
})

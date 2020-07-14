import { defaultProgram, LightParams } from '@gglib/effects'
import { buildCube, Color, DeviceGL, LightType, ModelBuilder, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const lightingEffect = device.createEffect({
  program: defaultProgram({
    FOG: true,
    DIFFUSE_MAP: true,
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

const model = ModelBuilder.begin().tap((b) => {
  for (let i = 0; i < 10; i++) {
    b.withTransform(Mat4.createTranslation(i * 2, -1, -i * 2), buildCube)
  }
})
  .endModel(device, {
    materials: [{
      effect: lightingEffect,
      parameters: {
        DiffuseMap: device.createTexture({ data: '/assets/textures/prototype/proto_alpha_d.png' }),
        NormalMap: device.createTexture({ data: '/assets/textures/prototype/proto_alpha_n.png' }),
        FogColor: Color.fromRgba(0xff2e2620).xyzw,
        FogParams: [
          5,   // fog start
          10,  // fog end
          0.5, // density
          1,   // type 0=off, 1=exp, 2=exp2, 3=linear
        ],
      },
    }],
  })

loop((time, dt) => {

  device.resize()
  device.clear(0xff2e2620, 1)

  cam.setTranslation(0, 0, 2)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)
  // world.initRotationY(time / 4000)

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
  const params = model.materials[0].parameters
  q.group('Fog', { open: true }, (b) => {
    b.slider(params.FogParams, 0, { min: 0, max: 10, step: 0.01, label: 'Start' })
    b.slider(params.FogParams, 1, { min: 0, max: 10, step: 0.01, label: 'End' })
    b.slider(params.FogParams, 2, { min: 0, max: 10, step: 0.01, label: 'Density' })
    b.select(params.FogParams, 3, {
      label: 'Type',
      options: [
        { id: 'off', label: 'off', value: 0 },
        { id: 'exp', label: 'exp', value: 1 },
        { id: 'exp2', label: 'exp2', value: 2 },
        { id: 'linear', label: 'linear', value: 3 },
      ],
    })
  })
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

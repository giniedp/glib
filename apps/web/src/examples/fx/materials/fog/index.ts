import { materialProgram, LightParams } from '@gglib/fx-materials'
import { buildCube, Color, DeviceGL, LightType, ModelBuilder, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const lightingEffect = device.createEffect({
  program: materialProgram({
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

const model = ModelBuilder
  .begin()
  .append((b) => {
    for (let i = 0; i < 10; i++) {
      b.withTransform(Mat4.createTranslation(i * 2, -1, -i * 2), buildCube)
    }
  })
  .closeMesh({
    materials: [{
      effect: lightingEffect,
      parameters: {
        DiffuseMap: device.createTexture({ source: '/assets/textures/prototype/proto_alpha_d.png' }),
        NormalMap: device.createTexture({ source: '/assets/textures/prototype/proto_alpha_n.png' }),
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
  .endModel(device)

loop((time, dt) => {

  device.resize()
  device.clear(0xff2e2620, 1)

  cam.setTranslation(0, 0, 2)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)
  // world.initRotationY(time / 4000)

  model.meshes.forEach((mesh) => {
    mesh.materials.forEach((mtl) => {
      mtl.parameters.World = world
      mtl.parameters.View = view
      mtl.parameters.Projection = proj
      mtl.parameters.CameraPosition = cam.getTranslation()

      light.assign(0, mtl.parameters)
    })
  })
  model.draw()
})

TweakUi.mount('#tweak-ui', (ui) => {
  const params = model.meshes[0].materials[0].parameters
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
          result: () => light.direction
        })
      })
    })
  })
})

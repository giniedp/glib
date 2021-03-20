import { materialProgram, LightParams } from '@gglib/fx-materials'
import { buildCube, DeviceGL, LightType, ModelBuilder, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const lightingEffect = device.createEffect({
  program: materialProgram({
    DIFFUSE_MAP: true,
    LIGHT: true,
    LIGHT_COUNT: 1,
    SHADE_FUNCTION: 'shadeLambert',
  }),
})

const light = new LightParams()
light.enabled = true
light.type = LightType.Directional
light.color = [1, 1, 1]
light.direction = [0, 0, -1]

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

const model = ModelBuilder
  .begin()
  .append(buildCube, { size: 2 })
  .closeMesh({
    materials: [{
      effect: lightingEffect,
      parameters: {
        DiffuseMap: device.createTexture({ source: '/assets/textures/cc0textures.com/TilesColor.jpg' }),
      },
    }],
  })
  .endModel(device, )

loop((time, dt) => {

  device.resize()
  device.clear(0xff2e2620, 1)

  cam.setTranslation(0, 0, 3)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 10)
  world.initRotationY(time / 4000)

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
  ui.collapsible('Light', () => {
    ui.checkbox(light, 'enabled')
    ui.color(light, 'color', { format: '[n]rgb' })
    ui.spherical(light, 'direction', {
      codec: TweakUi.sphericalCodec({
        axes: { 0: 'right', 1: 'up', 2: 'back' },
        length: -1,
        result: () => light.direction
      })
    })
  })
})

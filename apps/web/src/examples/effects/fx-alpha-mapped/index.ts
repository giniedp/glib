import { defaultProgram, LightParams } from '@gglib/fx-materials'
import { BlendState, buildCube, CullState, DepthState, LightType, ModelBuilder, createDevice, Color } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const lightingEffect = device.createEffect({
  program: defaultProgram({
    ALPHA_MAP: true,
    ALPHA_CLIP: true,
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
light.direction = [0, 0, -1]

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

const model = ModelBuilder.begin()
  .append(buildCube, { size: 2 })
  .closeMesh({
    materials: [{
      effect: lightingEffect,
      parameters: {
        DiffuseMap: device.createTexture({ source: '/assets/textures/cc0textures/MetalWalkway010_2K_Color.jpg' }),
        NormalMap: device.createTexture({ source: '/assets/textures/cc0textures/MetalWalkway010_2K_Normal.jpg' }),
        AlphaMap: device.createTexture({ source: '/assets/textures/cc0textures/MetalWalkway010_2K_Opacity.jpg' }),
        Alpha: 1,
        AlphaClip: 0.9
      },
    }],
  })
  .endModel(device, )

loop((time, dt) => {

  device.cullState = CullState.CullNone
  device.blendState = BlendState.Default
  device.depthState = DepthState.Default
  device.resize()
  device.clear(0xff2e2620, 1)

  cam.setTranslation(0, 0, 2)
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

TweakUi.build('#tweak-ui', (q) => {
  q.group('Light', { open: true }, (b) => {
    b.checkbox(light, 'enabled')
    b.color(light, 'color', { format: '[n]rgb' })
    b.direction(light, 'direction', {
      keys: ['0', '1', '2'],
    })
  })
})

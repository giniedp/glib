import { materialProgram, LightParams } from '@gglib/fx-materials'
import { buildCube, buildPlane, DeviceGL, LightType, ModelBuilder, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const normalMapEffect = device.createEffect({
  program: materialProgram({
    DIFFUSE_MAP: true,
    NORMAL_MAP: true,
    SPECULAR_POWER: true,
    SPECULAR_COLOR: true,
    LIGHT: true,
    LIGHT_COUNT: 1,
    SHADE_FUNCTION: 'shadeBlinn',
    V_TANGENT: true,

  }),
})

const normalMapSpecularMapEffect = device.createEffect({
  program: materialProgram({
    DIFFUSE_MAP: true,
    NORMAL_MAP: true,
    SPECULAR_MAP: true,
    SPECULAR_POWER: true,
    SPECULAR_COLOR: true,
    LIGHT: true,
    LIGHT_COUNT: 1,
    SHADE_FUNCTION: 'shadeBlinn',
    DIFFUSE_MAP_SCALE_OFFSET: true,
    NORMAL_MAP_SCALE_OFFSET: true,
    V_TANGENT: true,

  }),
})

const light = new LightParams()
light.type = LightType.Directional
light.color = [1, 1, 1]
light.position = [0, 10, 0]
light.direction = [0, -1, 0]
light.range = 40
light.angle = 45
light.enabled = true

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

TweakUi.mount('#tweak-ui', (ui) => {
  ui.collapsible('Light', () => {
    ui.checkbox(light, 'enabled')
    ui.color(light, 'color', { format: '[n]rgb' })
    ui.slider(light.position, 0, { min: -10, max: 10, step: 0.1, label: 'Position X' })
    ui.slider(light.position, 1, { min: -10, max: 10, step: 0.1, label: 'Position Y' })
    ui.slider(light.position, 2, { min: -10, max: 10, step: 0.1, label: 'Position Z' })
    ui.spherical(light, 'direction', {
      codec: TweakUi.sphericalCodec({
        axes: { 0: 'right', 1: 'up', 2: 'back' },
        length: -1,
        result: () => light.direction
      })
    })
    ui.slider(light, 'range', { min: 0, max: 100, step: 0.01 })
    ui.slider(light, 'angle', { min: 0, max: 90, step: 0.01 })
  })
})

const cubeSize = 5
const model = ModelBuilder.begin().append((b) => {
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x === 0 && y === 0) {
        b.withTransform(Mat4.createTranslation(x * cubeSize, 2, y * cubeSize), (b) => {
          buildPlane(b, { size: cubeSize, tesselation: 4 })
          b.endMeshPart({ materialId: 'water' })
        })
      } else {
        b.withTransform(Mat4.createTranslation(x * cubeSize, 0, y * cubeSize), (b) => {
          buildCube(b, { size: cubeSize, tesselation: 4 })
          b.endMeshPart({ materialId: 'solid' })
        })
      }
    }
  }
})
.closeMesh({
  materials: [{
    name: 'solid',
    effect: normalMapEffect,
    parameters: {
      DiffuseMap: device.createTexture({ source: '/assets/textures/prototype/proto_orange.png' }),
      NormalMap: device.createTexture({ source: '/assets/textures/prototype/proto_gray_n.png' }),
      SpecularPower: 1024,
      SpecularColor: [1, 1, 1],
    },
  }, {
    name: 'water',
    effect: normalMapSpecularMapEffect,
    parameters: {
      DiffuseMap: device.createTexture({ source: '/assets/textures/prototype/proto_water.png' }),
      NormalMap: device.createTexture({ source: '/assets/textures/prototype/proto_water_N.png' }),
      SpecularMap: device.createTexture({ source: '/assets/textures/prototype/proto_water_S.png' }),
      SpecularPower: 255,
    },
  }],
})
  .endModel(device)

loop((time, dt) => {

  device.resize()
  device.clear(0xff2e2620, 1)

  cam.initLookAt({ x: 0, y: 5, z: 3 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)

  model.meshes.forEach((mesh) => {
    mesh.materials.forEach((mtl) => {
      mtl.parameters['World'] = world
      mtl.parameters['View'] = view
      mtl.parameters['Projection'] = proj
      mtl.parameters['CameraPosition'] = cam.getTranslation()
      mtl.parameters['DiffuseMapScaleOffset'] = [1, 1, time / 80000, time / 40000]
      mtl.parameters['NormalMapScaleOffset'] = [1, 1, time / 40000, time / 80000]

      light.assign(0, mtl.parameters)
    })
  })
  model.draw()
})

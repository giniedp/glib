import * as TweakUi from 'tweak-ui'

import { AutoMaterial } from '@gglib/fx-materials'
import {
  buildCone,
  buildCube,
  buildCylinder,
  buildSphere,
  DeviceGL,
  LightType,
  ModelBuilder,
  createDevice,
} from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const meshes = {
  Cube: ModelBuilder.begin()
    .append(buildCube)
    .calculateNormalsAndTangents(true)
    .endMeshPart(device),
  Sphere: ModelBuilder.begin()
    .append(buildSphere)
    .calculateNormalsAndTangents(true)
    .endMeshPart(device),
  Cylinder: ModelBuilder.begin()
    .append(buildCylinder)
    .calculateNormalsAndTangents(true)
    .endMeshPart(device),
  Cone: ModelBuilder.begin()
    .append(buildCone)
    .calculateNormalsAndTangents(true)
    .endMeshPart(device),
}
let mesh = meshes.Cube

const textures = [
  '/assets/textures/prototype/proto_red.png',
  '/assets/textures/prototype/proto_green.png',
  '/assets/textures/prototype/proto_blue.png',
  '/assets/textures/prototype/proto_gray_n.png',
  '/assets/textures/prototype/proto_gray_h.png',
  '/assets/textures/prototype/proto_gray_s.png',
  '/assets/textures/prototype/proto_water.png',
  '/assets/textures/prototype/proto_water_N.png',
  '/assets/textures/prototype/proto_water_H.png',
  '/assets/textures/prototype/proto_water_S.png',
  '/assets/textures/prototype/proto_alpha_d.png',
  '/assets/textures/prototype/proto_alpha_n.png',
  '/assets/textures/prototype/proto_alpha_h.png',
  '/assets/textures/prototype/proto_alpha_op.png',
  '/assets/textures/sharetextures/StoneWall_Base.png',
  '/assets/textures/sharetextures/StoneWall_Normal.png',
  '/assets/textures/sharetextures/StoneWall_Height.png',
  '/assets/textures/sharetextures/StoneWall_AO.png',
  '/assets/textures/sharetextures/StoneWall_Roughness.png',
]
const textureOptions: TweakUi.SelectModelOptions = [
  { label: '-- none --', value: null }
]
for (const source of textures) {
  textureOptions.push({
    label: source.split('/')[4],
    value: device.createTexture({
      source: source,
    }),
  })
}

const material = new AutoMaterial(device)

material.SpecularPower = 64
material.LightCount = 2
material.ShadeFunction = 'shadeOptimized'

TweakUi.mount('#tweak-ui', (ui: TweakUi.Builder) => {
  ui.select({
    label: 'Mesh',
    options: meshes,
    value: mesh,
    onChange: (m) => (mesh = m.value),
  })

  ui.select(material, 'LightCount', {
    options: [0, 1, 2, 3, 4],
  })

  ui.select(material, 'ShadeFunction', {
    options: [
      'shadeNone',
      'shadeLambert',
      'shadeBlinn',
      'shadePhong',
      'shadeCookTorrance',
      'shadeSzirmay',
      'shadeOptimized',
      'shadePbr',
    ],
  })

  ui.collapsible('Ambient', {}, () => {
    let colorOn = false
    let color = [0, 0, 0]
    ui.select(material, 'AmbientMap', { options: textureOptions })
    ui.checkbox({
      label: 'AmbientColor',
      value: colorOn,
      onChange: (m, value: boolean) => {
        colorOn = value
        material.AmbientColor = colorOn ? color : null
      },
    })
    ui.add({
      type: 'color',
      format: '[n]rgb',
      value: color,
      hidden: () => !colorOn,
      onInput: (it) => (color = material.AmbientColor = it.value as number[]),
    })
  })

  ui.collapsible('Diffuse', {}, () => {
    let colorOn = false
    let color = [0, 0, 0]
    ui.select(material, 'DiffuseMap', { options: textureOptions })
    ui.checkbox({
      label: 'DiffuseColor',
      value: colorOn,
      onChange: (m, value: boolean) => {
        colorOn = value
        material.DiffuseColor = colorOn ? color : null
      },
    })
    ui.color({
      format: '[n]rgb',
      value: color,
      hidden: () => !colorOn,
      onInput: (it) => (color = material.DiffuseColor = it.value as number[]),
    })
  })

  ui.collapsible('Specular', {}, () => {
    let colorOn = false
    let color = [0, 0, 0]
    ui.slider(material, 'SpecularPower', { min: 1, max: 1024, step: 1 })
    ui.select(material, 'SpecularMap', { options: textureOptions })
    ui.checkbox({
      label: 'SpecularColor',
      value: colorOn,
      onChange: (m, value: boolean) => {
        colorOn = value
        material.SpecularColor = colorOn ? color : null
      },
    })
    ui.color({
      format: '[n]rgb',
      value: color,
      hidden: () => !colorOn,
      onInput: (it) => (color = material.SpecularColor = it.value as number[]),
    })
  })

  ui.collapsible('Emission', {}, () => {
    let colorOn = false
    let color = [0, 0, 0]
    ui.select(material, 'EmissionMap', { options: textureOptions })
    ui.checkbox({
      label: 'EmissionColor',
      value: colorOn,
      onChange: (m, value: boolean) => {
        colorOn = value
        material.EmissionColor = colorOn ? color : null
      },
    })
    ui.add({
      type: 'color',
      format: '[n]rgb',
      value: color,
      hidden: () => !colorOn,
      onInput: (it) => (color = material.EmissionColor = it.value as number[]),
    })
  })

  ui.collapsible('Normal', {}, () => {
    ui.select(material, 'NormalMap', { options: textureOptions })
  })

  ui.collapsible('Parallax', {}, () => {
    ui.select(material, 'ParallaxMap', { options: textureOptions })
    ui.slider(material, 'ParallaxOcclusionSamples', { min: 0, max: 64, step: 1 })
    ui.slider(material, 'ParallaxScale', { min: -1, max: 1, step: 0.01 })
    ui.slider(material, 'ParallaxBias', { min: -1, max: 1, step: 0.01 })
  })

  ui.collapsible('OcclusionMap', {}, () => {
    ui.select(material, 'OcclusionMap', { options: textureOptions })
  })

  ui.collapsible('MetallicRoughness', {}, () => {
    ui.select(material, 'MetallicRoughnessMap', { options: textureOptions })
    ui.slider(material, 'Metallic', { min: 0, max: 1, step: 0.01 })
    ui.slider(material, 'Roughness', { min: 0, max: 1, step: 0.01 })
  })
})

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

loop((time, dt) => {
  device.resize()
  device.clear(0xff2e2620, 1)

  world.initRotationY(time / 4000)
  cam.initTranslation(0, 0, 1.0)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(
    Math.PI / 2,
    device.drawingBufferAspectRatio,
    0.1,
    100,
  )

  material.World = world
  material.View = view
  material.Projection = proj

  if (material.LightCount > 0) {
    material.getLight(0).type = LightType.Directional
    material.getLight(0).enabled = true
    material.getLight(0).color = [1, 1, 1]
    material.getLight(0).direction = [-1, 0, -1]
  }

  if (material.LightCount > 1) {
    material.getLight(1).type = LightType.Directional
    material.getLight(1).enabled = true
    material.getLight(1).color = [1, 1, 1]
    material.getLight(1).direction = [1, 0, -1]
  }

  if (mesh) {
    material.draw(mesh)
  }
})

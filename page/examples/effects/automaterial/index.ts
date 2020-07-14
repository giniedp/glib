import * as TweakUi from 'tweak-ui'

import { AutoMaterial } from '@gglib/effects'
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
    .tap(buildCube)
    .calculateNormalsAndTangents(true)
    .endMesh(device),
  Sphere: ModelBuilder.begin()
    .tap(buildSphere)
    .calculateNormalsAndTangents(true)
    .endMesh(device),
  Cylinder: ModelBuilder.begin()
    .tap(buildCylinder)
    .calculateNormalsAndTangents(true)
    .endMesh(device),
  Cone: ModelBuilder.begin()
    .tap(buildCone)
    .calculateNormalsAndTangents(true)
    .endMesh(device),
}
let mesh = meshes.Cube

const textureOptions: TweakUi.SelectModelOptions = [
  { id: 'null', label: '-- none --', value: null },

  {
    id: 'proto_red',
    label: 'proto_red',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_red.png',
    }),
  },
  {
    id: 'proto_green',
    label: 'proto_green',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_green.png',
    }),
  },
  {
    id: 'proto_blue',
    label: 'proto_blue',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_blue.png',
    }),
  },
  {
    id: 'proto_gray_n',
    label: 'proto_gray_n',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_gray_n.png',
    }),
  },
  {
    id: 'proto_gray_h',
    label: 'proto_gray_h',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_gray_h.png',
    }),
  },
  {
    id: 'proto_gray_s',
    label: 'proto_gray_s',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_gray_s.png',
    }),
  },

  {
    id: 'proto_water',
    label: 'proto_water',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_water.png',
    }),
  },
  {
    id: 'proto_water_N',
    label: 'proto_water_N',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_water_N.png',
    }),
  },
  {
    id: 'proto_water_H',
    label: 'proto_water_H',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_water_H.png',
    }),
  },
  {
    id: 'proto_water_S',
    label: 'proto_water_S',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_water_S.png',
    }),
  },

  {
    id: 'proto_alpha',
    label: 'proto_alpha',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_alpha_d.png',
    }),
  },
  {
    id: 'proto_alpha_n',
    label: 'proto_alpha_n',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_alpha_n.png',
    }),
  },
  {
    id: 'proto_alpha_h',
    label: 'proto_alpha_h',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_alpha_h.png',
    }),
  },
  {
    id: 'proto_alpha_op',
    label: 'proto_alpha_op',
    value: device.createTexture({
      data: '/assets/textures/prototype/proto_alpha_op.png',
    }),
  },

  {
    id: 'SciFiWall',
    label: 'SciFiWall',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/SciFiWall_diffuse.png',
    }),
  },
  {
    id: 'SciFiWall_normal',
    label: 'SciFiWall_normal',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/SciFiWall_normal.png',
    }),
  },
  {
    id: 'SciFiWall_height',
    label: 'SciFiWall_height',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/SciFiWall_height.png',
    }),
  },
  {
    id: 'SciFiWall_ao',
    label: 'SciFiWall_ao',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/SciFiWall_ao.png',
    }),
  },
  {
    id: 'SciFiWall_metallic',
    label: 'SciFiWall_metallic',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/SciFiWall_metallic.png',
    }),
  },
  {
    id: 'SciFiWall_roughness',
    label: 'SciFiWall_roughness',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/SciFiWall_roughness.png',
    }),
  },

  {
    id: 'StoneWall_Base',
    label: 'StoneWall_Base',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/StoneWall_Base.png',
    }),
  },
  {
    id: 'StoneWall_Normal',
    label: 'StoneWall_Normal',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/StoneWall_Normal.png',
    }),
  },
  {
    id: 'StoneWall_Height',
    label: 'StoneWall_Height',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/StoneWall_Height.png',
    }),
  },
  {
    id: 'StoneWall_AO',
    label: 'StoneWall_AO',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/StoneWall_AO.png',
    }),
  },
  {
    id: 'StoneWall_Roughness',
    label: 'StoneWall_Roughness',
    value: device.createTexture({
      data: '/assets/textures/sharetextures/StoneWall_Roughness.png',
    }),
  },
]

const material = new AutoMaterial(device)

material.SpecularPower = 64
material.LightCount = 2
material.ShadeFunction = 'shadeOptimized'

TweakUi.build('#tweak-ui', (q: TweakUi.Builder) => {
  q.add({
    type: 'select',
    label: 'Mesh',
    options: meshes,
    value: mesh,
    onChange: (ctrl) => (mesh = ctrl.value),
  })

  q.select(material, 'LightCount', {
    options: [0, 1, 2, 3, 4],
  })

  q.select(material, 'ShadeFunction', {
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

  q.group('Ambient', {}, (c) => {
    let colorOn = false
    let color = [0, 0, 0]
    c.select(material, 'AmbientMap', { options: textureOptions })
    c.add({
      type: 'checkbox',
      label: 'AmbientColor',
      value: colorOn,
      onChange: (it) => {
        colorOn = it.value
        material.AmbientColor = colorOn ? color : null
      },
    })
    c.add({
      type: 'color',
      format: '[n]rgb',
      value: color,
      hidden: () => !colorOn,
      onInput: (it) => (color = material.AmbientColor = it.value as number[]),
    })
  })

  q.group('Diffuse', {}, (c) => {
    let colorOn = false
    let color = [0, 0, 0]
    c.select(material, 'DiffuseMap', { options: textureOptions })
    c.add({
      type: 'checkbox',
      label: 'DiffuseColor',
      value: colorOn,
      onChange: (it) => {
        colorOn = it.value
        material.DiffuseColor = colorOn ? color : null
      },
    })
    c.add({
      type: 'color',
      format: '[n]rgb',
      value: color,
      hidden: () => !colorOn,
      onInput: (it) => (color = material.DiffuseColor = it.value as number[]),
    })
  })

  q.group('Specular', {}, (c) => {
    let colorOn = false
    let color = [0, 0, 0]
    c.slider(material, 'SpecularPower', { min: 1, max: 1024, step: 1 })
    c.select(material, 'SpecularMap', { options: textureOptions })
    c.add({
      type: 'checkbox',
      label: 'SpecularColor',
      value: colorOn,
      onChange: (it) => {
        colorOn = it.value
        material.SpecularColor = colorOn ? color : null
      },
    })
    c.add({
      type: 'color',
      format: '[n]rgb',
      value: color,
      hidden: () => !colorOn,
      onInput: (it) => (color = material.SpecularColor = it.value as number[]),
    })
  })

  q.group('Emission', {}, (c) => {
    let colorOn = false
    let color = [0, 0, 0]
    c.select(material, 'EmissionMap', { options: textureOptions })
    c.add({
      type: 'checkbox',
      label: 'EmissionColor',
      value: colorOn,
      onChange: (it) => {
        colorOn = it.value
        material.EmissionColor = colorOn ? color : null
      },
    })
    c.add({
      type: 'color',
      format: '[n]rgb',
      value: color,
      hidden: () => !colorOn,
      onInput: (it) => (color = material.EmissionColor = it.value as number[]),
    })
  })

  q.group('Normal', {}, (c) => {
    c.select(material, 'NormalMap', { options: textureOptions })
  })

  q.group('Parallax', {}, (c) => {
    c.select(material, 'ParallaxMap', { options: textureOptions })
    c.slider(material, 'ParallaxOcclusionSamples', { min: 0, max: 64, step: 1 })
    c.slider(material, 'ParallaxScale', { min: -1, max: 1, step: 0.01 })
    c.slider(material, 'ParallaxBias', { min: -1, max: 1, step: 0.01 })
  })

  q.group('OcclusionMap', {}, (c) => {
    c.select(material, 'OcclusionMap', { options: textureOptions })
  })

  q.group('MetallicRoughness', {}, (c) => {
    c.select(material, 'MetallicRoughnessMap', { options: textureOptions })
    c.slider(material, 'Metallic', { min: 0, max: 1, step: 0.01 })
    c.slider(material, 'Roughness', { min: 0, max: 1, step: 0.01 })
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

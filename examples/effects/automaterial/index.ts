import * as TweakUi from 'tweak-ui'

import { AutoMaterial } from '@gglib/effects'
import { Color, Device, ModelBuilder, buildCube, buildSphere, buildCylinder, buildCone } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const meshes = {
  Cube: ModelBuilder.begin().tap(buildCube).calculateNormalsAndTangents(true).endMesh(device),
  Sphere: ModelBuilder.begin().tap(buildSphere).calculateNormalsAndTangents(true).endMesh(device),
  Cylinder: ModelBuilder.begin().tap(buildCylinder).calculateNormalsAndTangents(true).endMesh(device),
  Cone: ModelBuilder.begin().tap(buildCone).calculateNormalsAndTangents(true).endMesh(device),
}
let mesh = meshes.Cube

const diffuseMaps = {
  null: null as null,
  Red: device.createTexture({ data: '/assets/textures/prototype/proto_red.png' }),
  Water: device.createTexture({ data: '/assets/textures/prototype/proto_water.png' }),
  Pipe: device.createTexture({ data: '/assets/textures/prototype/proto_pipe.png' }),
}
const normalMaps = {
  null: null as null,
  Red: device.createTexture({ data: '/assets/textures/prototype/proto_gray_n.png' }),
  Water: device.createTexture({ data: '/assets/textures/prototype/proto_water_N.png' }),
  Pipe: device.createTexture({ data: '/assets/textures/prototype/proto_pipe_N.png' }),
}
const specularMaps = {
  null: null as null,
  Red: device.createTexture({ data: '/assets/textures/prototype/proto_gray_s.png' }),
  Water: device.createTexture({ data: '/assets/textures/prototype/proto_water_S.png' }),
  Pipe: device.createTexture({ data: '/assets/textures/prototype/proto_pipe_S.png' }),
}

const material = new AutoMaterial(device)

material.DiffuseMap = diffuseMaps.Red
material.NormalMap = normalMaps.Red
material.SpecularMap = specularMaps.Red
material.SpecularPower = 64
material.LightCount = 2

TweakUi.build('#tweak-ui', (q: TweakUi.Builder) => {
  q.add({
    type: 'select',
    label: 'Mesh',
    options: meshes,
    value: mesh,
    onChange: (ctrl) => mesh = ctrl.value,
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

  q.group('Diffuse', {}, (c) => {
    let colorOn = false
    let color = [0, 0, 0, 0]
    c.select(material, 'DiffuseMap', { options: diffuseMaps })
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
      format: 'rgba',
      hidden: () => !colorOn,
      onInput: (it) => color = material.DiffuseColor = Color.fromRgbaHex(it.value as string).xyzw,
    })
  })

  q.group('Specular', {}, (c) => {
    let colorOn = false
    let color = [0, 0, 0, 0]
    c.slider(material, 'SpecularPower', { min: 1, max: 1024, step: 1 })
    c.select(material, 'SpecularMap', { options: specularMaps })
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
      format: 'rgba',
      hidden: () => !colorOn,
      onInput: (it) => color = material.SpecularColor = Color.fromRgbaHex(it.value as string).xyzw,
    })
  })

  q.group('Normal', {}, (c) => {
    c.select(material, 'NormalMap', { options: normalMaps })
  })
})

material.ShadeFunction = 'shadePhong'

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

let time = 0
loop((dt) => {
  time += dt

  device.resize()
  device.clear(0xff2e2620, 1)

  world.initRotationY(time / 4000)
  cam.initTranslation(0, 0, 2.0)
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 100)

  material.World = world
  material.View = view
  material.Projection = proj

  if (material.LightCount > 0) {
    material.getLight(0).Direction = [-1, 0, -1]
    material.getLight(0).Color = [1, 1, 1, 1]
    material.getLight(0).Misc = [1, 1, 1, 1]
  }

  if (material.LightCount > 1) {
    material.getLight(1).Direction = [1, 0, -1]
    material.getLight(1).Color = [1, 1, 1, 1]
    material.getLight(1).Misc = [1, 1, 1, 1]
  }

  if (mesh) {
    material.draw(mesh)
  }
})

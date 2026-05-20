import {
  coneGeometry,
  createDevice,
  cubeGeometry,
  CullState,
  cylinderGeometry,
  Device,
  LightType,
  SamplerState,
  sphereGeometry,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({
    canvas,
  })

  const meshes = {
    Cube: cubeGeometry(device),
    Sphere: sphereGeometry(device),

    Cylinder: cylinderGeometry(device),
    Cone: coneGeometry(device),
  }
  const camera = demoCamera()
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const world = Mat4.createIdentity()
  let mesh = meshes.Sphere

  const textures = [
    '/textures/prototype/proto_red.png',
    '/textures/prototype/proto_green.png',
    '/textures/prototype/proto_blue.png',
    '/textures/prototype/proto_gray_n.png',
    '/textures/prototype/proto_gray_h.png',
    '/textures/prototype/proto_gray_s.png',
    '/textures/prototype/proto_water.png',
    '/textures/prototype/proto_water_N.png',
    '/textures/prototype/proto_water_H.png',
    '/textures/prototype/proto_water_S.png',
    '/textures/prototype/proto_alpha_d.png',
    '/textures/prototype/proto_alpha_n.png',
    '/textures/prototype/proto_alpha_h.png',
    '/textures/prototype/proto_alpha_op.png',
    '/textures/sharetextures/StoneWall_Base.png',
    '/textures/sharetextures/StoneWall_Normal.png',
    '/textures/sharetextures/StoneWall_Height.png',
    '/textures/sharetextures/StoneWall_AO.png',
    '/textures/sharetextures/StoneWall_Roughness.png',
  ]
  const textureOptions: TweakUi.SelectModelOptions = [{ label: '-- none --', value: null }]
  for (const source of textures) {
    textureOptions.push({
      label: source.split('/')[3],
      value: device.createTexture({
        source: source,
        sampler: SamplerState.LinearWrap,
      }),
    })
  }

  const material = new AutoMaterial(device)

  material.LightCount = 2
  material.ShadeFunction = 'shadeBlinn'

  TweakUi.mount(tools, (ui: TweakUi.Builder) => {
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

    ui.collapsible('Ambient Color', {}, () => {
      ui.select(material, 'AmbientColorMap', { label: 'Texture', options: textureOptions })
      ui.color(material, 'AmbientColor', {
        label: 'Color',
        type: 'color',
        format: '[n]rgb',
      })
    })

    ui.collapsible('Base Color', {}, () => {
      ui.select(material, 'BaseColorMap', { label: 'Texture', options: textureOptions })
      ui.color(material, 'BaseColor', {
        label: 'Color',
        type: 'color',
        format: '[n]rgb',
      })
    })

    ui.collapsible('Specular Color', {}, () => {
      ui.slider(material, 'Roughness', { label: 'Roughness', min: 0, max: 1, step: 0.001 })
      ui.select(material, 'SpecularColorMap', { label: 'Texture', options: textureOptions })
      ui.color(material, 'SpecularColor', {
        label: 'Color',
        type: 'color',
        format: '[n]rgb',
      })
    })

    ui.collapsible('Emission', {}, () => {
      let colorOn = false
      let color = [0, 0, 0]
      ui.select(material, 'EmissiveColorMap', { options: textureOptions })
      ui.checkbox({
        label: 'EmissiveColor',
        value: colorOn,
        onChange: (m, value) => {
          colorOn = !!value
          material.EmissiveColor = colorOn ? color : null!
        },
      })
      ui.add({
        type: 'color',
        format: '[n]rgb',
        value: color,
        hidden: () => !colorOn,
        oninput: (it) => (color = material.EmissiveColor = it.value as number[]),
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

  function frame(time: number, dt: number) {
    device.resize()
    device.clear(0xff2e2620, 1)
    device.cullState = CullState.CullClockWise

    camera.update(mouse, device)

    material.World = world
    material.View = camera.view
    material.Projection = camera.projection

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
  }

  return loop(frame).stop
}

function demoCamera() {
  const data = {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
    update: (mouse: Mouse, device: Device) => updateCamera(data, mouse, device),
  }
  return data
}

function updateCamera(camera: ReturnType<typeof demoCamera>, mouse: Mouse, device: Device) {
  mouse.update()
  if (mouse.leftButtonIsPressed) {
    camera.theta -= mouse.dx * 0.1
    camera.phi -= mouse.dy * 0.1
  }
  if (mouse.middleButtonIsPressed) {
    camera.distance += mouse.dy * 0.01
    camera.distance = Math.max(0.1, camera.distance)
  }

  // prettier-ignore
  camera.position.initSpherical(
    camera.phi * DEGREE_TO_RAD,
    camera.theta * DEGREE_TO_RAD,
    camera.distance,
  )
  camera.view.initLookAt(camera.position, Vec3.Zero, Vec3.UnitY).invert()
  camera.projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.01, 1000)
}

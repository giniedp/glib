import {
  BasicMaterial,
  boxGeometry,
  BuildBoxOptions,
  BuildCylinderOptions,
  BuildSphereOptions,
  BuildTorusOptions,
  Color,
  createDevice,
  CullState,
  cylinderGeometry,
  DepthState,
  Device,
  FALSE,
  Geometry,
  PlatformId,
  sphereGeometry,
  TaskContext,
  torusGeometry,
  TRUE,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, vec3, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform }).ready

  const msaaTarget = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const depthTarget = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 0, 2)
  const projection = Mat4.createIdentity()
  const viewProjection = Mat4.createIdentity()

  const material = new BasicMaterial(device)
  const texture = device.createTexture({
    source: '/textures/prototype/proto_red.png',
  })
  material.Texture = texture
  material.World = world
  material.View = view
  material.Projection = projection
  material.TextureEnabled = TRUE
  material.CameraPosition = cameraPosition
  material.LightingEnabled = FALSE
  material.SpecularColor = Vec3.create(0.5, 0.5, 0.5)

  material.setDirectionalLight(0, vec3([1, 1, 1]), vec3([0, 0, -1]))
  material.setDirectionalLight(1, vec3([1, 0, 1]), vec3([-1, 1, 0]))

  let geometry = boxGeometry(device, {
    size: 1,
  })

  createUi(tools, device, material, (g) => {
    geometry.dispose()
    geometry = g
  })

  function update(dt: number) {
    world.rotateX((15 * DEGREE_TO_RAD * dt) / 1000)
    world.rotateY((10 * DEGREE_TO_RAD * dt) / 1000)
    world.rotateZ((5 * DEGREE_TO_RAD * dt) / 1000)

    view.initTranslation(cameraPosition).invert()
    projection.initPerspectiveFieldOfView(
      60 * DEGREE_TO_RAD,
      device.output.width / device.output.height,
      0.1,
      100,
      device.ndcMinZ,
    )
    Mat4.multiply(projection, view, viewProjection)
  }

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    update(ctx.dt)
    device.resize()
    msaaTarget.resizeToMatch(device.output)
    depthTarget.resizeToMatch(device.output)

    pass.setRenderTarget(0, msaaTarget, 0, 0, device.output)
    pass.setViewportState(0, 0, msaaTarget.width, msaaTarget.height)
    pass.setDepthTarget(depthTarget)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setDepthState(DepthState.Disabled)
    pass.setCullState(CullState.CullBack)
    pass.setClearDepth(1)
    pass.clear()

    material.effect.draw(pass, geometry, material.inputs)
    pass.submit()
    pass.resolve()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

function createUi(
  tools: HTMLElement,
  device: Device,
  material: BasicMaterial,
  spawnGeometry: (geometry: Geometry) => void,
) {
  mountUi(tools, (ui) => {
    ui.group('Cube', { collapsible: true }, () => {
      const options: BuildBoxOptions = {
        size: 1,
        segments: 1,
      }
      function update() {
        spawnGeometry(boxGeometry(device, options))
      }
      ui.number(options, 'size', { slider: true, min: 0, max: 2, step: 0.1, oninput: update })
      ui.number(options, 'segments', { slider: true, min: 1, max: 64, step: 1, oninput: update })
    })

    ui.group('Sphere', { collapsible: true }, () => {
      const options: BuildSphereOptions = {
        radius: 0.5,
        slices: 8,
        stacks: 8,
      }
      function update() {
        spawnGeometry(sphereGeometry(device, options))
      }
      ui.number(options, 'radius', { slider: true, min: 0, max: 2, step: 0.1, oninput: update })
      ui.number(options, 'slices', { slider: true, min: 1, max: 64, step: 1, oninput: update })
      ui.number(options, 'stacks', { slider: true, min: 1, max: 64, step: 1, oninput: update })
    })

    ui.group('Cylinder', { collapsible: true }, () => {
      const options: BuildCylinderOptions = {
        topRadius: 0.5,
        bottomRadius: 0.5,
        heightSegments: 8,
        radialSegments: 32,
        startAngle: 0,
        endAngle: Math.PI * 2,
        closeTop: true,
        closeBottom: true,
      }
      function update() {
        spawnGeometry(cylinderGeometry(device, options))
      }
      ui.boolean(options, 'closeTop', { oninput: update })
      ui.boolean(options, 'closeBottom', { oninput: update })
      ui.number(options, 'topRadius', { slider: true, min: 0, max: 2, step: 0.1, oninput: update })
      ui.number(options, 'bottomRadius', { slider: true, min: 0, max: 2, step: 0.1, oninput: update })
      ui.number(options, 'heightSegments', { slider: true, min: 1, max: 64, step: 1, oninput: update })
      ui.number(options, 'radialSegments', { slider: true, min: 1, max: 64, step: 1, oninput: update })
      ui.number(options, 'startAngle', {
        slider: true,
        min: 0,
        max: Math.PI * 2,
        step: 0.01,
        oninput: update,
      })
      ui.number(options, 'endAngle', {
        slider: true,
        min: 0,
        max: Math.PI * 2,
        step: 0.01,
        oninput: update,
      })
    })

    ui.group('Torus', { collapsible: true }, () => {
      const options: BuildTorusOptions = {
        innerRadius: 0.25,
        outerRadius: 0.5,
        tesselation: 8,
      }
      function update() {
        spawnGeometry(torusGeometry(device, options))
      }
      ui.number(options, 'innerRadius', { slider: true, min: 0, max: 1, step: 0.01, oninput: update })
      ui.number(options, 'outerRadius', { slider: true, min: 0, max: 1, step: 0.01, oninput: update })
      ui.number(options, 'tesselation', { slider: true, min: 1, max: 64, step: 1, oninput: update })
    })

    ui.group('Material', { collapsible: true }, () => {
      ui.number(material, 'Roughness', { slider: true, min: 0, max: 1, step: 0.001 })
      ui.boolean(material, 'TextureEnabled')
      ui.color(material, 'BaseColor', { format: '[n]rgb' })
      ui.color(material, 'SpecularColor', { format: '[n]rgb' })
      ui.boolean(material, 'LightingEnabled')
      ui.spherical(material.inputs, 'lights.direction[0]')
      ui.color(material.inputs, 'lights.color[0]', {
        format: '[n]rgb',
      })
      //g.color(material, 'FogColor', { codec: })
      // ui.number(material, 'FogStart', { slider: true, min: 0, max: 10, step: 0.1 })
      // ui.number(material, 'FogEnd', { slider: true, min: 0, max: 20, step: 0.1 })
      // ui.boolean(material, 'FogEnabled')
    })
  })
}

import {
  BasicMaterial,
  BlendState,
  boxGeometry,
  Color,
  createDevice,
  CullState,
  DepthState,
  Device,
  FrameContext,
  Geometry,
  PlatformId,
  TRUE,
} from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  Mat4,
  mat4$initLookAt,
  mat4$initPerspectiveFieldOfView,
  mat4$invert,
  mat4$scaleXYZ,
  mat4CreateTranslationXYZ,
  mat4Identity,
  mat4Invert,
  mat4Multiply,
  vec3,
  vec3$normalize,
} from '@gglib/math'
import { mountUi } from 'tweak-ui'

const settings = {
  fov: 60,
  aspect: 1.5,
  near: 1,
  far: 10,
  reversedZ: false,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  mountUi(tools, (ui) => {
    ui.scalar(settings, 'fov', { label: 'Field of View', unit: '°', range: true, min: 1, max: 170, step: 1 })
    ui.scalar(settings, 'aspect', { label: 'Aspect', range: true, min: 0.1, max: 4, step: 0.01 })
    ui.scalar(settings, 'near', { label: 'Near', range: true, min: 0.1, max: 10, step: 0.1 })
    ui.scalar(settings, 'far', { label: 'Far', range: true, min: 0.1, max: 20, step: 0.1 })
  })

  // A cube that covers the whole NDC space: x and y from -1 to 1, z from ndcMinZ to 1.
  // Transformed with the inverse projection matrix it becomes the view frustum.
  const minZ = device.ndcMinZ
  const ndcBox = {
    width: 2,
    height: 2,
    depth: 1 - minZ,
    offset: { x: 0, y: 0, z: (1 + minZ) / 2 },
  }
  const frustum = boxGeometry(device, ndcBox)
  const frustumMaterial = new BasicMaterial(device, { properties: {} })
  frustumMaterial.BaseColor = vec3(1, 1, 0)
  frustumMaterial.Alpha = 0.5
  frustumMaterial.UseBlend = TRUE

  // The same cube as wireframe, drawn untransformed next to the frustum
  const ndcCube = boxGeometry(device, { ...ndcBox, lines: true })
  const ndcCubeMaterial = new BasicMaterial(device, { properties: {} })
  // placement of the NDC space in the scene: to the right, scaled up and z flipped,
  // so that NDC z grows away from the viewer, like the distance in the frustum
  const ndcWorld = mat4CreateTranslationXYZ(25, 0, -5)
  mat4$scaleXYZ(ndcWorld, 5, 5, -5)

  // Small cubes in view space, along the view direction at distance 1 to 20.
  // Each one is drawn twice: in view space and projected into NDC space.
  const marker = boxGeometry(device, { size: 0.3 })
  const markers = Array.from({ length: 20 }, (_, i) => {
    return {
      world: mat4CreateTranslationXYZ(0, 0, -(i + 1)),
      ndcWorld: mat4Identity(),
      material: new BasicMaterial(device, { properties: {} }),
      ndcMaterial: new BasicMaterial(device, { properties: {} }),
    }
  })

  const materials = [
    frustumMaterial,
    ndcCubeMaterial,
    ...markers.map((it) => it.material),
    ...markers.map((it) => it.ndcMaterial),
  ]
  // the ambient light is shared by all materials
  for (const material of materials) {
    material.AmbientColor = vec3(0.5)
    material.AmbientColorTop = vec3(1)
    material.AmbientDirection = vec3$normalize(vec3(1, 1, 1))
  }
  for (const it of markers) {
    it.material.BaseColor = vec3(1, 0.2, 0.2)
    it.ndcMaterial.BaseColor = vec3(1, 0.2, 0.2)
  }

  const depthTarget = device.createDepthTarget({
    format: 'depth24plus',
    sampleCount: 4,
  })
  const renderTarget = device.createRenderTarget({
    sampleCount: 4,
  })

  // the projection to visualize
  const projection = mat4Identity()
  const inverseProjection = mat4Identity()
  // the camera that looks at the scene from outside
  const camView = mat4Identity()
  const camProjection = mat4Identity()

  const pass = device.renderPass
  function frame(ctx: FrameContext) {
    device.resize()
    depthTarget.resizeToMatch(device.output)
    renderTarget.resizeToMatch(device.output)

    if (materials.some((it) => !it.effect.isReady)) {
      return
    }

    mat4$initPerspectiveFieldOfView(
      projection,
      settings.fov * DEGREE_TO_RAD,
      settings.aspect,
      settings.near,
      settings.far,
      device.ndcMinZ,
      settings.reversedZ,
    )
    mat4Invert(projection, inverseProjection)

    // markers in NDC space: ndcWorld * projection * markerWorld
    for (const it of markers) {
      mat4Multiply(ndcWorld, projection, it.ndcWorld)
      mat4Multiply(it.ndcWorld, it.world, it.ndcWorld)
    }

    // orbit around the scene
    const angle = ctx.time * 10 * DEGREE_TO_RAD
    const position = vec3(12 + Math.sin(angle) * 40, 20, -10 + Math.cos(angle) * 40)
    mat4$initLookAt(camView, position, vec3(12, 0, -10), vec3.UnitY)
    mat4$invert(camView)
    mat4$initPerspectiveFieldOfView(
      camProjection,
      60 * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.1,
      1000,
      device.ndcMinZ,
    )

    pass.setRenderTarget(0, renderTarget, 0, 0, device.output)
    pass.setDepthTarget(depthTarget)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearDepth(1)
    pass.clear()
    pass.setDepthState(DepthState.LessEqual)
    pass.setCullState(CullState.Disabled)

    // opaque objects first
    pass.setRenderBlend(0, BlendState.Opaque)
    draw(ndcCubeMaterial, ndcWorld, ndcCube)
    for (const it of markers) {
      draw(it.material, it.world, marker)
      draw(it.ndcMaterial, it.ndcWorld, marker)
    }

    // then the transparent frustum
    pass.setRenderBlend(0, BlendState.Alpha)
    draw(frustumMaterial, inverseProjection, frustum)

    pass.submit()
    pass.resolve()
    pass.flush()
  }

  function draw(material: BasicMaterial, world: Mat4, geometry: Geometry) {
    material.World = world
    material.View = camView
    material.Projection = camProjection
    material.effect.applyInputs(material.inputBlocks)
    material.effect.draw(pass, geometry)
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}

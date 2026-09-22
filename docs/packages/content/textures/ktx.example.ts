import { AssetType, ContentLoader } from '@gglib/content'
import { CommonMaterial, IblSampler, SkyboxMaterial, TonemapEffect, TonemapOperator } from '@gglib/effects'
import { MouseInput } from '@gglib/game'
import {
  BlendState,
  Color,
  CullState,
  DepthState,
  Mesh,
  PlatformId,
  SpriteBatch,
  TRUE,
  TextureUsage,
  boxGeometry,
  createDevice,
} from '@gglib/graphics'
import { DDS, GLTF, KTX } from '@gglib/loaders'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({
    canvas,
    platform,
    autosize: true,
  }).ready
  const iblSampler = await new IblSampler(device, {}).compiled

  const pass = device.renderPass
  const msaaColor = device.createRenderTarget({ sampleCount: 4 })
  const msaaDepth = device.createDepthTarget({ sampleCount: 4, format: 'depth24plus' })
  const color = device.createRenderTarget({ usage: TextureUsage.TextureBinding })
  const fxTonemap = await new TonemapEffect(device).compiled
  const spriteBatch = new SpriteBatch(device)

  GLTF.Loader.registerExtension(GLTF.KhrMaterialsSpecular)
  GLTF.Loader.registerExtension(GLTF.KhrMaterialsEmissiveStrength)
  GLTF.Loader.registerExtension(GLTF.KhrMaterialsPbrSpecularGlossinessHandler)
  GLTF.Loader.registerExtension(GLTF.KhrMaterialsIor)
  const content = new ContentLoader(device)
  content.registerLoader(GLTF.Loader)
  content.registerLoader(DDS.Loader)
  content.registerLoader(KTX.Loader)
  content.registerCreator(AssetType.Material, (ctx, options) => {
    const material = new CommonMaterial(ctx.device, options)
    material.UseIBL = TRUE
    material.IblBrdfMap = iblSampler.lutMapGGX
    material.IblLambertianMap = iblSampler.envMapLambert
    material.IblEnvironmentMap = iblSampler.envMapGGX
    material.IblMipCount = iblSampler.envMapGGX.mipLevelCount
    material.IblIntensity = 1

    return material
  })

  let model: Model
  let sphere = BoundingSphere.create()
  async function loadContent() {
    // TODO: review and fix ktx2 cubemaps
    const cubemap = await content.loadTexture('/textures/formats/cubemap.dds')
    iblSampler.update(cubemap)

    model = await content.loadModel('/models/gltf/shader-ball.glb')
    sphere = model.boundingSphere.copy()
    const colorMap = await content.loadTexture('/textures/formats/ice_base.ktx2')
    const normalMap = await content.loadTexture('/textures/formats/ice_normals.ktx2')
    const ormMap = await content.loadTexture('/textures/formats/ice_orm.ktx2')
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as CommonMaterial
        mtl.BaseMap = colorMap
        mtl.UseBaseMap = TRUE
        mtl.NormalMap = normalMap
        mtl.UseNormalMap = TRUE
        mtl.OcclusionMap = ormMap
        mtl.UseOcclusionMap = TRUE
        mtl.MetallicRoughnessMap = ormMap
        mtl.UseMetallicRoughnessMap = TRUE
        mtl.Ior = 1.3
        mtl.Roughness = 0.5
        mtl.Metallic = 0.5
      }
    }
  }
  loadContent()

  const mouse = new MouseInput()

  const skybox = new Mesh(device, {
    geometries: [boxGeometry(device, { invert: true })],
    materials: [
      new SkyboxMaterial(device, {
        blur: 1,
        cubemap: iblSampler.envMapGGX,
        intensity: 1,
      }),
    ],
    parts: [
      {
        geometryIndex: 0,
        materialIndex: 0,
      },
    ],
  })

  const world = Mat4.createIdentity()
  const camera = {
    theta: 0,
    phi: 90,
    fow: 45,
    distance: 1,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  function updateCamera() {
    mouse.update()
    if (mouse.leftButtonIsPressed) {
      camera.theta -= mouse.dxNormalized * 360
      camera.phi -= mouse.dyNormalized * 180
    }
    if (mouse.middleButtonIsPressed) {
      camera.distance += mouse.dyNormalized * 2
      camera.distance = Math.max(0.1, camera.distance)
    }

    // prettier-ignore
    camera.position.initSpherical(
      camera.phi * DEGREE_TO_RAD,
      camera.theta * DEGREE_TO_RAD,
      camera.distance * sphere.radius * 2,
    ).add(sphere.center)

    camera.view.initLookAt(camera.position, sphere.center, Vec3.UnitY).invert()
    camera.projection.initPerspectiveFieldOfView(
      camera.fow * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      1000,
      device.ndcMinZ,
    )
  }

  function updateModel(model: Model) {
    model.update(world)
  }

  function drawModel(model: Model) {
    for (const node of model.sceneNodes) {
      const mesh = model.meshes[node.data?.mesh!]
      if (!mesh) {
        continue
      }

      for (const material of mesh.materials) {
        const mtl = material as CommonMaterial
        mtl.World = node.world
        mtl.View = camera.view
        mtl.Projection = camera.projection
        mtl.CameraPosition = camera.position
      }
    }

    model.draw()
  }

  function drawSky() {
    const material = skybox.materials[0] as SkyboxMaterial
    material.ViewProjection = Mat4.premultiply(camera.view, camera.projection)
    skybox.draw()
  }

  function frame() {
    msaaColor.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)
    color.resizeToMatch(device.output)

    pass.setRenderTarget(0, msaaColor, 0, 0, color)
    pass.setDepthTarget(msaaDepth)
    pass.setCullState(CullState.CullBack)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, BlendState.Alpha)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    if (model) {
      updateCamera()
      drawSky()
      updateModel(model)
      drawModel(model)
    }
    pass.submit()
    pass.resolve()
    pass.flush()

    fxTonemap.srgb = true
    fxTonemap.operator = TonemapOperator.PBR_NEUTRAL
    fxTonemap.textureIn = color
    fxTonemap.textureOut = device.output
    fxTonemap.render(pass)
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}

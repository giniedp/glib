import { ContentLoader } from '@gglib/content'
import { BasicMaterial, BlendState, Color, CullState, DepthState, PlatformId, createDevice } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { GLTF, HDR, KTX } from '@gglib/loaders'
import { DebugOutput, LightParams } from '@gglib/materials'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { mountUi, redrawUi } from 'tweak-ui'

// https://cdn.nw-buddy.de/models/weaponappearances/1hstraightwaterloggedsirens-meshoverride.glb

const PANORAMA_IMAGES = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
  Sky: '/textures/Grey_Sky.png',
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform }).ready
  const pass = device.renderPass
  const rt = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const dt = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })

  const content = new ContentLoader(device)
  content.registerLoader(GLTF.Loader)
  content.registerLoader(KTX.Loader)
  content.registerLoader(HDR.Loader)
  content.registerMaterial(BasicMaterial, () => true)

  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  // const iblSampler = new IBLSamplerEffect(device)
  // async function loadEnvFile(url: string) {
  //   content.loadTexture(url).then((texture) => {
  //     iblSampler.panoramaInput?.dispose()
  //     iblSampler.panoramaInput = texture
  //     iblSampler.needsUpdate = true
  //   })
  // }

  // const skybox = new Mesh(device, {
  //   parts: [cubeGeometry(device)],
  //   materials: [
  //     new SkyboxMaterial(device, {
  //       parameters: {
  //         Intensity: 1.0,
  //         Rotation: 0,
  //         Blur: 0.25,
  //         MipCount: iblSampler.lowestMipLevel + 1,
  //       },
  //     }),
  //   ],
  // })

  const models: Record<string, string> = {
    Bobcat: '/cdn/bobcat/bobcat.gltf',
    Bobcat2: '/cdn/bobcat/bobcat-embed.gltf',
    Scarab: '/cdn/scarab/scarab.gltf',
    mount_mtx_1_horse: 'https://cdn.nw-buddy.de/models/mounts/mount_mtx_1_horse.glb',
    mount_mtx_3_lion: 'https://cdn.nw-buddy.de/models/mounts/mount_mtx_3_lion.glb',
    Oro: 'https://cdn.nw-buddy.de/models/vitals/6e959eb9fce4a69469d774acc7def5db.glb',
    Chardis: 'https://cdn.nw-buddy.de/models/vitals/430f79381a14f3869264b9dd673d671c.glb',
    wpn1hrapiercrystallinepvpp2t5:
      'https://cdn.nw-buddy.de/models/weaponappearances/1hrapiercrystallinepvpp2t5-meshoverride.glb',
    Shield1htowershieldisabellat5:
      'https://cdn.nw-buddy.de/models/weaponappearances/1htowershieldisabellat5-meshoverride.glb',
    Shield1htowershieldwraithhunterovergrownt5:
      'https://cdn.nw-buddy.de/models/weaponappearances/1htowershieldwraithhunterovergrownt5-meshoverride.glb',
    Chestm_nagacorrupted_chest: 'https://cdn.nw-buddy.de/models/armorappearances/m_nagacorrupted_chest-skin1.glb',
    Chestm_specialcorruptedvar1_chest:
      'https://cdn.nw-buddy.de/models/armorappearances/m_specialcorruptedvar1_chest-skin1.glb',
  }
  const params = {
    Metallic: 1.0,
    Roughness: 0.0,
    IndexOfRefraction: 1.5,
    SpecularColor: [1, 1, 1],
    Debug: null! as DebugOutput,
  }
  mountUi(tools, (ui) => {
    loadModel(models.Scarab)
    ui.select({ model: models.Scarab }, 'model', {
      options: models,
      onchange: (it, value) => loadModel(value as string),
    })
    // loadEnvFile(PANORAMA_IMAGES.Overcast)
    // ui.select({ env: PANORAMA_IMAGES.Overcast }, 'env', {
    //   options: PANORAMA_IMAGES,
    //   onChange: (it, value) => loadEnvFile(value as string),
    // })
    ui.number(params, 'Metallic', {
      slider: true,
      min: 0,
      max: 1,
      step: 0.01,
    })
    ui.number(params, 'Roughness', {
      slider: true,
      min: 0,
      max: 1,
      step: 0.01,
    })
    ui.number(params, 'IndexOfRefraction', {
      slider: true,
      min: 0,
      max: 2,
      step: 0.01,
    })
    ui.select(params, 'Debug', {
      options: {
        None: null,
        ...Object.fromEntries(Object.entries(DebugOutput).filter(([key, value]) => typeof value === 'number')),
      },
    })
  })

  let model: Model | null = null
  let sphere: BoundingSphere

  const world = Mat4.createIdentity()
  const camera = {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  const light1 = LightParams.createDirectionalLight({
    direction: Vec3.create(-1, -1, -1),
    color: Vec3.create(0.3, 0.3, 0.3),
  })
  const light2 = LightParams.createDirectionalLight({
    direction: Vec3.create(1, 1, 1),
    color: Vec3.create(0.3, 0.3, 0.3),
  })

  function loadModel(url: string) {
    let baseUrl = ''
    if (url.startsWith('https://cdn.nw-buddy.de/models')) {
      baseUrl = 'https://cdn.nw-buddy.de/models'
      url = url.replace(baseUrl, '')
    }
    content
      .loadModel(url, {
        baseUrl,
      })
      .then((result) => {
        model?.dispose()
        model = result
        model.updateScene()
        sphere = model.boundingSphere.clone()
        console.log(`Model loaded: ${url}`, model)
        const mtl = model.meshes[0].materials[0] as BasicMaterial
        //params.Metallic = mtl.Metallic
        params.Roughness = mtl.Roughness
        //params.IndexOfRefraction = mtl.IndexOfRefraction
        params.SpecularColor = Vec3.convert(mtl.SpecularColor || [1, 1, 1]).toArray()
        redrawUi()
      })
      .catch((e) => {
        model = null!
        console.error(e)
      })
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

    camera.view.initLookAt(camera.position, sphere.center, Vec3.Up).invert()
    camera.projection.initPerspectiveFieldOfView(
      45 * DEGREE_TO_RAD,
      device.output.aspectRatio,
      0.01,
      1000,
      device.ndcMinZ,
    )
  }

  function updateModel(model: Model) {}

  function renderModel(model: Model) {
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as BasicMaterial
        //mtl.ShadeFunction = 'shadePbr'
        //mtl.LightCount = 2
        mtl.World = world
        mtl.View = camera.view
        mtl.Projection = camera.projection
        // mtl.Metallic = params.Metallic
        // mtl.Roughness = params.Roughness
        // mtl.IndexOfRefraction = params.IndexOfRefraction
        // mtl.Debug = params.Debug
        // mtl.SpecularColor = params.SpecularColor
        // mtl.BaseColor = Vec4.create(1, 1, 1, 1)
        // if (iblSampler.isReady) {
        //   mtl.IrradianceMap = iblSampler.lambertianCubemap
        //   mtl.EnvironmentMap = iblSampler.ggxCubemap
        //   mtl.EnvironmentLUT = iblSampler.ggxLutMap
        // }
        // light1.assign(0, mtl.parameters)
        // light2.assign(1, mtl.parameters)
      }
    }

    model.draw()
  }

  function drawSkybox() {
    // const material = skybox.materials[0] as SkyboxMaterial
    // const world = (material.World ||= Mat4.createIdentity()) as Mat4
    // world.initScaleUniform(1)
    // world.setTranslation(camera.position)
    // material.World = world
    // material.View = camera.view
    // material.Projection = camera.projection
    // material.Texture = iblSampler.ggxCubemap
    // if (material.isReady() && iblSampler.isReady) {
    //   skybox.draw()
    // }
  }

  function frame() {
    device.resize()
    // iblSampler.update()
    rt.resizeToMatch(device.output)
    dt.resizeToMatch(device.output)

    pass.setRenderTarget(0, rt, 0, 0, device.output)
    pass.setDepthTarget(dt)
    pass.setCullState(CullState.CullBack)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, BlendState.Alpha)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (model) {
      updateCamera()
      drawSkybox()
      updateModel(model)
      renderModel(model)
    }
    pass.submit()
    pass.resolve()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

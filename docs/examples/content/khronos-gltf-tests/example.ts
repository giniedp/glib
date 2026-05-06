import { ContentLoader } from '@gglib/content'
import { IBLSamplerEffect } from '@gglib/effects'
import {
  BlendState,
  Color,
  CullState,
  DepthState,
  Mesh,
  TextureImage,
  createDevice,
  cubeGeometry,
  planeLinesMesh,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { GLTF, HDR } from '@gglib/loaders'
import { AutoMaterial, LightParams, SkyboxMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4, Transform, Vec3 } from '@gglib/math'
import { AnimationPlayer, Model, NodeData } from '@gglib/model'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

TextureImage.crossOrigin = 'anonymous'

const PANORAMA_IMAGES = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
  Sky: '/textures/Grey_Sky.png',
}

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })
  const stats = device.stats({})
  const content = new ContentLoader(device)
  content.registerLoader(GLTF.Loader)
  content.registerLoader(HDR.Loader)
  content.registerMaterial({
    name: 'BasicEffect',
    type: AutoMaterial,
  })
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })
  const iblSampler = new IBLSamplerEffect(device)
  content.loadTexture(PANORAMA_IMAGES.Overcast).then((texture) => {
    console.log('Loaded panorama texture', texture)
    iblSampler.panoramaInput = texture
    iblSampler.needsUpdate = true
  })
  const camera = {
    theta: 0,
    phi: 90,
    distance: 2,
    radius: 1,
    position: Vec3.create(),
    lookat: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  const skybox = new Mesh(device, {
    parts: [cubeGeometry(device)],
    materials: [
      new SkyboxMaterial(device, {
        properties: {
          Intensity: 1.0,
          Rotation: 0,
          Blur: 1,
          MipCount: iblSampler.lowestMipLevel + 1,
        },
      }),
    ],
  })

  const grid = planeLinesMesh(device, {
    size: 10,
    tesselation: 10,
    color: Color.Gray,
  })
  let model: Model
  let player: AnimationPlayer

  const light = LightParams.createDirectionalLight({
    color: [1, 1, 1],
    direction: [-1, -1, -1],
  })
  const light2 = LightParams.createDirectionalLight({
    color: [0.8, 0.8, 0.8],
    direction: [1, 1, 1],
  })

  createSamplerBrowser(content, tools, (url) => {
    content.loadModel(url).then((result) => {
      console.log(result)
      model?.dispose()
      model = result
      camera.lookat.initFrom(result.boundingSphere.center)
      camera.radius = result.boundingSphere.radius
      player = result.getAnimationPlayer()
      player?.loadClip(0, true)
    })
  })

  function updateCamera(time: number, dt: number) {
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
      camera.distance * camera.radius * 2,
    ).add(camera.lookat)

    camera.view.initLookAt(camera.position, camera.lookat, Vec3.Up).invert()
    camera.projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.01, 1000)
  }

  function drawSkybox() {
    const material = skybox.materials[0] as SkyboxMaterial
    const world = (material.World ||= Mat4.createIdentity()) as Mat4
    world.initScaleUniform(1)
    world.setTranslation(camera.position)
    material.World = world
    material.View = camera.view
    material.Projection = camera.projection
    material.Texture = iblSampler.ggxCubemap
    if (material.isReady()) {
      skybox.draw()
    }
  }

  function drawModelMesh(transform: Transform, node: NodeData, model: Model) {
    const mesh = model.meshes[node.mesh!]
    if (!mesh) {
      return
    }
    const skeleton = model.skeletons[node.skin!]

    for (const part of mesh.parts) {
      const material = mesh.getMaterial(part.materialId) as AutoMaterial
      material.ShadeFunction = 'shadePbr'

      const params = material.parameters
      material.World = transform.world
      material.View = camera.view
      material.Projection = camera.projection
      material.LightCount = 2
      material.IrradianceMap = iblSampler.lambertianCubemap
      material.EnvironmentMap = iblSampler.ggxCubemap
      material.EnvironmentLUT = iblSampler.ggxLutMap
      if (skeleton) {
        material.Joints = skeleton.jointMatrices
      }
      params.CameraPosition = camera.position

      light.assign(0, params)
      light2.assign(1, params)

      material.draw(part)
    }
  }

  function frame(time: number, dt: number) {
    device.resize()
    device.cullState = CullState.CullClockWise
    device.depthState = DepthState.Disabled
    device.blendState = BlendState.Disabled
    device.clear(Color.CornflowerBlue.rgba, 1.0)

    iblSampler.update()

    updateCamera(time, dt)
    for (const mtl of grid.materials) {
      mtl.parameters.World ||= Mat4.createIdentity()
      mtl.parameters.View = camera.view
      mtl.parameters.Projection = camera.projection
    }
    grid.draw()
    drawSkybox()

    if (!model) {
      return
    }
    player?.sample(time / 1000, model.transformNodes)
    model.update()
    model.drawScene(drawModelMesh)
  }
  return loop(frame).stop
}

const baseUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Asset-Generator/master/Output/Positive' // 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Asset-Generator/Output/Positive'
const githubUrl = 'https://github.com/KhronosGroup/glTF-Asset-Generator/tree/master/Output/Positive'
const manifest = `${baseUrl}/Manifest.json`
type Manifest = ManifestFolder[]
type ManifestFolder = {
  folder: string
  id: number
  models: ManifestModel[]
}
type ManifestModel = {
  fileName: string
  loadable: boolean
  sampleImageName: string
  camera: {
    translation: [number, number, number]
  }
}

function createSamplerBrowser(content: ContentLoader, tools: HTMLElement, loadModel: (url: string) => void) {
  content.fetch<Manifest>(manifest, { responseType: 'json' }).then(({ body }) => {
    const models: Record<string, string> = {}
    TweakUi.mount(tools, (ui) => {
      ui.collapsible('Controls', { collapsed: false }, () => {
        ui.accordion(() => {
          const list = body!.sort((a, b) => a.id - b.id)
          for (const folder of list) {
            ui.group(folder.folder, () => {
              for (const [modelId, model] of folder.models.entries()) {
                if (!model.loadable) {
                  continue
                }
                const modelKey = `${folder.id}-${modelId}`
                const modelUrl = `${baseUrl}/${folder.folder}/${model.fileName}`
                models[modelKey] = modelUrl

                ui.container({ horizontal: true }, () => {
                  if (model.sampleImageName) {
                    ui.container({ style: { flex: 'none' } }, () => {
                      ui.image({
                        width: 70,
                        src: `${baseUrl}/${folder.folder}/${model.sampleImageName}`,
                        onClick: () => {
                          const route = new URL(location.href)
                          route.searchParams.set('model', modelKey)
                          history.pushState({}, '', route.toString())
                          loadModel(modelUrl)
                        },
                      })
                    })
                  }
                  ui.container(() => {
                    ui.button('show', {
                      onClick: () => {
                        const route = new URL(location.href)
                        route.searchParams.set('model', modelKey)
                        history.pushState({}, '', route.toString())
                        loadModel(modelUrl)
                      },
                    })
                    ui.button('open in github', {
                      onClick: () => window.open(`${githubUrl}/${folder.folder}`, '_blank'),
                    })
                    ui.button('compare viewer', {
                      onClick: () =>
                        window.open(
                          `https://bghgary.github.io/glTF-Assets-Viewer/?manifest=https://raw.githubusercontent.com/KhronosGroup/glTF-Asset-Generator/master/Output/Positive/Manifest.json&folder=${folder.id}&model=${modelId}`,
                          '_blank',
                        ),
                    })
                  })
                })
              }
            })
          }
        })
      })
    })

    const url = new URL(location.href)
    const model = url.searchParams.get('model')
    if (model && model in models) {
      loadModel(models[model])
    }
  })
}

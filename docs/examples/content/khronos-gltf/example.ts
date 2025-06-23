import { ContentLoader } from '@gglib/content'
import { IBLSamplerEffect } from '@gglib/effects'
import {
  BlendState,
  Color,
  CullState,
  DepthState,
  LightType,
  Mesh,
  SamplerState,
  TextureImage,
  boxLinesMesh,
  createDevice,
  cubeGeometry,
  textureSourceFromImageUrl,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { GLTF } from '@gglib/loaders'
import { AutoMaterial, LightParams, SkyboxMaterial } from '@gglib/materials'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Transform, Vec3 } from '@gglib/math'
import { Model, NodeData } from '@gglib/model'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const baseUrl = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets/Models'
const githubUrl = 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/master/Models'
const indexFile = `${baseUrl}/model-index.json`
type GltfIndex = GltfIndexModel[]
type GltfIndexModel = {
  name: string
  screenshot: string
  variants: {
    [key: string]: string
  }
}
const PANORAMA_IMAGES = {
  foorprintCourtJPG: {
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments/footprint_court.jpg',
  },
  foorprintCourtHDR: {
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Environments/footprint_court.hdr',
  },
  gatonaParkWalkway1Panorama4Kx2K: {
    url: 'https://playground.babylonjs.com/textures/GatonaParkWalkway1_Panorama_4Kx2K.jpg',
  },
}

TextureImage.crossOrigin = 'anonymous'
export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })
  const stats = device.stats()
  const content = new ContentLoader(device)
  content.registerLoader(GLTF.Loader)
  content.registerMaterial({
    name: 'BasicEffect',
    type: AutoMaterial,
  })
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const iblSampler = new IBLSamplerEffect(device)
  content.loadTexture(PANORAMA_IMAGES.foorprintCourtJPG.url).then((texture) => {
    console.log('Loaded panorama texture', texture)
    iblSampler.panoramaInput = texture
    iblSampler.needsUpdate = true
  })

  const camera = {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

  const skybox = new Mesh(device, {
    parts: [cubeGeometry(device)],
    materials: [
      new SkyboxMaterial(device, {
        parameters: {
          Intensity: 1.0,
          Rotation: 0,
          Blur: 0.25,
          MipCount: iblSampler.lowestMipLevel + 1,
        },
      }),
    ],
  })

  content.fetch<GltfIndex>(indexFile, { responseType: 'json' }).then((response) => {
    TweakUi.mount(tools, (ui) => {
      ui.object('GPU Stats', stats)
      ui.accordion(() => {
        for (const mdl of response.body!) {
          ui.group(mdl.name, () => {
            ui.container({ horizontal: true }, () => {
              ui.container({ style: { flex: 'none' } }, () => {
                ui.image({
                  src: `${baseUrl}/${mdl.name}/${mdl.screenshot}`,
                  width: 100,
                })
              })
              ui.container(() => {
                Object.entries(mdl.variants).forEach(([name, path]) => {
                  ui.button(name, { onClick: () => loadModel(`${baseUrl}/${mdl.name}/${name}/${path}`) })
                })
                ui.button('open in github', { onClick: () => window.open(`${githubUrl}/${mdl.name}`, '_blank') })
              })
            })
          })
        }
      })
    })
  })

  let model: Model | null = null
  let sphere: BoundingSphere = new BoundingSphere(0, 0, 0, 1)
  const gizmos: Mesh[] = []

  const light = new LightParams()
  // light.enabled = true
  // light.type = LightType.Directional
  // light.color = [1, 1, 1]
  // light.direction = [-1, -1, -1]

  function loadModel(url: string) {
    content.loadModel(url).then((result) => {
      model?.dispose()
      model = result
      model.updateScene()
      gizmos.forEach((gizmo) => gizmo.dispose())
      gizmos.length = 0
      gizmos.push(boxLinesMesh(device, model.boundingBox, Color.Yellow))

      sphere = model.boundingSphere
      console.log(`Model loaded: ${url}`, {
        model,
      })
    })
  }

  function updateCamera(time: number) {
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
      device.drawingBufferAspectRatio,
      0.01,
      Math.max(10, sphere.radius + Vec3.distance(camera.position, sphere.center)),
    )
  }

  function updateModel(model: Model) {
    model.updateScene()
    for (const mesh of model.meshes) {
      for (const mtl of mesh.materials) {
        const material = mtl as AutoMaterial
        if (iblSampler.isReady) {
          material.IrradianceMap = iblSampler.lambertianCubemap
          material.EnvironmentMap = iblSampler.ggxCubemap
          material.EnvironmentLUT = iblSampler.ggxLutMap
        }
      }
    }
  }

  function updateAnimation(dt: number) {
    // try {
    //   if (player) {
    //     aniTime += dt
    //     pose!.updateFromAnimation(aniTime / 1000, player)
    //   }
    // } catch (e) {
    //   // abort animation
    //   console.error(e)
    //   player = null
    //   pose!.reset()
    // }
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

  function drawMesh(transform: Transform, node: NodeData, model: Model) {
    const mesh = model.meshes[node.mesh!]
    if (!mesh) {
      return
    }

    for (const part of mesh.parts) {
      const material = mesh.getMaterial(part.materialId) as AutoMaterial
      material.ShadeFunction = 'shadePbr'
      //const joints = pose!.updateSkin(node.skin!, id)

      const params = material.parameters
      material.World = transform.world
      material.View = camera.view
      material.Projection = camera.projection
      material.LightCount = 1
      params.CameraPosition = camera.position

      light.assign(0, params)

      material.draw(part)
    }
  }

  function frame(time: number, dt: number) {
    device.drawCalls = 0
    device.resize()

    iblSampler.update()
    updateCamera(time)

    device.blendState = BlendState.Default
    device.cullState = CullState.CullClockWise
    device.depthState = DepthState.Default
    device.clear(0xff2e2620, 1.0)
    drawSkybox()

    if (model) {
      updateModel(model)
      updateAnimation(dt)
      model.drawScene(drawMesh)
    }

    for (const gizmo of gizmos) {
      if (gizmo.materials[0].isReady()) {
        gizmo.materials[0].parameters.World ||= Mat4.createIdentity()
        gizmo.materials[0].parameters.View = camera.view
        gizmo.materials[0].parameters.Projection = camera.projection
        gizmo.draw()
      }
    }

    device.stats(stats)
    TweakUi.redraw()
  }
  return loop(frame).stop
}

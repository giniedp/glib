import { ContentLoader } from '@gglib/content'
import { BlendState, Color, CullState, DepthState, TextureImage, createDevice, planeLinesMesh } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { GLTF } from '@gglib/loaders'
import { AutoMaterial, LightParams } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4, Transform, Vec3 } from '@gglib/math'
import { AnimationPlayer, Model, NodeData } from '@gglib/model'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

TextureImage.crossOrigin = 'anonymous'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({ canvas })
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

  const grid = planeLinesMesh(device, {
    size: 10,
    tesselation: 10,
    color: Color.Gray,
  })
  let model: Model
  let player: AnimationPlayer

  const world = Mat4.createIdentity()
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
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    device.clear(Color.CornflowerBlue.rgba, 1.0)

    updateCamera(time, dt)
    for (const mtl of grid.materials) {
      mtl.parameters.World ||= Mat4.createIdentity()
      mtl.parameters.View = camera.view
      mtl.parameters.Projection = camera.projection
    }
    grid.draw()

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
    TweakUi.mount(tools, (ui) => {
      ui.collapsible('Controls', { collapsed: false }, () => {
        ui.accordion(() => {
          const list = body!.sort((a, b) => a.id - b.id)
          list.forEach((folder) => {
            ui.group(folder.folder, () => {
              folder.models.forEach((model, modelId) => {
                if (!model.loadable) {
                  return
                }
                ui.container({ horizontal: true }, () => {
                  if (model.sampleImageName) {
                    ui.container({ style: { flex: 'none' } }, () => {
                      ui.image({
                        width: 70,
                        src: `${baseUrl}/${folder.folder}/${model.sampleImageName}`,
                        onClick: () => loadModel(`${baseUrl}/${folder.folder}/${model.fileName}`),
                      })
                    })
                  }
                  ui.container(() => {
                    ui.button('show', {
                      onClick: () => loadModel(`${baseUrl}/${folder.folder}/${model.fileName}`),
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
              })
            })
          })
        })
      })
    })
  })
}

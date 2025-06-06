import { ContentLoader } from '@gglib/content'
import {
  BlendState,
  Color,
  CullState,
  DepthState,
  LightType,
  Mesh,
  TextureImage,
  boxLinesGeometry,
  boxLinesMesh,
  createDevice,
  cubeLinesGeometry,
  linesProgramOptions,
  sphereLinesMesh,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { GLTF } from '@gglib/loaders'
import { AutoMaterial, LightParams } from '@gglib/materials'
import { BoundingSphere, DEGREE_TO_RAD, Mat4, Transform, Vec3 } from '@gglib/math'
import { Model, NodeData } from '@gglib/model'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const baseUrl = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models/2.0'
const githubUrl = 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0'
const indexFile = `${baseUrl}/model-index.json`
type GltfIndex = GltfIndexModel[]
type GltfIndexModel = {
  name: string
  screenshot: string
  variants: {
    [key: string]: string
  }
}

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
  const stats = device.stats({})
  const camera = {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }

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
  let sphere: BoundingSphere
  const gizmos: Mesh[] = []

  const light = new LightParams()
  light.enabled = true
  light.type = LightType.Directional
  light.color = [1, 1, 1]
  light.direction = [-1, -1, -1]

  function loadModel(url: string) {
    content.loadModel(url).then((result) => {
      model?.dispose()
      model = result
      model.updateScene()
      gizmos.forEach((gizmo) => gizmo.dispose())
      gizmos.length = 0
      gizmos.push(
        boxLinesMesh(device, model.boundingBox, Color.Yellow),
        // sphereLinesMesh(device, model.boundingSphere, Color.Yellow),
      )
      // for (const node of model.transformNodes) {
      //   const mesh = model.meshes[node.data?.mesh!]
      //   gizmos.push(sphereLinesMesh(device, mesh.boundingSphere.clone().transform(node.world)))
      // }

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
      sphere.radius + Vec3.distance(camera.position, sphere.center),
    )
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
      // if (joints) {
      //   for (let i = 0; i < joints?.length; i++) {
      //     params[`Joints${i}`] = joints[i]
      //   }
      // }

      material.draw(part)
    }
  }

  function frame(time: number, dt: number) {
    // Resize and clear the screen
    device.drawCalls = 0
    device.resize()
    device.cullState = CullState.CullClockWise
    device.depthState = DepthState.Default
    device.blendState = BlendState.Default
    device.clear(0xff2e2620, 1.0)

    if (!model) {
      return
    }
    model.updateScene()
    updateCamera(time)
    updateAnimation(dt)
    model.drawScene(drawMesh)

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

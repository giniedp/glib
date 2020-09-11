import { ContentManager, Data } from '@gglib/content'
import { LightParams, AutoMaterial } from '@gglib/fx-materials'
import {
  BlendState,
  CullState,
  DepthState,
  LightType,
  Model,
  Texture,
  createDevice,
  AnimationPlayer,
  ModelNodePose,
  ModelPose,
} from '@gglib/graphics'
import { Mat4, Vec3, BoundingSphere } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'
import { Mouse } from '@gglib/input'

const baseUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Asset-Generator/master/Output/Positive'// 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Asset-Generator/Output/Positive'
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

Texture.crossOrigin = 'anonymous'
const device = createDevice({ canvas: '#canvas' })
const content = new ContentManager(device)
content.downloadJSON({ url: manifest }).then((data: Data<Manifest>) => {
  TweakUi.build('#tweak-ui', (b: TweakUi.Builder) => {
    b.group('Controls', { open: true }, (q) => {
      q.accordeon({ autoscroll: true }, (a) => {
        const list = data.content.sort((a, b) => a.id - b.id)
        list.forEach((folder) => {
          a.group(folder.folder, (f) => {
            folder.models.forEach((model, modelId) => {
              if (!model.loadable) {
                return
              }
              if (model.sampleImageName) {
                f.image(null, {
                  height: 150,
                  src: `${baseUrl}/${folder.folder}/${model.sampleImageName}`,
                  onClick: () => loadModel(`${baseUrl}/${folder.folder}/${model.fileName}`, model),
                })
              }
              f.button(model.fileName, {
                onClick: () => loadModel(`${baseUrl}/${folder.folder}/${model.fileName}`, model),
              })
              f.button('open in github', {
                onClick: () => window.open(`${githubUrl}/${folder.folder}`, '_blank'),
              })
              f.button('compare viewer', {
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

const cam = {
  mouse: new Mouse(),
  view: Mat4.createIdentity(),
  proj: Mat4.createIdentity(),
  lookAt: new Vec3(),
  position: new Vec3(),
  clip: { near: 0.001, far: 1000 },
  radial: { phi: 0, theta: 0, d: 10 },
  mx: 0,
  my: 0,
  reset: (bs: BoundingSphere) => {
    cam.lookAt.initFrom(bs.center)
    cam.radial = { phi: 0, theta: Math.PI / 2, d: bs.radius * 2 }
    cam.clip.far = Math.max(bs.radius * 4, 10)
  },
  update: (dt: number) => {
    const mouse = cam.mouse.state
    const [dx, dy] = [mouse.normalizedX - cam.mx, mouse.normalizedY - cam.my]
    cam.mx += dx
    cam.my += dy
    if (mouse.buttons[0]) {
      cam.radial.phi -= dt * dx * 0.2
      cam.radial.theta -= dt * dy * 0.2
    }
    cam.position.initSpherical(cam.radial.theta, cam.radial.phi, cam.radial.d)
    cam.view.initLookAt(cam.position, cam.lookAt, Vec3.Up).invert()
    cam.proj.initPerspectiveFieldOfView(Math.PI / 4, device.drawingBufferAspectRatio, cam.clip.near, cam.clip.far)
  },
}
let model: Model = null
let player: AnimationPlayer = null
let pose: ModelPose = null
let aniTime = 0
const identity = Mat4.createIdentity()
const light = new LightParams()
light.enabled = true
light.type = LightType.Directional
light.color = [1, 1, 1]
light.direction = [-1, -1, -1]

function loadModel(url: string, m: ManifestModel) {
  content.load(url, Model).then((result) => {
    console.log(result)
    model = result
    pose = model.getPose({ copy: true })
    player = model.getAnimationPlayer()
    player?.loadClip(0, true)
    aniTime = 0
    cam.reset(model.getAbsoluteBoundingSphere(pose.transforms))
  })
}

// Begin the rendering loop and accumulate the time
loop((time, dt) => {
  // Resize and clear the screen
  device.resize()
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.clear(0xff2e2620, 1.0)

  try {
    if (player) {
      aniTime += dt
      pose.updateFromAnimation(aniTime / 1000, player)
    }
  } catch (e) {
    // abort animation
    console.error(e)
    player = null
    pose.reset()
  }

  // Do not proceed until model is loaded
  if (!model) {
    return
  }
  // Update runtime variables
  cam.update(dt)

  model.hierarchy.walk((node, id) => {
    const mesh = model?.meshes[node.mesh]
    if (!mesh) {
      return
    }
    for (const part of mesh.parts) {
      const material = mesh.getMaterial(part.materialId)
      const joints = pose.updateSkin(node.skin, id)
      const params = material.parameters
      params.World = pose.transforms[id]
      params.View = cam.view
      params.Projection = cam.proj
      params.CameraPosition = cam.position

      light.assign(0, params)
      if (joints) {
        for (let i = 0; i < joints?.length; i++) {
          params[`Joints${i}`] = joints[i]
        }
      }

      try {
        material.draw(part)
      } catch (e) {
        // abort
        console.error(e)
        model = null
        return
      }
    }
  })

})

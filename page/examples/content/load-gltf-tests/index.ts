import { ContentManager, Data } from '@gglib/content'
import { LightParams, AutoMaterial } from '@gglib/effects'
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
} from '@gglib/graphics'
import { Mat4, Vec3, BoundingSphere } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'
import { Mouse } from '@gglib/input'

const baseUrl = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Asset-Generator/Output/Positive'
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
      const list = data.content.sort((a, b) => a.id - b.id)
      list.forEach((folder) => {
        q.group(folder.folder, (f) => {
          folder.models.forEach((model, modelId) => {
            if (!model.loadable) {
              return
            }
            if (model.sampleImageName) {
              f.image(null, {
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
let aniTime = 0
const localPose: ModelNodePose[] = []
const transforms: Mat4[] = []
const light = new LightParams()
light.enabled = true
light.type = LightType.Directional
light.color = [1, 1, 1]
light.direction = [-1, -1, -1]

function loadModel(url: string, m: ManifestModel) {
  content.load(url, Model).then((result) => {
    console.log(result)
    model = result
    player = model.getAnimationPlayer()
    player?.loadClip(0, true)
    localPose.length = 0
    transforms.length = 0
    aniTime = 0
    model.getLocalPose(localPose)
    model.getAbsoluteTransforms(transforms)
    cam.reset(model.getAbsoluteBoundingSphere(transforms))

    // model.meshes.forEach((mesh) => {
    //   mesh.materials.forEach((material, i) => {
    //     const mtl = new AutoMaterial(mesh.device)
    //     Object.entries(material.parameters).forEach(([key, value]) => {
    //       mtl.parameters[key] = value
    //     })
    //     mesh.materials[i] = mtl
    //   })
    // })
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
      player.sample(aniTime / 1000, localPose)
    }
  } catch (e) {
    // abort animation
    console.error(e)
    localPose.length = 0
  }

  // Do not proceed until model is loaded
  if (!model) {
    return
  }
  // Update runtime variables
  cam.update(dt)

  if (player && localPose.length) {
    // we have an animation, so we have to recalculate the transforms
    model.getAbsoluteTransforms(transforms, localPose)
  }

  model.walkNodes((node, id, parentId) => {
    const mesh = model.meshes[node.mesh]
    if (!mesh) {
      return
    }
    mesh.materials.forEach((material) => {
      const params = material.parameters
      params.World = transforms[id]
      params.View = cam.view
      params.Projection = cam.proj
      params.CameraPosition = cam.position
      light.assign(0, params)
    })

    try {
      mesh.draw()
    } catch (e) {
      // abort
      console.error(e)
      model = null
    }
  })
})

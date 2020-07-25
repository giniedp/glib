import { ContentManager, Data } from '@gglib/content'
import { LightParams } from '@gglib/effects'
import { BlendState, CullState, DepthState, LightType, Model, ModelNodePose, Texture, createDevice, AnimationPlayer } from '@gglib/graphics'
import { Mat4, Vec3, BoundingSphere } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'
import { Mouse } from '@gglib/input'

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

Texture.crossOrigin = 'anonymous'
const device = createDevice({ canvas: '#canvas' })
const content = new ContentManager(device)

content.downloadJSON({ url: indexFile }).then((data: Data<GltfIndex>) => {
  TweakUi.build('#tweak-ui', (q: TweakUi.Builder) => {
    data.content.forEach((mdl) => {
      q.group(mdl.name, (f) => {
        f.image(null, {
          src: `${baseUrl}/${mdl.name}/${mdl.screenshot}`,
        })
        Object.entries(mdl.variants).forEach(([name, path]) => {
          f.button(name, { onClick: () => loadModel(`${baseUrl}/${mdl.name}/${name}/${path}`) })
        })
        f.button('open in github', { onClick: () => window.open(`${githubUrl}/${mdl.name}`, '_blank') })
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
const transforms: Mat4[] = []
const localPose: ModelNodePose[] = []
const light = new LightParams()
light.enabled = true
light.type = LightType.Directional
light.color = [1, 1, 1]
light.direction = [-1, -1, -1]

function loadModel(url: string) {
  content.load(url, Model).then((result) => {
    model = result
    console.log(model)

    player = model.getAnimationPlayer()
    player?.loadClip(0, true)
    console.log(player)

    aniTime = 0
    localPose.length = 0
    transforms.length = 0
    model.getLocalPose(localPose)
    model.getAbsoluteTransforms(transforms)
    cam.reset(model.getAbsoluteBoundingSphere(transforms))
  })
}

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

  if (!model) {
    return
  }

  cam.update(dt)

  if (player && localPose.length) {
    // we have an animation, so we have to recalculate the transforms
    model.getAbsoluteTransforms(transforms, localPose)
  }

  model.walkNodes((node, id) => {
    const mesh = model?.meshes[node.mesh]
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
      console.error(e)
      model = null
      return
    }
  })
})

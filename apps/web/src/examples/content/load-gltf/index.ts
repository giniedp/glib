import { ContentManager, Data } from '@gglib/content'
import { LightParams } from '@gglib/fx-materials'
import { BlendState, CullState, DepthState, LightType, Model, ModelNodePose, Texture, createDevice, AnimationPlayer, ModelPose } from '@gglib/graphics'
import { Mat4, Vec3, BoundingSphere } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'
import { Mouse, Keyboard, KeyboardKey } from '@gglib/input'

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
    q.accordeon({ autoscroll: false }, (a) => {
      data.content.forEach((mdl) => {
        a.group(mdl.name, (f) => {
          f.image(null, {
            height: 150,
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
})

const cam = {
  mouse: new Mouse(),
  keyboard: new Keyboard(),
  view: Mat4.createIdentity(),
  proj: Mat4.createIdentity(),
  lookAt: new Vec3(),
  position: new Vec3(),
  clip: { near: 0.001, far: 1000 },
  radial: { phi: 0, theta: 0, d: 10 },
  mx: 0,
  my: 0,
  camId: 0,
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
    for (let i = 0; i < 9; i++) {
      if (cam.keyboard.keys.has(KeyboardKey.Digit0 + i)) {
        if (cam.keyboard.keys.has(KeyboardKey.ShiftLeft)) {
          player.loadClip(i, true)
        } else {
          cam.camId = i
        }
      }
    }
    if (mouse.buttons[0]) {
      cam.radial.phi -= dt * dx * 0.2
      cam.radial.theta -= dt * dy * 0.2
    }
    const camNodeId = model?.hierarchy?.nodes?.findIndex((it) => it.camera === (cam.camId - 1))
    if (camNodeId >= 0) {
      pose.transforms[camNodeId].getTranslation(cam.position)
      cam.view.initLookAt(cam.position, Vec3.$0.initSpherical(cam.radial.theta, -cam.radial.phi, 1).add(cam.position), Vec3.Up).invert()
      cam.proj.initPerspectiveFieldOfView(Math.PI / 4, device.drawingBufferAspectRatio, cam.clip.near, cam.clip.far)
    } else {
      cam.position.initSpherical(cam.radial.theta, cam.radial.phi, cam.radial.d)
      cam.view.initLookAt(cam.position, cam.lookAt, Vec3.Up).invert()
      cam.proj.initPerspectiveFieldOfView(Math.PI / 4, device.drawingBufferAspectRatio, cam.clip.near, cam.clip.far)
    }
  },
}

let model: Model = null
let pose: ModelPose = null
let player: AnimationPlayer = null
let aniTime = 0
const identity = Mat4.createIdentity()
const light = new LightParams()
light.enabled = true
light.type = LightType.Directional
light.color = [1, 1, 1]
light.direction = [-1, -1, -1]

function loadModel(url: string) {
  content.load(url, Model).then((result) => {
    model = result
    pose = model.getPose({ copy: true })
    player = model.getAnimationPlayer({ copy: true })
    player?.loadClip(0, true)
    console.log(model)

    aniTime = 0
    cam.reset(model.getAbsoluteBoundingSphere(pose.transforms))
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
      pose.updateFromAnimation(aniTime / 1000, player)
    }
  } catch (e) {
    // abort animation
    console.error(e)
    player = null
    pose.reset()
  }

  if (!model) {
    return
  }

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
      params.CameraPosition = cam.position
      params.Projection = cam.proj
      params.View = cam.view
      params.World = pose.transforms[id]

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
      }
    }
  })
})

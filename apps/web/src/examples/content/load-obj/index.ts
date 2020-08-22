import { ContentManager } from '@gglib/content'
import { LightParams } from '@gglib/effects'
import { BlendState, CullState, DepthState, Model, createDevice, Color } from '@gglib/graphics'
import { Mat4, Vec3, BoundingSphere } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'
import { Mouse } from '@gglib/input'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({ canvas: '#canvas' })
const content = new ContentManager(device)

const models = {
  Tower: '/assets/models/obj/piratekit/tower.obj',
  Cannon: '/assets/models/obj/piratekit/cannonMobile.obj',
  Chest: '/assets/models/obj/piratekit/chest.obj',
  Boat: '/assets/models/obj/piratekit/boat_large.obj',
  Bottle: '/assets/models/obj/piratekit/bottle.obj',
  Paddle: '/assets/models/obj/piratekit/paddle.obj',
  Palm: '/assets/models/obj/piratekit/palm_detailed_long.obj',
  Pirate: '/assets/models/obj/piratekit/pirate_captain.obj',
  Plant: '/assets/models/obj/piratekit/plant.obj',
  Shovel: '/assets/models/obj/piratekit/shovel.obj',
  Sword: '/assets/models/obj/piratekit/sword.obj',
  'Ship Dark': '/assets/models/obj/piratekit/ship_dark.obj',
  'Ship Light': '/assets/models/obj/piratekit/ship_light.obj',
  'Tree': '/assets/models/obj/medieval/tree.obj',
}

TweakUi.build('#tweak-ui', (q) => {
  loadModel(models.Tower)
  Object.entries(models).forEach(([name, url]) => {
    q.button(name, { onClick: () => loadModel(url)})
  })
})

let model: Model = null
const light1 = LightParams.createDirectionalLight({
  direction: Vec3.create(-1, -1, -1),
  color: Vec3.One,
})
const light2 = LightParams.createDirectionalLight({
  direction: Vec3.create(1, 1, 1),
  color: Vec3.One,
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

function loadModel(url: string) {
  content.load(url, Model).then((result) => {
    model = result
    console.log(model)
    cam.reset(model.getAbsoluteBoundingSphere())
  }).catch((e) => {
    model = null
    console.error(e)
  })
}

loop((time, dt) => {

  // Resize and clear the screen
  device.resize()
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.clear(0xff2e2620, 1.0)

  // Do not proceed until model is loaded
  if (!model) {
    return
  }

  // Update camera
  cam.update(dt)

  // Update materials
  model.meshes.forEach((mesh) => {
    mesh.materials.forEach((material) => {
      const params = material.parameters

      params.World = params.World || Mat4.createIdentity()
      params.View = cam.view
      params.Projection = cam.proj
      params.CameraPosition = cam.position

      // Update light properties
      light1.assign(0, params)
      light2.assign(1, params)
    })
  })

  // Draw the model but stop rendering in case of an error
  try {
    model.draw()
  } catch (e) {
    console.error(e)
    model = null
  }
})

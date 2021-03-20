import { ContentManager } from '@gglib/content'
import { AutoMaterial } from '@gglib/fx-materials'
import { BlendState, CullState, DepthState, createDevice, ModelBuilder, buildCube, Texture } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const device = createDevice({ canvas: '#canvas' })
const content = new ContentManager(device)
content.rewriteRequest = (req) => {

  return req
}

const files = {
  "avatar": "/assets/testimages/tga/avatar.tga",
  "cbw8": '/assets/testimages/tga/cbw8.tga',
  "ccm8": '/assets/testimages/tga/ccm8.tga',
  "ctc16": '/assets/testimages/tga/ctc16.tga',
  "ctc24": '/assets/testimages/tga/ctc24.tga',
  "ctc32": '/assets/testimages/tga/ctc32.tga',
  "ubw8": '/assets/testimages/tga/ubw8.tga',
  "ucm8": '/assets/testimages/tga/ucm8.tga',
  "utc16": '/assets/testimages/tga/utc16.tga',
  "utc24": '/assets/testimages/tga/utc24.tga',
  "utc32": '/assets/testimages/tga/utc32.tga',
}

TweakUi.mount('#tweak-ui', (ui) => {
  loadTexture(files.avatar)
  Object.entries(files).forEach(([name, url]) => {
    ui.button(name, { onClick: () => loadTexture(url)})
  })
})

const material = new AutoMaterial(device)
const geometry = new ModelBuilder()
  .append(buildCube)
  .endMeshPart(device)

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const projection = Mat4.createIdentity()

function loadTexture(url: string) {
  content.load(url, Texture.Texture2D).then((result) => {
    material.DiffuseMap = result
    material.ShadeFunction = 'shadeNone'
  }).catch((e) => {
    console.error(e)
  })
}

loop((_, dt) => {
  device.resize()
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default
  device.blendState = BlendState.AlphaBlend
  device.clear(0xff2e2620, 1.0)

  world.rotateY(dt * 0.0001)
  view.initTranslation(0, 0, 2.5).invert()
  projection.initPerspectiveFieldOfView(Math.PI / 4, device.drawingBufferAspectRatio, 0.001, 100)

  material.World = world
  material.View = view
  material.Projection = projection
  material.draw(geometry)
})

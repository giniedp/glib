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
  "dust": "/assets/textures/cubemaps/dust.ktx2"
}

TweakUi.build('#tweak-ui', (q) => {
  loadTexture(files.dust)
  Object.entries(files).forEach(([name, url]) => {
    q.button(name, { onClick: () => loadTexture(url)})
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
  device.blendState = BlendState.None
  device.clear(0xff2e2620, 1.0)

  world.rotateY(dt * 0.0001)
  view.initTranslation(0, 0, 2.5).invert()
  projection.initPerspectiveFieldOfView(Math.PI / 4, device.drawingBufferAspectRatio, 0.001, 100)

  material.World = world
  material.View = view
  material.Projection = projection
  material.draw(geometry)
})

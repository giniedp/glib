import { BlendState, DeviceGL, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a sprite batch and several textures that we want to render
const spriteBatch = device.createSpriteBatch()
const texture = device.createTexture({
  data: '/assets/videos/big-buck-bunny.mp4',
})
// start the playback of the video texture automatically
texture.video.autoplay = true
texture.video.loop = true

const view = Mat4.createIdentity()
const temp = Mat4.createIdentity()

// Begin the render loop and accumulate the time
loop((time, dt) => {
  const pulse = (Math.sin((2 * Math.PI * time) / 2000) + 1) / 2

  // Resize back buffer and clear the screen
  device.resize()
  device.clear(0xff2e2620, 1.0)
  // Set blend state to alpha blend. We want one sprite to fade in and out on screen.
  device.blendState = BlendState.NonPremultiplied

  view.initPerspectiveFieldOfView(
    Math.PI / 3,
    device.drawingBufferAspectRatio,
    0.1,
    1000,
  )

  // Begin the sprite batch. This will prepare the sprite batch to receive
  // sprite instructions. The instructions wont be rendered instantly but only
  // when we call `end`
  spriteBatch.begin({
    // use custom projection matrix
    viewProjection: view,
  })

  // red texture
  spriteBatch
    .draw(texture)
    .destination(-1, 0.5, 2.0, -1.0)
    .transformMat4(
      temp
        .initTranslation(0, 0, -2)
        .rotateY(Math.PI / 4)
        .scaleUniform(1 + pulse * 0.25),
    )

  // Call `end` to close the sprite batch. This will finally render everything since the last call to `begin`.
  spriteBatch.end()
})

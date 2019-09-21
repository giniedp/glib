import { BlendState, Device } from '@gglib/graphics'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a sprite batch and several textures that we want to render
const spriteBatch = device.createSpriteBatch()
const texture1 = device.createTexture({ data: '/assets/textures/prototype/proto_red.png' })
const texture2 = device.createTexture({ data: '/assets/textures/prototype/proto_green.png' })
const texture3 = device.createTexture({ data: '/assets/textures/prototype/proto_blue.png' })
const texture4 = device.createTexture({ data: '/assets/videos/big-buck-bunny.mp4' })
// start the playback of the video texture automatically
texture4.video.autoplay = true
texture4.video.loop = true

// Begin the render loop and accumulate the time
loop((time, dt) => {
  const pulse = (Math.sin(2 * Math.PI * time / 2000) + 1) / 2

  // Resize back buffer and clear the screen
  device.resize()
  device.clear(0xff2e2620, 1.0)
  // Set blend state to alpha blend. We want one sprite to fade in and out on screen.
  device.blendState = BlendState.NonPremultiplied

  // Begin the sprite batch. This will prepare the sprite batch to receive
  // sprite instructions. The instructions wont be rendered instantly but only
  // when we call `end`
  spriteBatch.begin()

  const vh = device.viewportState.height
  const pad = vh * 0.025
  const size = vh * 0.45

  // red texture
  spriteBatch
    // Begin drawing a texture.
    // This returns a sprite builder object with chainable methods that allows
    // us to specify more parameters of the sprite.
    .draw(texture1)
    // Set the tint color. This will be multiplied with the texture color.
    // Since we use white here, it actually has no effect on the output.
    .tint(0xFFFFFFFF)
    // Set the alpha. This can only be called after `color` is set. Otherwise it would have no effect.
    .alpha(pulse)
    // Set destination rectangle on screen.
    .destination(
      pad,
      pad,
      size,
      size)

  // green texture
  spriteBatch
    // Begin drawing a texture.
    .draw(texture2)
    // Set destination rectangle on screen.
    .destination(
      pad + 1 * (size + pad) - pad * pulse,
      pad - pad * pulse,
      size + 2 * pad * pulse,
      size + 2 * pad * pulse)

  // blue texture
  spriteBatch
    // Begin drawing a texture.
    .draw(texture3)
    // Rotate the sprite
    // .rotation()
    // Set the origin of the rotation (in normalized cooridnates).
    // .origin(0.5, 0.5)
    // Set destination rectangle on screen.
    .destination(
      pad + 2 * (size + pad),
      pad,
      size,
      size,
      null,
      2 * Math.PI * time / 2000,
      size / 2,
      size / 2,
    )

  // video split 1
  spriteBatch
    // Begin drawing a texture.
    .draw(texture4)
    // Set the source rectangle. That is the portion of the texture that should be rendered.
    .source(0, 0, texture4.width / 3, texture4.height)
    // Set destination rectangle on screen.
    .destination(
      pad + 0 * (size + pad) + pad * pulse,
      pad + 1 * (size + pad),
      size,
      size)

  // video split 2
  spriteBatch
    // Begin drawing a texture.
    .draw(texture4)
    // Set the source rectangle. That is the portion of the texture that should be rendered.
    .source(texture4.width / 3, 0, texture4.width / 3, texture4.height)
    // Set destination rectangle on screen.
    .destination(
      pad + 1 * (size + pad),
      pad + 1 * (size + pad),
      size,
      size)

  // video split 3
  spriteBatch
    // Begin drawing a texture.
    .draw(texture4)
    // Set the source rectangle. That is the portion of the texture that should be rendered.
    .source(2 * texture4.width / 3, 0, texture4.width / 3, texture4.height)
    // Set destination rectangle on screen.
    .destination(
      pad + 2 * (size + pad) - pad * pulse,
      pad + 1 * (size + pad),
      size,
      size)

  // Call `end` to close the sprite batch. This will finally render everything since the last call to `begin`.
  spriteBatch.end()
})

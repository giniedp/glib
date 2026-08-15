import { createDevice, Device, PlatformId, TaskContext } from '@gglib/graphics'
import { MS_TO_SEC, vec4 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const settings = {
  speed: 1.0,
}

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  // The `Device` is the entry point to the graphics API. It wraps either a
  // WebGL2 or a WebGPU context (depending on `platform`) behind a single API,
  // so the rest of the code stays mostly platform agnostic.
  //
  // Device creation is asynchronous, `.ready` resolves once the backend
  // (and, for WebGPU, the adapter and device) has been acquired.
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  // `renderPass` is the recording interface for draw calls, state changes and
  // clear operations. There is a single instance that gets reused every frame.
  const pass = device.renderPass

  mountUi(tools, (ui) => {
    ui.scalar(settings, 'speed', {
      min: 0,
      max: 2,
      range: true,
    })
  })

  const color = vec4(1)
  function frame(ctx: TaskContext) {
    // Animate the clear color so it is obvious the loop is actually running.
    const hue = (ctx.time * MS_TO_SEC * settings.speed) % (Math.PI * 2)
    color.x = 0.5 + 0.5 * Math.sin(hue)
    color.y = 0.5 + 0.5 * Math.sin(hue + 2)
    color.z = 0.5 + 0.5 * Math.sin(hue + 4)
    pass.setClearColor(0, color)

    // fill the render target with the color configured above.
    // Nothing else happens in this example - no shaders, no geometry yet.
    pass.clear()

    // send the recorded commands to the GPU. This will keep all the
    // state on the render pass for subsequend commands.
    pass.submit()

    // reset the render pass state to it's default. Internally this will
    // also submit all pending commands before resetting
    pass.flush()
  }

  // For a simple use cases like this demo, the built in task scheduler can be
  // used to register a frame loop.
  device.scheduler.add(frame)

  // Tear down function that will be called, when the example is unmounted.
  // Always dispose the device to free GPU resources and the canvas context.
  return () => {
    device.dispose()
  }
}

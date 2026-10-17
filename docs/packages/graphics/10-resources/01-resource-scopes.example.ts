import {
  BasicMaterial,
  BlendState,
  Color,
  CommonInputs,
  CommonMaterialProps,
  createDevice,
  DepthState,
  Device,
  FrameContext,
  Mesh,
  PlatformId,
  ResourceScope,
  sphereGeometry,
} from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  Mat4,
  mat4$initPerspectiveFieldOfView,
  mat4$initTranslation,
  mat4$invert,
  mat4CreateTranslationXYZ,
  mat4Identity,
  vec3,
} from '@gglib/math'
import { mount } from 'tweak-ui'

/**
 * A renderable object of a scene
 */
interface SceneObject {
  world: Mat4
  mesh: Mesh
}

/**
 * A scene that is currently loaded
 */
interface Scene {
  enabled: boolean
  scope: ResourceScope
  objects: SceneObject[]
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const scenes: Record<string, Scene> = {
    Room1: { enabled: true, scope: null!, objects: [] },
    Room2: { enabled: false, scope: null!, objects: [] },
    Room3: { enabled: false, scope: null!, objects: [] },
    Room4: { enabled: false, scope: null!, objects: [] },
  }

  const counts: Record<string, number> = { global: 0 }

  // Brings the loaded scenes in line with the toggles:
  // switched on scenes are created if they don't exist, switched off scenes are disposed with their scope
  function syncScenes() {
    let index = -1
    for (const name in scenes) {
      index++
      const scene = scenes[name]
      if (!scene.enabled && scene.objects?.length) {
        // dispose
        scene.scope.dispose()
        scene.scope = null!
        scene.objects = null!
      }
      if (scene.enabled && !scene.objects?.length) {
        // create
        createScene(device, scene, index)
      }
    }
  }

  const stats = device.stats()
  const panel = mount(tools, (ui) => {
    ui.group('Scenes', () => {
      for (const name in scenes) {
        ui.bool(scenes[name], 'enabled', { label: name })
      }
    })

    ui.graph({
      rows: [
        { name: 'Textures', sample: () => stats.textureCount, min: 0, max: 20 },
        { name: 'Buffers', sample: () => stats.bufferCount, min: 0, max: 20 },
        { name: 'Shader', sample: () => stats.shaderCount, min: 0, max: 20 },
      ],
    })
  })

  const view = mat4Identity()
  const projection = mat4Identity()
  const cameraPosition = vec3(0, 0, 9)

  const rtColor = device.createRenderTarget({
    format: device.output.format,
    width: device.output.width,
    height: device.output.height,
    sampleCount: 4,
  })
  const rtDepth = device.createDepthTarget({
    format: 'depth24plus',
    width: device.output.width,
    height: device.output.height,
    sampleCount: 4,
  })

  const pass = device.renderPass
  function frame(ctx: FrameContext) {
    syncScenes()
    device.stats(stats)

    rtColor.resizeToMatch(device.output)
    rtDepth.resizeToMatch(device.output)
    mat4$initTranslation(view, cameraPosition)
    mat4$invert(view)
    mat4$initPerspectiveFieldOfView(projection, 50 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    pass.setRenderTarget(0, rtColor, 0, 0, device.output)
    pass.setDepthTarget(rtDepth)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setDepthState(DepthState.LessEqual)
    pass.setRenderBlend(0, BlendState.Opaque)
    pass.clear()

    for (const name in scenes) {
      const scene = scenes[name]
      if (!scene?.objects) {
        continue
      }
      for (const object of scene.objects) {
        for (const material of object.mesh.materials) {
          material.setInput(CommonInputs.Object.ModelMatrix, object.world)
          material.setInput(CommonInputs.View.ViewMatrix, view)
          material.setInput(CommonInputs.View.ProjectionMatrix, projection)
        }
        object.mesh.render(pass)
      }
    }

    pass.resolve()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    panel.dispose()
    device.dispose()
  }
}

const colors = ['purple', 'red', 'green', 'orange']
function createScene(device: Device, scene: Scene, index: number) {
  scene.scope = device.createScope(`scene ${index}`)
  scene.objects = []

  const x = (Math.floor(index % 2) - 0.5) * 4
  const y = (Math.floor(index / 2) - 0.5) * 4
  const world = mat4CreateTranslationXYZ(x, y, 0)
  const color = colors[index]

  const mesh = new Mesh(device, {
    materials: [
      new BasicMaterial(device, {
        properties: {
          BaseMap: device.createTexture({
            source: `/textures/prototype/${color}/texture_02.png`,
          }),
        } satisfies CommonMaterialProps,
      }),
    ],
    geometries: [sphereGeometry(device, { radius: 1 })],
    parts: [{ materialIndex: 0, geometryIndex: 0 }],
  })
  scene.scope.adopt(mesh)

  scene.objects.push({
    mesh,
    world,
  })
}

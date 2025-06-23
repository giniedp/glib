import { buildCube, createDevice, GeometryBuilder, LightType, SamplerState } from '@gglib/graphics'
import { LightParams, materialProgram } from '@gglib/materials'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({
    canvas,
  })

  const lightingEffect = device.createEffect({
    program: materialProgram({
      BASE_COLOR_MAP: true,
      NORMAL_MAP: true,
      PARALLAX_MAP: true,
      PARALLAX_OCCLUSION: true,
      OCCLUSION_MAP: true,
      V_TANGENT: false,
      LIGHT: true,
      LIGHT_COUNT: 1,
      SHADE_FUNCTION: 'shadeBlinn',
      ROUGHNESS: true,
    }),
  })

  const light = new LightParams()
  light.enabled = true
  light.type = LightType.Directional
  light.color = [1, 1, 1]
  light.direction = [0, 0, -1]

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const cam = Mat4.createIdentity()

  const mesh = GeometryBuilder.begin()
    .append(buildCube, { size: 2, tesselation: 32 })
    .closeGeometry()
    .calculateNormalsAndTangents()
    .endMesh(device, {
      materials: [
        {
          effect: lightingEffect,
          parameters: {
            BaseColorMap: device.createTexture({
              source: '/textures/sharetextures/StoneWall_Base.png',
              sampler: SamplerState.LinearWrap,
              generateMipmap: true,
            }),
            NormalMap: device.createTexture({
              source: '/textures/sharetextures/StoneWall_Normal.png',
              sampler: SamplerState.LinearWrap,
              generateMipmap: true,
            }),
            OcclusionMap: device.createTexture({
              source: '/textures/sharetextures/StoneWall_AO.png',
              sampler: SamplerState.LinearWrap,
              generateMipmap: true,
            }),
            ParallaxMap: device.createTexture({
              source: '/textures/sharetextures/StoneWall_Height.png',
              sampler: SamplerState.LinearWrap,
              generateMipmap: true,
            }),
            ParallaxScaleBias: [0.04, 0.01],
            Roughness: 0.25,
          },
        },
      ],
    })!

  function frame(time: number, dt: number) {
    device.resize()
    device.clear(0xff2e2620, 1)

    cam.setTranslationXYZ(0, 0, 2)
    Mat4.invert(cam, view)
    proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 10)
    world.initRotationY(time / 4000)

    for (const mtl of mesh.materials) {
      mtl.parameters.World = world
      mtl.parameters.View = view
      mtl.parameters.Projection = proj
      mtl.parameters.CameraPosition = cam.getTranslation()
      light.assign(0, mtl.parameters)
    }
    mesh.draw()
  }

  TweakUi.mount(tools, (ui) => {
    ui.collapsible('Parallax', () => {
      ui.slider<any>(mesh.materials[0].parameters.ParallaxScaleBias, 0, {
        min: -0.5,
        max: 0.5,
        step: 0.001,
        label: 'Scale',
      })
      ui.slider<any>(mesh.materials[0].parameters.ParallaxScaleBias, 1, {
        min: -0.5,
        max: 0.5,
        step: 0.001,
        label: 'Bias',
      })
    })
    ui.collapsible('Light', () => {
      ui.checkbox(light, 'enabled')
      ui.color(light, 'color', { format: '[n]rgb' })
      ui.spherical(light, 'direction', {
        codec: TweakUi.sphericalCodec({
          axes: { 0: 'right', 1: 'up', 2: 'back' },
          length: -1,
          result: () => light.direction,
        }) as any,
      })
    })
  })

  return loop(frame).stop
}

import { EcsGame } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { Device, type WebGpuDevice } from '@gglib/graphics'
import { DEGREE_TO_RAD, mat4GetRight, mat4GetTranslation, mat4GetUp, vec3, vec3$normalize } from '@gglib/math'
import { Renderer } from '@gglib/render'
import { AMBIENT_LIGHT_MODE, FAKE_PROBE_AMBIENT } from '../../constants'
import { InputBlocks, InputSlots } from '../../material'
import { LightClusterShader, type LightClusterLight, type LightClusterShaderOptions } from './LightClusterShader'
import { LightComponent } from './LightComponent'

export interface LightSystemOptions extends LightClusterShaderOptions {}

/**
 * Tracks scene lights and computes a clustered Forward+ light list each frame.
 *
 * @remarks
 * - lights are collected from active entities with a {@link LightComponent}
 * - light clustering is done by the {@link LightClusterShader}
 * - the buffers and cluster parameters are fed into the renderer inputs as the shared `lights` block
 */
const DEFAULT_COLOR = [1, 1, 1, 1]

export class LightSystem extends GameSystem {
  public intensityScale = 1.0
  public enabled = true

  /** Number of lights uploaded in the last frame */
  public get lightCount() {
    return this.shader?.lightCount ?? 0
  }

  private options: LightSystemOptions
  private game: EcsGame
  private renderer: Renderer
  private query: GameQuery
  private shader: LightClusterShader

  private light: Required<LightClusterLight> = {
    type: 'point',
    position: vec3(),
    direction: vec3(),
    tangent: vec3(),
    color: vec3(),
    range: 0,
    specular: 0,
    bulbSize: 0,
    width: 0,
    height: 0,
    coneAngle: 0,
    coneAngleInner: 0,
    ambient: false,
  }

  public constructor(options?: LightSystemOptions) {
    super()
    this.options = options
  }

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.renderer = world.getSystem(Renderer)
    this.query = world.query({ scope: 'active', required: [LightComponent] })

    const device = world.getSystem(Device)
    if (!device.isWebGPU) {
      console.warn('LightSystem requires WebGPU, lights are disabled')
      this.enabled = false
      return
    }

    this.shader = new LightClusterShader(device as WebGpuDevice, this.options)
    this.renderer.inputs.createBlock(InputBlocks.Lights)
    this.renderer.inputs.set(InputSlots.Lights.LightList, this.shader.lightBuffer)
    this.renderer.inputs.set(InputSlots.Lights.LightClusters, this.shader.clusterBuffer)
    this.renderer.inputs.set(InputSlots.Lights.LightIndices, this.shader.indexBuffer)
    this.updateClusterInputs()
  }

  public override render(): void {
    if (!this.shader?.isValid) {
      return
    }
    const camera = this.game.scene.getView(0)?.camera
    if (!camera) {
      return
    }

    this.shader.begin()
    if (this.enabled) {
      this.addLights()
    }
    // submitted before the geometry pass, so shading sees the result
    this.shader.dispatch(camera.view, camera.projection)
    this.updateClusterInputs()
  }

  private updateClusterInputs() {
    this.renderer.inputs.set(InputSlots.Lights.ClusterGrid, this.shader.clusterGrid)
    this.renderer.inputs.set(InputSlots.Lights.ClusterDepth, this.shader.clusterDepth)
    this.renderer.inputs.set(InputSlots.Global.FakeProbeAmbient, this.fakeProbeAmbient)
  }

  private fakeProbeAmbient = AMBIENT_LIGHT_MODE === 'fake-probe' ? vec3(FAKE_PROBE_AMBIENT) : vec3(0)

  private addLights() {
    for (const entity of this.query) {
      const component = entity.component(LightComponent)
      if (component.config.ambient && AMBIENT_LIGHT_MODE === 'skip') {
        continue
      }
      if (component.enabled && this.writeLight(component, this.light)) {
        this.shader.addLight(this.light)
      }
    }
  }

  private writeLight(component: LightComponent, out: LightClusterLight): boolean {
    const config = component.config
    const ambient = !!config.ambient && (AMBIENT_LIGHT_MODE === 'modulate' || AMBIENT_LIGHT_MODE === 'fake-probe')
    // the color of ambient lights is a multiplier, the viewer intensity scale does not apply
    const diffuse = (config.diffuseMultiplier ?? 1) * (ambient ? 1 : this.intensityScale)
    const specular = config.specMultiplier ?? 1
    if (!(diffuse > 0) && !(specular > 0)) {
      return false
    }

    const world = component.entity.getTransform().world
    mat4GetTranslation(world, out.position)
    // CryEngine convention: lights emit along local +X
    // area lights span their width along local +Y and their height along local +Z
    vec3$normalize(mat4GetRight(world, out.direction))
    vec3$normalize(mat4GetUp(world, out.tangent))

    const color = config.color || DEFAULT_COLOR
    out.color.x = (color[0] ?? 1) * diffuse
    out.color.y = (color[1] ?? 1) * diffuse
    out.color.z = (color[2] ?? 1) * diffuse
    out.specular = specular
    out.range = config.range || 0
    out.bulbSize = config.attenuation || 0.05
    out.width = 0
    out.height = 0
    out.coneAngle = 0
    out.coneAngleInner = 0
    out.ambient = ambient

    switch (component.type) {
      case 'Point': {
        out.type = 'point'
        return true
      }
      case 'Projector': {
        out.type = 'spot'
        out.coneAngle = Math.min(Math.max((config.projectorFOV || 90) * 0.5, 0.1), 89.9) * DEGREE_TO_RAD
        return true
      }
      case 'Area': {
        out.type = 'area'
        out.width = config.areaWidth
        out.height = config.areaHeight
        // the area FOV is the frustum half angle (LightInstance: m_fLightFrustumAngle = m_areaFOV),
        // the tiled shading uses cos(areaFOV) for the spot falloff (D3DTiledShading.cpp)
        const fov = config.areaFOV || 0
        if (fov > 0) {
          out.coneAngle = fov * DEGREE_TO_RAD
        }
        // rectangular area lights use the rectangle size as attenuation bulb
        if (out.width && out.height && fov) {
          out.bulbSize = (out.width + out.height) * 0.25
        }
        return true
      }
      default: {
        return false
      }
    }
  }

  public destroy(): void {
    this.shader?.dispose()
  }
}

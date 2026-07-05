import {
  BasicGame,
  BoundsComponent,
  CameraComponent,
  MeshComponent,
  OccTree,
  SpatialRootComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent, type CreateEntityOptions } from '@gglib/ecs'
import { Color, Mesh, planeGeometry, sphereGeometry, type Device } from '@gglib/graphics'
import { BoundingSphere, Mat4, Vec3 } from '@gglib/math'
import { Renderer, type RenderContext } from '@gglib/render'
import { lfmt } from '@gglib/utils'
import { fetchTypedRequest, getLevelInfoUrl } from '../../api'
import { ContentService } from '../../content'
import { InputSlots, SkyMaterial } from '../../material'
import { ShapeMaterial } from '../../material/ShapeMaterial'
import { MeshLoaderComponent } from '../slice/MeshLoaderComponent'
import { TerrainSystem } from '../terrain/TerrainSystem'
import { levelEntityOptions } from './LevelComponent'
import { TimeOfDay } from './TimeOfDay'
import { TimeOfDayComponent } from './TimeOfDayComponent'

export class LevelSystem extends GameSystem {
  private content: ContentService
  private todQuery: GameQuery

  public game: BasicGame
  public entity: GameEntity
  public timeOfDay = new TimeOfDay()
  public camera: CameraComponent

  private renderer: Renderer
  private skyEntity: GameEntity
  private gizmoEntity: GameEntity

  private logTag = lfmt.badge('#FF9DA7', 'LevelSystem')
  public initialize(game: GameWorld): void {
    this.game = game.getSystem(BasicGame)
    this.content = game.getSystem(ContentService)
    this.renderer = game.getSystem(Renderer)
    this.todQuery = game.query({ scope: 'active', required: [TimeOfDayComponent] })

    // this.skyMaterial = new SkyMaterial(device)

    this.renderer.onContextReady.add((ctx) => {
      this.updateRenderContext(ctx)
    })
  }

  public destroy(): void {
    this.unload()
  }

  public override update(time: number, dt: number): void {
    const cam = this.camera.entity.getTransform().world.getTranslation()

    for (const entity of this.todQuery) {
      const it = entity.component(TimeOfDayComponent)
      if (it.isPointInside(cam)) {
        this.timeOfDay.scheduleAdd(it.preset, it.config.priority, it.config.blendTime)
      } else {
        this.timeOfDay.scheduleRemove(it.preset)
      }
    }

    this.timeOfDay.update(time, dt)

    const skyMesh = this.skyEntity?.component<MeshComponent>(MeshComponent, GetComponent.Optional)?.mesh
    if (skyMesh) {
      const material = skyMesh.materials[0] as SkyMaterial
      material.NightMoonColor = this.timeOfDay.nightSkyMoonColor
      material.NightMoonInnerCorona = this.timeOfDay.nightSkyMoonInnerCorona
      material.NightMoonOuterCorona = this.timeOfDay.nightSkyMoonOuterCorona
      material.NightSkyColBase = this.timeOfDay.nightSkyHorizonColor
      material.NightSkyColDelta = this.timeOfDay.nightSkyColorDelta
      material.NightSkyZenithColShift = this.timeOfDay.nightSkyZenithColorShift
      material.setMoonParams(
        this.timeOfDay.moonRotationLatitude,
        this.timeOfDay.moonRotationLongitude,
        this.timeOfDay.moonSize,
        this.timeOfDay.moonDirection,
      )
      if (this.timeOfDay.moonTexture) {
        material.MoonMap = this.timeOfDay.moonTexture
      }
      material.setSkylightParams(
        this.timeOfDay.skyKM,
        this.timeOfDay.skyKR,
        this.timeOfDay.skyG,
        this.timeOfDay.skyWaveR,
        this.timeOfDay.skyWaveG,
        this.timeOfDay.skyWaveB,
        this.timeOfDay.sunIntensity / 1000,
      )
    }
  }

  public async loadLevel(name: string) {
    this.unload()
    if (!name) {
      return
    }
    console.log(...lfmt.merge(this.logTag, lfmt.green(`Loading level ${name}`)))
    const baseUrl = this.content.nwbtUrl
    const levelInfo = await fetchTypedRequest(baseUrl, getLevelInfoUrl(name))

    console.log(...this.logTag, 'Level data loaded', levelInfo)
    this.entity = this.game.createEntity(levelEntityOptions(this.game.scene, levelInfo))
    this.timeOfDay.reset(levelInfo.mission?.timeOfDay || null)
    const lighting = levelInfo.mission?.environment?.lighting
    if (lighting) {
      this.timeOfDay.setLighting(lighting)
    }
    const moon = levelInfo.mission?.environment?.moon
    if (moon) {
      this.timeOfDay.moonRotationLatitude = moon.latitude
      this.timeOfDay.moonRotationLongitude = moon.longitude
      this.timeOfDay.moonSize = moon.size
      this.content.loadTexture(moon.texture).then((texture) => {
        this.timeOfDay.moonTexture = texture
      })
    }

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    // this.skyEntity = this.game.createEntity(skyEntity(this.entity))
    this.game.world.getSystem(TerrainSystem).mountainHeight = levelInfo.mountainHeight
    this.game.world.getSystem(TerrainSystem).oceanLevel = levelInfo.oceanLevel
  }

  public async loadModel(model: string, material?: string, transform?: number[]) {
    this.unload()
    if (!model) {
      return
    }

    const camera = this.game.view.camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    wasd.orbitMode = true
    wasd.radiusMax = 1000
    this.entity = this.game.createEntity({
      name: `Model: ${model}`,
      components: [
        new SpatialRootComponent({
          instance: OccTree.create({
            min: Vec3.create(-2048, -2048, -2048),
            max: Vec3.create(2048, 2048, 2048),
            leafLevel: 5,
            looseFactor: 2,
          }),
        }),
        new MeshLoaderComponent({
          type: 'Mesh',
          mesh: model,
          material,
          alwaysRender: true,
        }),
      ],
      parent: this.game.scene,
      transform: new TransformComponent({
        keepWorld: true,
        world: transform ? Mat4.createFromArray(transform) : Mat4.createIdentity(),
      }),
    })
    this.entity.events.on(MeshLoaderComponent.onLoad, (e) => {
      setTimeout(() => {
        // must be next frame, when bounds are updated
        this.handleModelLoadeed(e, wasd)
      })
    })

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    // this.skyEntity = this.game.createEntity(skyEntity(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  private unload() {
    this.skyEntity = null
    this.gizmoEntity = null
    if (this.entity) {
      this.entity.setParent(null)
      this.entity.destroy()
      this.entity = null
    }
  }

  private handleModelLoadeed(entity: GameEntity, wasd: WASDComponent) {
    const sphere = BoundingSphere.create()
    for (const child of entity.getTransform().children) {
      const bounds = child.entity.component(BoundsComponent, GetComponent.Optional)
      if (bounds?.world?.sphere) {
        sphere.mergeSphere(bounds.world.sphere)
      }
    }
    if (!sphere.isEmpty) {
      Vec3.copy(sphere.center, wasd.orbitCenter)
      wasd.targetRadius = sphere.radius * 2
    }
  }

  // #region Render context
  private scaledBottomFogColor = Vec3.create()
  private scaledTopFogColor = Vec3.create()
  private updateRenderContext(ctx: RenderContext) {
    const tod = this.timeOfDay
    ctx.renderInputs.set(InputSlots.Global.SunDirection, tod.sunDirection)
    ctx.renderInputs.set(InputSlots.Global.SunColor, tod.sunColor)

    this.scaledBottomFogColor.init(
      tod.bottomFogColor.x * tod.bottomFogMultiplier,
      tod.bottomFogColor.y * tod.bottomFogMultiplier,
      tod.bottomFogColor.z * tod.bottomFogMultiplier,
    )
    ctx.renderInputs.set(InputSlots.Global.BottomFogColor, this.scaledBottomFogColor)

    this.scaledTopFogColor.init(
      tod.topFogColor.x * tod.topFogMultiplier,
      tod.topFogColor.y * tod.topFogMultiplier,
      tod.topFogColor.z * tod.topFogMultiplier,
    )
    ctx.renderInputs.set(InputSlots.Global.TopFogColor, this.scaledTopFogColor)

    ctx.renderInputs.set(InputSlots.Global.TopFogDensity, tod.topFogDensity)
    ctx.renderInputs.set(InputSlots.Global.BottomFogDensity, tod.bottomFogDensity)
    ctx.renderInputs.set(InputSlots.Global.TopFogHeight, tod.topFogHeight)
    ctx.renderInputs.set(InputSlots.Global.BottomFogHeight, tod.bottomFogHeight)
    ctx.renderInputs.set(InputSlots.Global.FogHeightOffset, tod.fogHeightOffset)

    ctx.renderInputs.set(InputSlots.Global.CloudShadingSunColor, tod.cloudshadingCustomSunColor)
    ctx.renderInputs.set(InputSlots.Global.CloudShadingSkyColor, tod.cloudshadingCustomSkyColor)
  }
  // #endregion
}

function createGizmoGrid(parent: GameEntity, device: Device): CreateEntityOptions {
  const grid = planeGeometry(device, {
    lines: true,
    width: 128,
    depth: 128,
    widthSegments: 128,
    depthSegments: 128,
    vertexTransform: Mat4.createRotationX(-Math.PI / 2),
  })
  const material = new ShapeMaterial(device)
  material.Color = Color.DimGray.toVec4()
  material.Transform = Mat4.createIdentity()

  return {
    parent,
    name: 'GizmoGrid',
    transform: new TransformComponent({
      keepWorld: true,
    }),
    components: [
      new MeshComponent({
        mesh: new Mesh(device, {
          materials: [material],
          partImports: [
            {
              geometry: grid,
              materialIndex: 0,
            },
          ],
        }),
      }),
    ],
  }
}

const SKY_DOME_CGF = 'objects/sky/skydome_a.cgf'
const SKY_MATERIAL = 'objects/sky/sky_cutlass_b.mtl'
// const SKY_MATERIAL = 'objects/sky/sky_isabella_darkcrossing.mtl'
function skyEntity(parent: GameEntity): CreateEntityOptions {
  return {
    name: `Sky`,
    parent: parent,
    components: [
      new MeshLoaderComponent({
        type: 'Mesh',
        mesh: SKY_DOME_CGF,
        material: SKY_MATERIAL,
        alwaysRender: true,
      }),
    ],
  }
}

function createSkySphere(parent: GameEntity, device: Device): CreateEntityOptions {
  const geometry = sphereGeometry(device, {
    radius: 128,
    vertexTransform: Mat4.createRotationX(-Math.PI / 2),
  })
  const material = new SkyMaterial(device)
  return {
    name: `Sky`,
    parent: parent,
    components: [
      new MeshComponent({
        mesh: new Mesh(device, {
          materials: [material],
          partImports: [
            {
              geometry: geometry,
              materialIndex: 0,
            },
          ],
        }),
      }),
    ],
  }
}

import { BasicGame, ModelComponent } from '@gglib/components'
import { GameEntity, GameQuery, GameSystem, GameWorld, type CreateEntityOptions } from '@gglib/ecs'
import { Device } from '@gglib/graphics'
import { vec3, Vec3 } from '@gglib/math'
import type { Model } from '@gglib/model'
import { Renderer, type RenderContext } from '@gglib/render'
import { uiColor, uiGroup, uiNumber } from 'tweak-ui'
import {
  fetchTypedRequest,
  getHeightmapInfoUrl,
  getLevelInfoUrl,
  getLevelMissionUrl,
  type EntityData,
  type TerrainData,
} from '../../api'
import { ContentService } from '../../content'
import { SkyComponent } from '../../environment/SkyComponent'
import { NwBindingKeys, SkyMaterial } from '../../material'
import { RegionComponent } from '../region/RegionComponent'
import { TerrainComponent, terrainEntity } from '../terrain/TerrainComponent'
import { LevelComponent, type LevelOptions } from './LevelComponent'

const SKY_DOME_CGF = 'objects/sky/skydome_a.cgf'
const SKY_MATERIAL = 'objects/sky/sky_cutlass_b.mtl'

export function levelEntity(scene: GameEntity, options: LevelOptions): CreateEntityOptions {
  return {
    name: `Level ${options.level.name}`,
    parent: scene,
    components: [new LevelComponent(options)],
  }
}

export function skyEntity(parent: GameEntity): CreateEntityOptions {
  return {
    name: `Sky`,
    parent: parent,
    components: [new SkyComponent(), new ModelComponent()],
  }
}

export class LevelSystem extends GameSystem {
  private content: ContentService

  public game: BasicGame
  public entity: GameEntity
  public terrainEnabled = true

  private qrLevels: GameQuery
  private qrTerrain: GameQuery
  private qrRegions: GameQuery
  private qrSky: GameQuery

  private skyModel: Model
  private skyMaterial: SkyMaterial
  private renderer: Renderer

  public sunColor = Vec3.create(1, 0.71085715, 0.5335781)
  public sunDirection = Vec3.create(0, -1, 1).normalize()

  public nightHorizonColor = Vec3.create(0.30822289, 0.42747056, 0.55529737)
  public nightHorizonColorMul = 0.3
  public nightZenithColor = Vec3.create(0.35235596, 0.42342144, 0.45617884)
  public nightZenithColorMul = 0

  public bottomFogColor = Vec3.create(0.21678638, 0.41612425, 0.79515541)
  public bottomFogMultiplier = 0.97500086
  public bottomFogHeight = 0
  public bottomFogDensity = 0.050000004

  public topFogColor = Vec3.create(0.17437994, 0.42185885, 0.76625574)
  public topFogMultiplier = 0.97500086
  public topFogHeight = 400
  public topFogDensity = 0.020000001

  public fogHeightOffset = 0.5

  public initialize(game: GameWorld): void {
    this.game = game.getSystem(BasicGame)
    this.content = game.getSystem(ContentService)
    this.renderer = game.getSystem(Renderer)

    this.qrLevels = game.query({ required: [LevelComponent] })
    this.qrTerrain = game.query({ required: [TerrainComponent] })
    this.qrRegions = game.query({ required: [RegionComponent] })
    this.qrSky = game.query({ required: [SkyComponent] })

    const device = game.getSystem(Device)
    this.skyMaterial = new SkyMaterial(device)

    this.content.loadModel(SKY_DOME_CGF, SKY_MATERIAL).then((model) => {
      this.skyModel = model
      for (const mesh of model.meshes) {
        for (let i = 0; i < mesh.materials.length; i++) {
          mesh.materials[i] = this.skyMaterial
        }
      }
    })

    this.renderer.onContextReady.add((ctx) => {
      this.updateRenderContext(ctx)
    })
  }

  public destroy(): void {
    this.unloadLevel()
  }

  public override update(): void {
    // for (const level of this.qrLevels) {
    //   for (const region of level.component(LevelComponent).regions) {
    //     // TODO: activate/decativate regions
    //   }
    // }

    for (const entity of this.qrRegions) {
      this.updateRegion(entity)
    }

    for (const entity of this.qrSky) {
      this.updateSky(entity)
    }
  }

  private updateRegion(entity: GameEntity) {
    const region = entity.component(RegionComponent)
    region.update(this.game.view.camera)
  }

  public setTerrainEnabled(value: boolean) {
    if (this.terrainEnabled === value) {
      return
    }
    this.terrainEnabled = value
  }

  public async loadLevel(name: string, mapName: string) {
    this.unloadLevel()
    if (!name) {
      return
    }
    const baseUrl = this.content.nwbtUrl
    const levelUrl = getLevelInfoUrl(name)
    const heightmapUrl = getHeightmapInfoUrl(name)
    const missionUrl = getLevelMissionUrl(name)

    const levelInfo = await fetchTypedRequest(baseUrl, levelUrl)
    const hasOcean = levelInfo.oceanLevel > 0
    const hasTerrain = levelInfo.mountainHeight > 256

    const heightmapInfo = await fetchTypedRequest(baseUrl, heightmapUrl).catch((err) => {
      console.error('failed to load heightmap', err)
      return null as TerrainData
    })
    const missionInfo = await fetchTypedRequest(baseUrl, missionUrl).catch((err): EntityData[] => {
      console.error('failed to load mission', err)
      return []
    })
    console.log('level info', levelInfo)
    console.log('heightmap info', heightmapInfo)
    console.log('mission info', missionInfo)

    this.entity = this.game.createEntity(
      levelEntity(this.game.scene, {
        level: levelInfo,
        mapName: mapName,
        heightmap: heightmapInfo,
        mission: missionInfo,
      }),
    )

    if (hasOcean || hasTerrain) {
      this.game.createEntity(terrainEntity(this.entity, heightmapInfo))
    }

    this.game.createEntity(skyEntity(this.entity))
  }

  private unloadLevel() {
    if (this.entity) {
      this.entity.setParent(null)
      this.entity.destroy()
      this.entity = null
    }
  }

  private updateSky(entity: GameEntity) {
    const modelComp = entity.component(ModelComponent)
    if (!modelComp.model && this.skyModel) {
      modelComp.model = this.skyModel
    }
  }

  private updateRenderContext(ctx: RenderContext) {
    ctx.renderParams[NwBindingKeys.Environment.SunDirection] = this.sunDirection
    ctx.renderParams[NwBindingKeys.Environment.SunColor] = this.sunColor

    Vec3.init(
      (ctx.renderParams[NwBindingKeys.Environment.BottomFogColor] ||= vec3(0)),
      this.bottomFogColor.x * this.bottomFogMultiplier,
      this.bottomFogColor.y * this.bottomFogMultiplier,
      this.bottomFogColor.z * this.bottomFogMultiplier,
    )
    Vec3.init(
      (ctx.renderParams[NwBindingKeys.Environment.TopFogColor] ||= vec3(0)),
      this.topFogColor.x * this.topFogMultiplier,
      this.topFogColor.y * this.topFogMultiplier,
      this.topFogColor.z * this.topFogMultiplier,
    )
    ctx.renderParams[NwBindingKeys.Environment.TopFogDensity] = this.topFogDensity
    ctx.renderParams[NwBindingKeys.Environment.BottomFogDensity] = this.bottomFogDensity
    ctx.renderParams[NwBindingKeys.Environment.TopFogHeight] = this.topFogHeight
    ctx.renderParams[NwBindingKeys.Environment.BottomFogHeight] = this.bottomFogHeight
    ctx.renderParams[NwBindingKeys.Environment.FogHeightOffset] = this.fogHeightOffset
  }

  public tweakUi() {
    return uiGroup(
      {
        title: 'Environment',
      },
      [
        uiColor({
          value: this,
          label: 'Sun Color',
          field: 'sunColor',
          format: '{n}xyz',
        }),

        uiGroup(
          {
            title: 'Bottom Fog',
          },
          [
            uiColor({
              value: this,
              label: 'Color',
              field: 'bottomFogColor',
              format: '{n}xyz',
            }),
            uiNumber({
              label: 'Multiplier',
              value: this,
              field: 'bottomFogMultiplier',
              slider: true,
              min: 0,
              max: 2,
              step: 0.01,
            }),
            uiNumber({
              label: 'Density',
              value: this,
              field: 'bottomFogDensity',
              slider: true,
              min: 0,
              max: 10,
              step: 0.1,
            }),
            uiNumber({
              label: 'Height',
              value: this,
              field: 'bottomFogHeight',
              slider: true,
              min: -1000,
              max: 1000,
              step: 1,
            }),
          ],
        ),
        uiGroup(
          {
            title: 'Top Fog',
          },
          [
            uiColor({
              value: this,
              label: 'Color',
              field: 'topFogColor',
              format: '{n}xyz',
            }),
            uiNumber({
              label: 'Multiplier',
              value: this,
              field: 'topFogMultiplier',
              slider: true,
              min: 0,
              max: 2,
              step: 0.01,
            }),
            uiNumber({
              label: 'Density',
              value: this,
              field: 'topFogDensity',
              slider: true,
              min: 0,
              max: 10,
              step: 0.1,
            }),
            uiNumber({
              label: 'Height',
              value: this,
              field: 'topFogHeight',
              slider: true,
              min: -1000,
              max: 1000,
              step: 1,
            }),
          ],
        ),

        // ui.number(this, 'fogHeightOffset', { slider: true, min: -100, max: 100, step: 0.1 })
      ],
    )
  }
}

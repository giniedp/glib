import {
  BoundsComponent,
  CameraComponent,
  EcsGame,
  LifeCycleFlags,
  MeshComponent,
  ModelComponent,
  OccTree,
  SpatialComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'
import { AssetType } from '@gglib/content'
import { GameEntity, GameSystem, GameWorld, GetComponent, type CreateEntityOptions } from '@gglib/ecs'
import {
  Color,
  Material,
  Mesh,
  planeGeometry,
  sphereGeometry,
  type Device,
  type MaterialOptions,
} from '@gglib/graphics'
import {
  BoundingSphere,
  DEGREE_TO_RAD,
  mat4CreateFromArray,
  mat4CreateRotationX,
  mat4CreateTranslation,
  mat4Identity,
  vec3,
  vec3Copy,
} from '@gglib/math'
import { Model } from '@gglib/model'
import { Renderer } from '@gglib/render'
import { lfmt } from '@gglib/utils'
import {
  assetReferenceKey,
  fetchTypedRequest,
  getLevelInfoUrl,
  isTimeOfDayComponent,
  isViewerLightComponent,
  isViewerMeshComponent,
  ParticleComponentName,
  type LevelInfo,
  type ViewerParticleComponent,
  type ViewerEntity,
  type ViewerMeshComponent,
  type ViewerSlice,
} from '../../api'
import { ContentService } from '../../content'
import { attachmentMaterial, clothMeshReference, parseCdf, skinAttachments } from '../../formats/cdf'
import { InputSlots, SkyMaterial } from '../../material'
import { ShapeMaterial } from '../../material/ShapeMaterial'
import { DebugShapeComponent } from '../debug/DebugShapeComponent'
import { CulledModelComponent } from '../culling/CulledModelComponent'
import { ParticleComponent } from '../particles/ParticleComponent'
import { createEnvProbeComponents } from '../probes/EnvProbeComponent'
import { MeshLoaderComponent } from '../slice/MeshLoaderComponent'
import { SliceSpawnerComponent } from '../slice/SliceSpawnerComponent'
import { SliceSystem } from '../slice/SliceSystem'
import { TerrainSystem } from '../terrain/TerrainSystem'
import { levelEntityOptions } from './LevelComponent'
import { loadShaderBallGeometries, SHADER_BALL_SIZE } from './ShaderBall'
import { SkyLightSystem } from './SkyLightSystem'
import { TimeOfDayComponent } from './TimeOfDayComponent'

export class LevelSystem extends GameSystem {
  private content: ContentService
  private sky: SkyLightSystem
  private terrain: TerrainSystem

  public game: EcsGame
  public camera: CameraComponent

  /**
   * Info of the loaded level, null while none is loaded
   */
  public levelInfo: LevelInfo | null = null

  private renderer: Renderer

  private entity: GameEntity
  private skyEntity: GameEntity
  private cloudsEntity: GameEntity
  /**
   * Key of the skybox slice the clouds dome is spawned from, null for the default dome
   */
  private cloudsKey: string | null = null
  private gizmoEntity: GameEntity
  private oceanLevel = -1000

  private logTag = lfmt.badge('#FF9DA7', 'LevelSystem')
  private get timeOfDay() {
    return this.sky.timeOfDay
  }

  public initialize(game: GameWorld): void {
    this.game = game.getSystem(EcsGame)
    this.content = game.getSystem(ContentService)
    this.renderer = game.getSystem(Renderer)

    this.sky = game.getSystem(SkyLightSystem)
    this.terrain = game.getSystem(TerrainSystem)
  }

  public destroy(): void {
    this.unload()
  }

  public override update(time: number, dt: number): void {
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

      material.SkyMieMap = this.sky.mieScatteringMap
      material.SkyRayleighMap = this.sky.rayleighScatteringMap
      material.setSkylightParams(
        this.timeOfDay.skyKM,
        this.timeOfDay.skyKR,
        this.timeOfDay.skyG,
        this.timeOfDay.skyWaveR,
        this.timeOfDay.skyWaveG,
        this.timeOfDay.skyWaveB,
        this.timeOfDay.skySunIntensity,
      )
      material.SunDirection = this.timeOfDay.skySunDirection
    }

    this.renderer.inputs.set(InputSlots.Global.OceanLevel, this.oceanLevel)
    this.updateCloudsDome()
  }

  /**
   * Swaps the cloud dome to the skybox slice of the active TimeOfDay POI
   */
  private updateCloudsDome() {
    if (!this.entity) {
      return
    }
    const sky = this.sky.activeSky
    const key = sky ? `${sky.guid}_${sky.subId}` : null
    if (key === this.cloudsKey) {
      return
    }
    this.cloudsKey = key
    if (this.cloudsEntity) {
      this.cloudsEntity.destroy()
      this.cloudsEntity.setParent(null)
    }
    const mesh = key ? findSkyMesh(this.content.slices.get(key)) : null
    if (key && !mesh) {
      console.warn(...this.logTag, `Skybox mesh not found in ${sky.hint || key}, using default clouds`)
    }
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity, mesh))
  }

  /**
   * Loads a level: the coatlicue `name` and the mission of the level folder `mission`, or of the folder with the
   * coatlicue's name. Resolves once the level info is loaded and the level entity exists, the regions stream later.
   */
  public async loadLevel(name: string, mission?: string | null) {
    this.loadCancel()
    // a model (e.g. a preview of the browser) left the camera orbiting
    if (this.camera) {
      this.camera.entity.component(WASDComponent).orbitMode = false
    }

    if (!name) {
      return
    }

    const loadSignal = this.beginLoad()

    console.log(...lfmt.merge(this.logTag, lfmt.green(`Loading level ${name}`)))

    const levelInfo = await fetchTypedRequest(this.content.nwbtUrl, getLevelInfoUrl(name, mission))
    loadSignal.throwIfAborted()

    // no data objects: with DevTools attached, the console keeps logged objects alive
    console.log(...this.logTag, 'Level data loaded', name)
    this.levelInfo = levelInfo

    this.entity = this.game.createEntity(levelEntityOptions(this.game.scene.entity, levelInfo))
    const scope = this.content.scopeOf(this.entity)

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    // the mission's own entities (a main menu's whole set) spawn like a slice, the global probes are created below
    const missionSlice = createMissionSlice(levelInfo.missionEntities)
    // removed again on unload
    this.content.slices.add(
      this,
      missionSlice ? { ...levelInfo.slices, [MISSION_SLICE_KEY]: missionSlice } : levelInfo.slices,
    )
    for (const options of createSkyboxSystem(this.entity, levelInfo.skyboxSystem)) {
      this.game.createEntity(options)
    }
    for (const options of createMissionProbes(this.entity, levelInfo.missionEntities)) {
      this.game.createEntity(options)
    }
    if (missionSlice) {
      const spawner = this.game.createEntity({
        name: `Mission ${levelInfo.level || levelInfo.name}`,
        parent: this.entity,
        transform: new TransformComponent({
          keepWorld: true,
          world: mat4Identity(),
          // initialized and activated by the SliceSystem
          lifeCycle: LifeCycleFlags.PropagateOnly,
        }),
        components: [new BoundsComponent(), new SliceSpawnerComponent({ slice: MISSION_SLICE_REF })],
      })
      this.game.world.getSystem(SliceSystem).addPreviewSpawner(spawner.component(SliceSpawnerComponent))
    }

    this.oceanLevel = levelInfo.oceanLevel
    this.timeOfDay.setLevelInfo(levelInfo, {
      content: this.content,
      scope: this.content.scopeOf(this.entity),
      signal: loadSignal,
    })

    this.terrain.setLevelInfo(levelInfo, {
      content: this.content,
      scope: this.content.scopeOf(this.entity),
      signal: loadSignal,
    })
  }

  public async loadModel(model: string, material?: string, transform?: number[]) {
    this.loadCancel()

    if (!model) {
      return
    }

    const loadSignal = this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    wasd.orbitMode = true
    wasd.radiusMax = 1000
    this.entity = this.game.createEntity({
      name: `Model: ${model}`,
      components: [
        new SpatialComponent({
          index: OccTree.create({
            min: vec3(-2048, -2048, -2048),
            max: vec3(2048, 2048, 2048),
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
      parent: this.game.scene.entity,
      transform: new TransformComponent({
        keepWorld: true,
        world: transform ? mat4CreateFromArray(transform) : mat4Identity(),
      }),
    })
    this.entity.events.on(MeshLoaderComponent.onLoad, (e) => {
      setTimeout(() => {
        // must be next frame, when bounds are updated
        this.handleModelLoadeed(e, wasd)
      })
    })

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  /**
   * Shows the body of a character (`.cdf`) at the origin: its skin and cloth attachments with their materials, in bind
   * pose, with the sky, the grid and the orbit camera (a preview of the browser). No skeleton, animations or bone
   * attachments (tmp/browser-features A2). Resolves once the parts are created, their models load later.
   */
  public async loadCharacter(path: string) {
    this.loadCancel()
    const signal = this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    camera.entity.component(WASDComponent).orbitMode = true
    camera.entity.component(WASDComponent).radiusMax = 1000

    const fetchFile = async (file: string) => {
      const res = await fetch(`${this.content.nwbtFileUrl}${file}`, { signal })
      if (!res.ok) {
        throw new Error(`${file}: ${res.status}`)
      }
      return res
    }
    const doc = parseCdf(await (await fetchFile(path)).text())
    // the mesh of a cloth is referenced inside its binary .cloth file
    const parts = await Promise.all(
      skinAttachments(doc).map(async (attachment) => {
        let mesh = attachment.binding
        if (/\.cloth$/i.test(mesh)) {
          const bytes = new Uint8Array(await (await fetchFile(mesh)).arrayBuffer())
          mesh = clothMeshReference(bytes) ?? ''
        }
        return { name: attachment.name, mesh, material: attachmentMaterial(attachment) }
      }),
    )
    signal.throwIfAborted()

    this.entity = this.game.createEntity({
      name: `Character: ${path}`,
      components: [
        new SpatialComponent({
          index: OccTree.create({
            min: vec3(-2048, -2048, -2048),
            max: vec3(2048, 2048, 2048),
            leafLevel: 5,
            looseFactor: 2,
          }),
        }),
      ],
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    let pending = 0
    const settled = () => {
      // next frame, when the bounds are updated
      if (--pending === 0) {
        setTimeout(() => this.frameModel())
      }
    }
    for (const part of parts) {
      if (!part.mesh) {
        console.warn(...this.logTag, 'character part without mesh', part.name)
        continue
      }
      pending++
      const entity = this.game.createEntity({
        name: part.name,
        parent: this.entity,
        transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
        components: [new MeshLoaderComponent({ type: 'Mesh', mesh: part.mesh, material: part.material, alwaysRender: true })],
      })
      entity.events.on(MeshLoaderComponent.onLoad, settled)
      entity.events.on(MeshLoaderComponent.onError, settled)
      this.characterParts.push({ name: part.name, mesh: part.mesh, material: part.material, loader: entity.component(MeshLoaderComponent) })
    }

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  /**
   * The parts of the character shown by {@link loadCharacter}: the attachment name, its mesh and material, the loader
   */
  public characterParts: Array<{ name: string; mesh: string; material: string; loader: MeshLoaderComponent }> = []

  /**
   * Shows one particle effect of a library at the origin, with the sky, the grid and the orbit camera (a preview of
   * the browser). One shot effects restart every few seconds.
   *
   * @param library - path of the library, `libs/particles/<name>.xml`
   * @param effect - the full name of the effect, e.g. `ENV_Bonfires.Medium_01`
   */
  public loadParticleEffect(library: string, effect: string) {
    this.loadCancel()
    this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    wasd.orbitMode = true
    wasd.radiusMax = 1000
    wasd.targetRadius = PARTICLE_PREVIEW_RADIUS
    wasd.orbitCenter.x = 0
    wasd.orbitCenter.y = 0
    wasd.orbitCenter.z = PARTICLE_PREVIEW_HEIGHT
    // negative is down
    wasd.setRotation(0, -15 * DEGREE_TO_RAD)

    this.entity = this.game.createEntity({
      name: `Particle effect: ${effect}`,
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    const data: ViewerParticleComponent = {
      type: ParticleComponentName,
      library,
      emitter: effect,
      color: [1, 1, 1, 1],
      alphaScale: 1,
      countScale: 1,
      sizeScale: 1,
      particleSize: [1, 1, 1],
      speedScale: 1,
      timeScale: 1,
      strength: -1,
      viewDistanceMultiplier: 1,
    }
    this.game.createEntity({
      name: effect,
      parent: this.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
      // always active around the origin, one shots loop
      components: [new ParticleComponent(data, { oneShots: true, loop: PARTICLE_PREVIEW_LOOP, range: 1000 })],
    })
    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  /**
   * The particle effect shown by {@link loadParticleEffect}, null otherwise
   */
  public particlePreview(): ParticleComponent | null {
    for (const child of this.entity?.getTransform().children ?? []) {
      const particles = child.entity.component(ParticleComponent, GetComponent.Optional)
      if (particles) {
        return particles
      }
    }
    return null
  }

  public async loadMaterial(assetUrl: string) {
    this.loadCancel()

    if (!assetUrl) {
      return
    }

    const loadSignal = this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    wasd.orbitMode = true
    wasd.radiusMax = 1000
    wasd.targetRadius = 6
    wasd.orbitCenter.x = 0
    wasd.orbitCenter.y = 0
    wasd.orbitCenter.z = SHADER_BALL_SIZE.height / 2
    wasd.setRotation(0, -15 * DEGREE_TO_RAD)

    // the materials are loaded into the scope of the entity, it must exist first
    const entity = this.game.createEntity({
      name: `Material: ${assetUrl}`,
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    this.entity = entity
    this.skyEntity = this.game.createEntity(createSkySphere(entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(entity, this.renderer.device))

    const device = this.renderer.device
    const [allMaterials, [baseMaterial], [coreMaterial]] = await Promise.all([
      this.loadMaterialFile(assetUrl, loadSignal),
      this.loadMaterialFile(SHADER_BALL_BASE_MATERIAL, loadSignal),
      this.loadMaterialFile(SHADER_BALL_CORE_MATERIAL, loadSignal),
    ])
    const ball = await loadShaderBallGeometries(device)
    loadSignal.throwIfAborted()
    // NoDraw sub materials (collision) are not drawn, there is nothing to show
    const materials = allMaterials.filter((it) => !it.noRender)

    // one shader ball per sub material, rows of up to SHADER_BALL_COLUMNS along +X, further rows behind (+Y)
    const columns = Math.min(SHADER_BALL_COLUMNS, Math.max(1, materials.length))
    const rows = Math.ceil(materials.length / columns)
    const spacing = SHADER_BALL_SIZE.width + SHADER_BALL_GAP
    materials.forEach((material, i) => {
      const x = ((i % columns) - (columns - 1) / 2) * spacing
      const y = Math.floor(i / columns) * spacing
      this.game.createEntity({
        name: `Shader ball ${i}: ${material.name}`,
        parent: entity,
        transform: new TransformComponent({ keepWorld: true, world: mat4CreateTranslation(vec3(x, y, 0)) }),
        components: [
          new BoundsComponent(),
          new ModelComponent({
            model: new Model(device, {
              meshes: [
                new Mesh(device, {
                  materials: [baseMaterial, material, coreMaterial],
                  partImports: [
                    { geometry: ball.base, materialIndex: 0 },
                    { geometry: ball.shell, materialIndex: 1 },
                    { geometry: ball.core, materialIndex: 2 },
                  ],
                }),
              ],
            }),
          }),
        ],
      })
    })

    this.materialNames = materials.map((it) => it.name)
  }

  /**
   * The sub materials shown by {@link loadMaterial}, in the order of the shader balls
   */
  public materialNames: string[] = []

  /**
   * Points the orbit camera at the shader ball of a sub material, null frames all of them
   */
  public frameMaterial(index: number | null) {
    if (index == null) {
      this.frameModel()
      return
    }
    const ball = this.entity
      ?.getTransform()
      .children.find((it) => it.entity.name?.startsWith(`Shader ball ${index}:`))?.entity
    const bounds = ball?.component(BoundsComponent, GetComponent.Optional)?.world?.sphere
    if (!bounds || !this.camera) {
      return
    }
    const wasd = this.camera.entity.component(WASDComponent)
    vec3Copy(bounds.center, wasd.orbitCenter)
    wasd.targetRadius = bounds.radius * 2.5
  }

  /**
   * Loads all sub materials of a material file
   */
  private async loadMaterialFile(url: string, signal: AbortSignal): Promise<Material[]> {
    const content = this.content
    const scope = content.scopeOf(this.entity)
    const asset = await content.loadAsset(url)
    signal.throwIfAborted()
    const result: Material[] = []
    for (let i = 0; i < asset.count(AssetType.Material); i++) {
      const options = await asset.load<MaterialOptions>(AssetType.Material, i, {
        content: content.loader,
        baseUrl: content.nwbtFileUrl,
      })
      signal.throwIfAborted()
      result.push(scope.adopt(content.loader.createMaterial(options)))
    }
    return result
  }

  /**
   * Cancels a running load and unloads the level, model or preview, e.g. while the engine shows a preview of the
   * browser
   */
  public clear() {
    this.loadCancel()
  }

  private loadCtrl: AbortController
  private beginLoad() {
    this.loadCancel()
    this.loadCtrl = new AbortController()
    return this.loadCtrl.signal
  }

  private loadCancel() {
    if (this.loadCtrl) {
      this.loadCtrl.abort()
      this.loadCtrl = null
    }
    this.unload()
  }

  private unload() {
    this.levelInfo = null
    this.materialNames = []
    this.characterParts = []
    // the next content (a model preview of the browser) starts with the neutral time of day, not the level's preset
    // and POI layers
    this.timeOfDay.reset()
    // loaded into the scope of the level, it is finalized with it
    this.timeOfDay.moonTexture = null
    this.content.slices.remove(this)
    this.skyEntity = null
    this.gizmoEntity = null
    this.cloudsEntity = null
    this.cloudsKey = null
    if (this.entity) {
      this.entity.destroy()
      this.entity.setParent(null)
      this.entity = null
    }
  }

  /**
   * Points the orbit camera at the loaded content again (a model, the models of a slice), e.g. after the user moved
   * away. The bounds of every model below the content count, the sky, the clouds and the grid do not.
   *
   * @returns whether a model was found to frame
   */
  public frameModel(): boolean {
    if (!this.entity || !this.camera) {
      return false
    }
    const skip = new Set([this.skyEntity, this.cloudsEntity, this.gizmoEntity])
    const sphere = BoundingSphere.create()
    const visit = (entity: GameEntity) => {
      if (skip.has(entity)) {
        return
      }
      // static models of slices are drawn by the culling worker (CulledModelComponent), the others directly
      if (
        entity.component(ModelComponent, GetComponent.Optional) ||
        entity.component(CulledModelComponent, GetComponent.Optional)
      ) {
        const bounds = entity.component(BoundsComponent, GetComponent.Optional)
        if (bounds?.world?.sphere) {
          sphere.mergeSphere(bounds.world.sphere)
        }
      }
      for (const child of entity.getTransform().children) {
        visit(child.entity)
      }
    }
    visit(this.entity)
    if (sphere.isEmpty) {
      return false
    }
    const wasd = this.camera.entity.component(WASDComponent)
    vec3Copy(sphere.center, wasd.orbitCenter)
    wasd.targetRadius = sphere.radius * 2
    return true
  }

  /**
   * Shows a slice of the browser at the origin: the slice and the slices it spawns (`slices`, keyed like the level's
   * slice data), with the sky, the grid and the orbit camera. Frame it with {@link frameModel} once models loaded.
   *
   * @param root - key of the slice in `slices`, `guid_subId`
   */
  public loadSlicePreview(root: string, slices: Record<string, ViewerSlice>, name: string) {
    this.loadCancel()
    this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    wasd.orbitMode = true
    wasd.radiusMax = 2000
    wasd.targetRadius = 20
    wasd.orbitCenter.x = 0
    wasd.orbitCenter.y = 0
    wasd.orbitCenter.z = 2
    wasd.setRotation(0, -20 * DEGREE_TO_RAD)

    this.entity = this.game.createEntity({
      name: `Slice: ${name}`,
      parent: this.game.scene.entity,
      transform: new TransformComponent({ keepWorld: true, world: mat4Identity() }),
    })
    // removed again on unload
    this.content.slices.add(this, slices)
    const separator = root.lastIndexOf('_')
    const spawner = this.game.createEntity({
      name,
      parent: this.entity,
      transform: new TransformComponent({
        keepWorld: true,
        world: mat4Identity(),
        // initialized and activated by the SliceSystem
        lifeCycle: LifeCycleFlags.PropagateOnly,
      }),
      components: [
        new BoundsComponent(),
        new SliceSpawnerComponent({
          slice: { guid: root.slice(0, separator), subId: Number(root.slice(separator + 1)), hint: name },
        }),
      ],
    })
    this.game.world.getSystem(SliceSystem).addPreviewSpawner(spawner.component(SliceSpawnerComponent))
    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  /**
   * The models of the loaded model (one per instance), to inspect or force their levels of detail
   */
  public modelComponents(): ModelComponent[] {
    const result: ModelComponent[] = []
    for (const child of this.entity?.getTransform().children ?? []) {
      const model = child.entity.component(ModelComponent, GetComponent.Optional)
      if (model) {
        result.push(model)
      }
    }
    return result
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
      vec3Copy(sphere.center, wasd.orbitCenter)
      wasd.targetRadius = sphere.radius * 2
    }
  }
}

function createGizmoGrid(parent: GameEntity, device: Device): CreateEntityOptions {
  const grid = planeGeometry(device, {
    lines: true,
    width: 128,
    depth: 128,
    widthSegments: 128,
    depthSegments: 128,
    vertexTransform: mat4CreateRotationX(-Math.PI / 2),
  })
  const material = new ShapeMaterial(device, { properties: {} })
  material.Color = Color.DimGray.toVec4()
  material.Transform = mat4Identity()

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

/**
 * The material preview: game reference materials for the parts of the shader ball that do not show the material.
 * The balls stand on the grid in rows of up to SHADER_BALL_COLUMNS, SHADER_BALL_GAP meters apart.
 */
const SHADER_BALL_BASE_MATERIAL = 'materials/references/base_colors/grey_01.mtl'
const SHADER_BALL_CORE_MATERIAL = 'materials/references/base_colors/black_01.mtl'
const SHADER_BALL_COLUMNS = 5
const SHADER_BALL_GAP = 0.8

/**
 * The particle preview of the browser: orbit distance and height of the camera target, and the restart interval of
 * one shot effects in seconds
 */
const PARTICLE_PREVIEW_RADIUS = 8
const PARTICLE_PREVIEW_HEIGHT = 1.5
const PARTICLE_PREVIEW_LOOP = 3

/**
 * Cloud layer of the sky.
 *
 * The game spawns slices/system/skyboxsystem (not referenced by the level data). Its TimeOfDayPOIComponent
 * (radius 12000 around 7000,7000, libs/timeofday/default.xml) references slices/sky/newworld01_skybox_a, a mesh component
 * with this dome and no material override (uses the cgf material objects/sky/testclouds_sky_a_mtl.mtl, DistanceClouds).
 * Other POIs (zones, events, dungeons) reference other skybox slices, the SkyLightSystem picks the active one.
 *
 * Without a mesh (model / material preview, missing slice data) the default dome is used.
 */
const CLOUDS_DOME_CGF = 'objects/sky/skydome_a.cgf'
function createCloudsDome(parent: GameEntity, mesh?: ViewerMeshComponent | null): CreateEntityOptions {
  mesh ||= {
    type: 'Mesh',
    mesh: CLOUDS_DOME_CGF,
    alwaysRender: true,
  }
  return {
    name: `Clouds`,
    parent: parent,
    components: [new MeshLoaderComponent(mesh)],
  }
}

/**
 * The mesh of a skybox slice (slices/sky/*), each slice holds a single dome mesh
 */
function findSkyMesh(slice: ViewerSlice | undefined): ViewerMeshComponent | null {
  for (const entity of slice?.entities ?? []) {
    const mesh = entity.components.find(isViewerMeshComponent)
    if (mesh) {
      return mesh
    }
  }
  return null
}

/**
 * TimeOfDay POIs of the skybox system slice, the default TimeOfDay and skybox of the open world
 */
function createSkyboxSystem(parent: GameEntity, slice: ViewerSlice | null | undefined): CreateEntityOptions[] {
  const result: CreateEntityOptions[] = []
  for (const item of slice?.entities ?? []) {
    const tod = item.components.find(isTimeOfDayComponent)
    if (!tod) {
      continue
    }
    result.push({
      name: item.name,
      parent,
      transform: new TransformComponent({
        keepWorld: true,
        world: mat4CreateFromArray(item.transform),
      }),
      components: [new TimeOfDayComponent(tod)],
    })
  }
  return result
}

/**
 * Environment probes of mission0.entities_xml. Every level has its global probe here, slices do not reference it.
 * The other mission entities (e.g. lights) are not spawned.
 */
/**
 * The slice of the mission's own entities, see {@link createMissionSlice}. Not a catalog asset: the key only joins
 * the spawner and the slice in the slice library.
 */
const MISSION_SLICE_REF = { guid: 'mission', subId: 0 }
const MISSION_SLICE_KEY = assetReferenceKey(MISSION_SLICE_REF)

/**
 * The entities of the level's mission (`mission0.entities_xml`) as a slice in world space, without the global
 * probes ({@link createMissionProbes} creates them). Most levels only have the probes there, a main menu has its whole
 * set (Nighthaven: 6,464 meshes). Null when nothing is left. The spawn radius is unbounded: the entities stream by
 * their own view distances.
 */
function createMissionSlice(entities: ViewerEntity[] | null | undefined): ViewerSlice | null {
  const rest = (entities ?? []).filter(
    (item) => !item.components.some((it) => isViewerLightComponent(it) && it.light.type === 'Probe'),
  )
  if (!rest.length) {
    return null
  }
  return { entities: rest, spawnRadius: MISSION_SPAWN_RADIUS, isStaticSlice: true }
}

/**
 * Covers every level (the open world is about 14 km wide). Finite: the radius is also the spawner's bounding sphere.
 */
const MISSION_SPAWN_RADIUS = 100_000

function createMissionProbes(parent: GameEntity, entities: ViewerEntity[] | null | undefined): CreateEntityOptions[] {
  const result: CreateEntityOptions[] = []
  for (const item of entities ?? []) {
    if (item.inactive) {
      continue
    }
    for (const component of item.components) {
      if (!isViewerLightComponent(component) || component.light.type !== 'Probe') {
        continue
      }
      const debug = new DebugShapeComponent()
      result.push({
        name: item.name,
        parent,
        transform: new TransformComponent({
          keepWorld: true,
          world: mat4CreateFromArray(item.transform),
        }),
        components: [debug, ...createEnvProbeComponents(component.light, debug)],
      })
    }
  }
  return result
}

function createSkySphere(parent: GameEntity, device: Device): CreateEntityOptions {
  const geometry = sphereGeometry(device, {
    radius: 128,
    vertexTransform: mat4CreateRotationX(-Math.PI / 2),
  })
  const material = new SkyMaterial(device, { properties: {} })
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

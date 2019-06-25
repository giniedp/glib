import { ContentManager, IManagerOptions } from '@gglib/content'
import { Device, DeviceOptions, LightType } from '@gglib/graphics'

import {
  CameraComponent,
  CameraProperties,
  FpsComponent,
  GameLoopComponent,
  GameLoopOptions,
  KeyboardComponent,
  LightComponent,
  LightProperties,
  ModelComponent,
  MouseComponent,
  RendererComponent,
  TimeComponent,
  TransformComponent,
  WASDComponent,
} from './components'
import { Entity } from './Entity'

/**
 * Options for the {@link createGame} function
 *
 * @public
 */
export interface CreateGameOptions {
  /**
   * The graphics device or options for the device constructor
   */
  device: Device | DeviceOptions

  /**
   * An instance of the content manager or options for the constructor
   */
  content?: IManagerOptions | ContentManager

  /**
   * An instance of the game loop component or options for the constructor
   */
  gameLoop?: GameLoopOptions | GameLoopComponent

  /**
   * If `true` the game loop will start immediately
   */
  autorun?: boolean
}

/**
 * Creates a root entity and adds common components
 *
 * @public
 * @remarks
 * The following components are added
 * - Device
 * - ContentManager
 * - GameLoopComponent
 * - FpsComponent
 */
export function createGame(options: CreateGameOptions, ...tap: Array<(entity: Entity) => void> ) {
  const device = options.device instanceof Device
    ? options.device
    : new Device(options.device)

  const content = options.content instanceof ContentManager
    ? options.content
    : new ContentManager(device, options.content)

  const gameLoop = options.gameLoop instanceof GameLoopComponent
    ? options.gameLoop
    : new GameLoopComponent(options.gameLoop)

  return new Entity().tap((entity) => {
    entity
      .addService(Device, device)
      .addService(ContentManager, content)
      .addComponent(gameLoop)
      .addComponent(new TimeComponent())
      .addComponent(new FpsComponent())
    tap.forEach((t) => t(entity))
    if (options.autorun !== false) {
      entity.getService(GameLoopComponent).run()
    }
  })
}

/**
 * Adds a basic renderer component
 *
 * @public
 * @remarks
 * This is sufficient to simple scenes but has no culling mechanism
 *
 * @param entity - The entity
 */
export function addBasicRenderer(entity: Entity) {
  if (entity.getService(RendererComponent, null) == null) {
    entity.addComponent(new RendererComponent())
  }
}

/**
 * Adds a {@link CameraComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 * @param options - Constructor options for the {@link CameraComponent}
 */
export function addCamera(entity: Entity, options?: CameraProperties) {
  addTransform(entity)
  if (entity.getService(CameraComponent, null) == null) {
    entity.addComponent(new CameraComponent(options))
  }
}

/**
 * Adds a {@link LightComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 * @param options - Constructor options for the {@link LightComponent}
 */
export function addPointLight(entity: Entity, options: LightProperties = {}) {
  if (!entity.services.has(LightComponent)) {
    options.type = LightType.Point
    entity.addComponent(new LightComponent(options))
  }
}

/**
 * Adds a {@link LightComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 * @param options - Constructor options for the {@link LightComponent}
 */
export function addSpotLight(entity: Entity, options: LightProperties = {}) {
  if (!entity.services.has(LightComponent)) {
    options.type = LightType.Spot
    entity.addComponent(new LightComponent(options))
  }
}

/**
 * Adds a {@link LightComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 * @param options - Constructor options for the {@link LightComponent}
 */
export function addDirectionalLight(entity: Entity, options: LightProperties = {}) {
  if (!entity.services.has(LightComponent)) {
    options.type = LightType.Directional
    entity.addComponent(new LightComponent(options))
  }
}

/**
 * Adds a {@link LightComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 * @param options - Constructor options for the {@link LightComponent}
 */
export function addLight(entity: Entity, options: LightProperties = {}) {
  if (!entity.services.has(LightComponent)) {
    entity.addComponent(new LightComponent(options))
  }
}

/**
 * Adds a {@link ModelComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 */
export function addModel(entity: Entity) {
  addTransform(entity)
  if (!entity.getService(ModelComponent, null)) {
    entity.addComponent(new ModelComponent())
  }
}

/**
 * Adds a {@link TransformComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 */
export function addTransform(entity: Entity) {
  if (entity.getService(TransformComponent, null) == null) {
    entity.addComponent(new TransformComponent())
  }
}

/**
 * Adds a {@link MouseComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 */
export function addMouse(entity: Entity) {
  if (entity.getService(MouseComponent, null) == null) {
    entity.addComponent(new MouseComponent())
  }
}

/**
 * Adds a {@link KeyboardComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 */
export function addKeyboard(entity: Entity) {
  if (entity.getService(KeyboardComponent, null) == null) {
    entity.addComponent(new KeyboardComponent())
  }
}

/**
 * Adds a {@link WASDComponent} to the entity if it does not exist
 *
 * @public
 * @param entity - The entity
 */
export function addWASD(entity: Entity) {
  addMouse(entity)
  addKeyboard(entity)
  addTransform(entity)
  if (entity.getService(WASDComponent, null) == null) {
    entity.addComponent(new WASDComponent())
  }
}

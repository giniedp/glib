import { ContentManager, IManagerOptions } from '@gglib/content'
import { AbstractType, GameComponent, GameEntity, GameProvider, GameSystem, Type } from '@gglib/ecs'
import { Device, DeviceGLOptions, DeviceGPUOptions, createDevice } from '@gglib/graphics'
import { Renderer } from '@gglib/render'
import { GameLoop, GameLoopOptions, TimeSystem } from '../systems'
import { TransformComponent, TransformComponentOptions } from './TransformComponent'

/**
 * Options for the {@link createGame} function
 *
 * @public
 */
export interface CreateGameOptions {
  /**
   * The graphics device or options for the device constructor
   */
  device: Device | DeviceGLOptions | DeviceGPUOptions

  /**
   * A content manager instance or options for its constructor
   */
  content?: IManagerOptions | ContentManager

  /**
   * A game loop instance or options for its constructor
   */
  loop?: GameLoopOptions

  /**
   * Additional game systems to be added to the game
   */
  provides?: Array<Type<any> | AbstractType<any>>

  /**
   * Additional game systems to be added to the game
   */
  systems?: Array<GameSystem>
}

/**
 * Creates minimal set of game systems ready to run
 *
 * @public
 * @param options - The options for the common game systems
 * @param tap - Use this to add additional systems to the game before it is initialized
 * @remarks
 * This adds following systems
 * - DeviceProvider
 * - ContentManager
 * - GameLoop
 * - TimeSystem
 */
export function createGame(options: CreateGameOptions) {
  // prettier-ignore
  const device =
    options.device instanceof Device
      ? options.device
      : createDevice(options.device)

  // prettier-ignore
  const content =
    options.content instanceof ContentManager
      ? options.content
      : new ContentManager(device, options.content)

  // prettier-ignore
  const gameLoop =
    options.loop instanceof GameLoop
      ? options.loop
      : new GameLoop(options.loop)

  const game = new GameProvider(null)
  game.provide(device, Device)
  game.provide(content)
  game.provide(new Renderer(device))
  game.addSystem(gameLoop)
  game.addSystem(new TimeSystem())

  for (const system of options.provides || []) {
    game.provide(system)
  }
  for (const system of options.systems || []) {
    game.addSystem(system)
  }

  game.initialize()
  return game
}

export interface CreateEntityOptions {
  parent?: GameEntity<TransformComponent>
  id?: string | number
  name?: string
  transform?: TransformComponentOptions
  components?: GameComponent[]
}

export function createEntity(options: CreateEntityOptions) {
  const entity = new GameEntity<TransformComponent>()
  entity.id = options.id
  entity.name = options.name
  entity.transform = new TransformComponent(options.transform)
  entity.addComponent(entity.transform)
  if (options.parent) {
    options.parent.transform.addChild(entity.transform)
  }
  for (const component of options.components || []) {
    entity.addComponent(component)
  }
  return entity
}

import { ContentManager, IManagerOptions } from '@gglib/content'
import { Entity, decorateComponent } from '@gglib/ecs'
import { Device, DeviceGLOptions, DeviceGPUOptions, createDevice } from '@gglib/graphics'

import {
  FpsComponent,
  LoopComponent,
  LoopComponentOptions,
  TimeComponent,
} from './src'

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
   * An instance of the content manager or options for the constructor
   */
  content?: IManagerOptions | ContentManager

  /**
   * An instance of the game loop component or options for the constructor
   */
  gameLoop?: LoopComponentOptions | LoopComponent

  /**
   * If `true` the game loop will start automatically on next macro task (scheduled with `setTimeout`)
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
    : createDevice(options.device)

  const content = options.content instanceof ContentManager
    ? options.content
    : new ContentManager(device, options.content)

  const gameLoop = options.gameLoop instanceof LoopComponent
    ? options.gameLoop
    : new LoopComponent(options.gameLoop)

  return Entity.createRoot().tap((entity) => {
    entity
      .addComponent(decorateComponent(device, { as: Device }))
      .addComponent(decorateComponent(content, { as: ContentManager }))
      .addComponent(gameLoop)
      .install(TimeComponent)
      .install(FpsComponent)
    tap.forEach((t) => t(entity))
    if (options.autorun !== false) {
      entity.get(LoopComponent).run()
    }
  })
}

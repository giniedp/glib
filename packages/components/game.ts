import { ContentManager, IManagerOptions } from '@gglib/content'
import { Entity } from '@gglib/ecs'
import { Device, DeviceOptions } from '@gglib/graphics'

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
  device: Device | DeviceOptions

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
    : new Device(options.device)

  const content = options.content instanceof ContentManager
    ? options.content
    : new ContentManager(device, options.content)

  const gameLoop = options.gameLoop instanceof LoopComponent
    ? options.gameLoop
    : new LoopComponent(options.gameLoop)

  return Entity.createRoot().tap((entity) => {
    entity
      .addService(Device, device)
      .addService(ContentManager, content)
      .addComponent(gameLoop)
      .addComponent(new TimeComponent())
      .addComponent(new FpsComponent())
    tap.forEach((t) => t(entity))
    if (options.autorun !== false) {
      setTimeout(() => entity.getService(LoopComponent).run())
    }
  })
}

import type { AbstractType, GameType, Type } from './types'

export type GameSystemType<T extends GameSystem = GameSystem> = Type<T> | AbstractType<T> | GameType<T>

export interface GameSystem {
  initialize(container: GameProvider): void
  destroy(): void
}

export interface GetSystemOptions {
  /**
   * If true, only queries the system from this container.
   */
  self?: boolean
  /**
   * If true, skips to the parent container.
   */
  skipSelf?: boolean
  /**
   * If true, does not throw an error if the system is not found.
   */
  optional?: boolean
}

export class GameProvider {
  private parent: GameProvider
  private provides: Map<any, any> = new Map()
  private systems: Map<GameSystemType<any>, any> = new Map()
  private toInitialize: GameSystem[] = []
  private isInitialized = false

  public constructor(parent?: GameProvider) {
    this.parent = parent
  }

  /**
   * Gets a registered game system or a provided object of given type
   */
  public get<T>(type: Type<T> | AbstractType<T>, options?: GetSystemOptions): T {
    if (options?.skipSelf) {
      if (this.parent) {
        return this.parent.get(type, options)
      } else if (options?.optional) {
        return null
      }
      throw new Error(`${getTypeName(type)} not found`)
    }

    const result = (this.systems.get(type) || this.provides.get(type)) as T
    if (result) {
      return result
    }

    if (!options?.self && this.parent) {
      return this.parent.get(type, options)
    }
    if (options?.optional) {
      return null
    }
    throw new Error(`System ${getTypeName(type)} not found`)
  }

  /**
   * Provides an arbitrary object for the given type
   *
   * @remarks
   * This object is provided without any special treatment.
   * Initialization and destruction is not called.
   */
  public provide<T>(value: T, ...typeAndAliases: Array<Type<T> | AbstractType<T>>): this {
    if (typeAndAliases.length == 0) {
      typeAndAliases = [value.constructor as Type<T>]
    }

    for (const type of typeAndAliases) {
      if (type === Object.constructor) {
        throw new Error('Cannot provide plain object without a given type')
      }
      if (this.provides.has(type) || this.systems.has(type)) {
        throw new Error(`${getTypeName(type)} is already provided`)
      }
      this.provides.set(type, value)
    }
    return this
  }

  /**
   * Provides a game system of given type
   *
   * @remarks
   * The added system is initialized and destroyed automatically.
   * The initialization is delayed until the container is initialized.
   * If the container is already initialized, the system is initialized immediately.
   */
  public addSystem<T extends GameSystem>(system: T, type?: GameSystemType<T>): this {
    if (type === undefined) {
      type = system.constructor as GameSystemType<T>
    }
    if (type !== null) {
      if (type === Object.constructor) {
        throw new Error('Cannot use Object as system type')
      }
      if (this.systems.has(type)) {
        throw new Error(`System ${getTypeName(type)} already exists`)
      }
      this.systems.set(type, system)
    }
    if (!this.isInitialized) {
      this.toInitialize.push(system)
    } else {
      initializeSystem(system, this)
    }
    return this
  }

  /**
   * Initializes all systems in the container
   *
   * @remarks
   * Can only be called once.
   */
  public initialize(): this {
    if (this.isInitialized) {
      throw new Error('Container is already initialized')
    }
    while (this.toInitialize.length > 0) {
      const system = this.toInitialize.shift()
      initializeSystem(system, this)
    }
    this.isInitialized = true
    return this
  }

  /**
   * Destroys all systems in the container
   */
  public destroy() {
    for (const system of this.systems.values()) {
      destroySystem(system)
    }
    this.systems.clear()
    this.toInitialize.length = 0
    this.isInitialized = false
  }
}

function initializeSystem(system: GameSystem, host: GameProvider) {
  try {
    system.initialize(host)
  } catch (e) {
    console.error(`Error initializing system ${system.constructor.name}`, e)
  }
}

function destroySystem(system: GameSystem) {
  try {
    system.destroy()
  } catch (e) {
    console.error(`Error destroying system ${system.constructor.name}`, e)
  }
}

function removeFromArray<T>(array: T[], item: T) {
  const index = array.indexOf(item)
  if (index !== -1) {
    array.splice(index, 1)
  }
}

function getTypeName(type: any): string {
  if (typeof type === 'function') {
    return type.name
  } else if (typeof type === 'string') {
    return type
  } else {
    return String(type)
  }
}

import { Brand } from '@gglib/utils'
import type { NotGameEntity } from './GameEntity'
import type { GameWorld } from './GameWorld'
import type { AbstractType, GameTypeToken, Type } from './types'
import { idProvider } from './utils/idProvider'

export type GameSystemType<T> = Type<T> | AbstractType<T> | GameTypeToken<T>
export type GameSystemTypeId<T> = Brand<number, 'GameSystemTypeId'>
export type GameSystemId<T> = Brand<number, 'GameSystemId'>

const SystemIds = idProvider<GameSystemId<any>, Type<any> | AbstractType<any>>(Symbol('GameSystemId'))

export const GameSystemToken = Symbol('GameSystem')
export abstract class GameSystem {
  public get [GameSystemToken]() {
    return true
  }

  abstract initialize(world: GameWorld): void
  abstract destroy(): void
  update(time: number, dt: number): void {
    //
  }
  render(time: number, dt: number): void {
    //
  }
}

export function isGameSystem(value: any): value is GameSystem {
  if (value instanceof GameSystem) {
    return true
  }
  if ((value as GameSystem)[GameSystemToken]) {
    return true
  }
  return false
}

export interface RenderableSystem extends GameSystem {
  render(time: number, dt: number): void
}

export class GameSystemCollection {
  protected world: GameWorld
  protected byTypeId: Record<GameSystemTypeId<any>, GameSystem | unknown> = {}
  protected toInitialize: GameSystem[] = []
  protected isInitialized = false
  protected toUpdate: GameSystem[] = []
  protected toRender: GameSystem[] = []

  public [Symbol.iterator]() {
    return Object.values(this.byTypeId)[Symbol.iterator]()
  }

  public constructor(world: GameWorld) {
    this.world = world
  }

  public has<T>(type: Type<T> | AbstractType<T>): boolean {
    const typeId = SystemIds.get(type)
    return typeId in this.byTypeId
  }

  public get<T>(type: Type<T> | AbstractType<T>, options?: { optional: boolean }): T {
    const typeId = SystemIds.get(type)
    const result = this.byTypeId[typeId]
    if (result) {
      return result as T
    }
    if (options?.optional) {
      return null
    }
    throw new Error(`System ${getTypeName(type)} not found`)
  }

  public add<T>(value: NotGameEntity<T>, ...typeAndAliases: Array<Type<T> | AbstractType<T>>): void {
    if (typeAndAliases.length == 0) {
      typeAndAliases = [value.constructor as Type<T>]
    }

    for (const type of typeAndAliases) {
      if (type === Object.constructor) {
        throw new Error('Cannot provide plain object without a given type')
      }
      const typeId = SystemIds.getOrCreate(type)
      if (typeId in this.byTypeId) {
        throw new Error(`System ${getTypeName(type)} already exists`)
      }
      this.byTypeId[typeId] = value
    }

    if (isGameSystem(value)) {
      if (!this.isInitialized) {
        this.toInitialize.push(value)
      } else if (initializeSystem(value, this.world)) {
        this.toUpdate.push(value)
        this.toRender.push(value)
      }
    }
  }

  public initialize(): void {
    if (this.isInitialized) {
      throw new Error('Container is already initialized')
    }
    this.isInitialized = true
    while (this.toInitialize.length > 0) {
      const system = this.toInitialize.shift()
      if (initializeSystem(system, this.world)) {
        this.toUpdate.push(system)
        this.toRender.push(system)
      }
    }
  }

  public update(time: number, dt: number): void {
    for (const system of this.toUpdate) {
      try {
        system.update(time, dt)
      } catch (e) {
        console.error(`Error updating system ${system.constructor.name}`, e)
      }
    }
  }

  public render(time: number, dt: number): void {
    for (const system of this.toRender) {
      try {
        system.render(time, dt)
      } catch (e) {
        console.error(`Error rendering system ${system.constructor.name}`, e)
      }
    }
  }

  public destroy(): void {
    for (const typeId in this.byTypeId) {
      const system = this.byTypeId[typeId]
      if (isGameSystem(system)) {
        destroySystem(system)
      }
    }
    this.byTypeId = {}
    this.toInitialize = []
    this.isInitialized = false
  }
}

function destroySystem(system: GameSystem) {
  try {
    system.destroy()
  } catch (e) {
    console.error(`Error destroying system ${system.constructor.name}`, e)
  }
}

function initializeSystem(system: GameSystem, world: GameWorld): boolean {
  try {
    system.initialize(world)
    return true
  } catch (e) {
    console.error(`Error initializing system ${system.constructor.name}`, e)
    return false
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

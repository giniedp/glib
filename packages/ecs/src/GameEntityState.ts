import { brand, Brand } from '@gglib/utils'

export type GameEntityState = Brand<number, 'GameEntityState'>
export const GameEntityState = {
  Created: brand<GameEntityState>(0),
  Initializing: brand<GameEntityState>(1),
  Initialized: brand<GameEntityState>(2),
  Activating: brand<GameEntityState>(3),
  Activated: brand<GameEntityState>(4),
  Deactivating: brand<GameEntityState>(5),
  Destroying: brand<GameEntityState>(6),
  Destroyed: brand<GameEntityState>(7),
}

const stateNames: Record<GameEntityState, string> = {
  [GameEntityState.Created]: 'Created',
  [GameEntityState.Initializing]: 'Initializing',
  [GameEntityState.Initialized]: 'Initialized',
  [GameEntityState.Activating]: 'Activating',
  [GameEntityState.Activated]: 'Activated',
  [GameEntityState.Deactivating]: 'Deactivating',
  [GameEntityState.Destroying]: 'Destroying',
  [GameEntityState.Destroyed]: 'Destroyed',
}

export function describeEntityState(state: GameEntityState): string {
  const name = stateNames[state]
  return `${name} (${state})`
}

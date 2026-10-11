import { TransformComponent } from '@gglib/components'
import type { CreateEntityOptions, GameEntity } from '@gglib/ecs'
import { mat4CreateTranslation, vec3 } from '@gglib/math'
import { ParticleComponentName, type ViewerParticleComponent } from '../../api'
import { ParticleComponent } from './ParticleComponent'
import type { ParticleSystem } from './ParticleSystem'

/**
 * An effect of the particle showcase
 */
export interface ParticleShowcaseItem {
  library: string
  emitter: string
}

/**
 * Effects of the default particle showcase: the most common ambient effects and known problem cases
 */
export const PARTICLE_SHOWCASE_PRESET = [
  'Buildables.Global.Candle_Flame_01',
  'Bld_Global_Ambience.Candle01',
  'ENV_Damned.Flame.Candle_greyscale_01',
  'Buildables.Torch.Idle',
  'Bld_Global_Ambience.Fireplace01',
  'Bld_Global_Ambience.Fireplace02',
  'Bld_Global_Ambience.Forgefire01',
  'Bld_Global_Ambience.ChimneySmoke01',
  'Env_Amb_Ruin.Fire01',
  'ENV_Bonfires.Small_02',
  'ENV_Bonfires.Medium_01',
  'igc_ftue_ConfrontingCrewmember.SmallFire_StairRail',
  'Env_Amb_Moths.Latern_surround_01',
  'Env_Amb_Buildings.Dustfall01',
  'ENV_Waterfalls.RockClash_01',
  'Env_Island.Lore.Aura',
  'Bld_Global_Ambience.Teleporter_Aura',
]

export interface ParticleShowcaseOptions {
  /**
   * Distance between two effects in the grid
   */
  spacing?: number
  /**
   * Restart interval of one shot effects in seconds
   */
  loop?: number
  /**
   * Height of the grid
   */
  altitude?: number
}

/**
 * The library of an effect, by convention `libs/particles/<library name>.xml`
 */
export function particleLibraryOf(effect: string) {
  return `libs/particles/${effect.split('.')[0].toLowerCase()}.xml`
}

/**
 * Resolves the effects of a showcase specification
 *
 * @param spec - empty for the preset, a library path (`libs/particles/env_bonfires.xml`) for all its top level effects,
 * or a comma separated list of effect names (`ENV_Bonfires.Medium_01,Buildables.Torch.Idle`)
 * @param filter - optional case insensitive substring filter on the effect names
 */
export async function resolveParticleShowcase(
  system: ParticleSystem,
  spec: string | null,
  filter?: string | null,
): Promise<ParticleShowcaseItem[]> {
  let result: ParticleShowcaseItem[]
  if (spec && /\.xml$/i.test(spec)) {
    const lib = await system.loadLibrary(spec)
    result = (lib?.effects ?? [])
      .filter((it) => it.attrs || it.children.length)
      .map((it) => ({ library: spec, emitter: it.fullName }))
  } else {
    const names = spec ? spec.split(',').map((it) => it.trim()).filter((it) => !!it) : PARTICLE_SHOWCASE_PRESET
    result = names.map((emitter) => ({ library: particleLibraryOf(emitter), emitter }))
  }
  if (filter) {
    const f = filter.toLowerCase()
    result = result.filter((it) => it.emitter.toLowerCase().includes(f))
  }
  return result
}

/**
 * Size of the showcase grid: columns and rows
 */
export function particleShowcaseGrid(count: number) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)))
  return { columns, rows: Math.max(1, Math.ceil(count / columns)) }
}

/**
 * Entities of the showcase: one emitter per effect on a grid centered at the origin, rows along +Y
 */
export function createParticleShowcase(
  parent: GameEntity,
  items: ParticleShowcaseItem[],
  options?: ParticleShowcaseOptions,
): CreateEntityOptions[] {
  const spacing = options?.spacing ?? 6
  const { columns, rows } = particleShowcaseGrid(items.length)
  // all effects stay active within the grid
  const range = spacing * (columns + rows) * 2 + 100
  return items.map((item, i) => {
    const x = ((i % columns) - (columns - 1) / 2) * spacing
    const y = (Math.floor(i / columns) - (rows - 1) / 2) * spacing
    const data: ViewerParticleComponent = {
      type: ParticleComponentName,
      library: item.library,
      emitter: item.emitter,
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
    return {
      name: item.emitter,
      parent,
      transform: new TransformComponent({
        keepWorld: true,
        world: mat4CreateTranslation(vec3(x, y, options?.altitude ?? 0)),
      }),
      components: [new ParticleComponent(data, { oneShots: true, loop: options?.loop ?? 3, range })],
    }
  })
}

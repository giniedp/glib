import { MATERIAL_SHOWCASE_SETS } from './game/showcase/MaterialShowcase'

/**
 * A preview scene of the scenes dialog (particles, materials tabs), opened by its url parameters
 */
export interface SceneLoadOption {
  /**
   * Url parameters, e.g. `particles=&time=21`
   */
  value: string
  label: string
  description?: string
}

/**
 * Url parameters that select what the viewer shows, cleared when another level or scene is selected
 */
export const VIEWER_MODE_PARAMS = [
  'level',
  'particles',
  'materials',
  'filter',
  'spacing',
  'time',
  'model',
  'material',
  'image',
  'x',
  'y',
  'z',
  'w',
]

/**
 * Particle libraries with many ambient effects, for the particle showcase
 */
const PARTICLE_LIBRARIES = [
  'libs/particles/env_bonfires.xml',
  'libs/particles/bld_global_ambience.xml',
  'libs/particles/env_amb_ruin.xml',
  'libs/particles/env_amb_buildings.xml',
  'libs/particles/env_waterfalls.xml',
  'libs/particles/env_island.xml',
]

/**
 * Preview scenes that do not need a level, one list per tab of the scenes dialog
 */
export interface SceneOptions {
  particles: SceneLoadOption[]
  /**
   * Material showcase, planned (tmp/showcase/plan.md)
   */
  materials: SceneLoadOption[]
}

export function createSceneOptions(): SceneOptions {
  const params = (values: Record<string, string>) => new URLSearchParams(values).toString()
  return {
    particles: [
      {
        label: 'Preset',
        description: 'day',
        value: params({ particles: '' }),
      },
      {
        label: 'Preset',
        description: 'night',
        value: params({ particles: '', time: '21' }),
      },
      {
        label: 'Torches',
        description: 'buildables.xml, night',
        value: params({ particles: 'libs/particles/buildables.xml', filter: 'torch', time: '21' }),
      },
      ...PARTICLE_LIBRARIES.map((lib) => ({
        label: lib.replace(/^libs\/particles\//, ''),
        description: 'library, night',
        value: params({ particles: lib, time: '21' }),
      })),
    ],
    materials: Object.entries(MATERIAL_SHOWCASE_SETS).map(([name, set]) => ({
      label: set.label,
      description:
        set.time != null ? `${set.description}, ${set.time >= 20 || set.time < 6 ? 'night' : 'day'}` : set.description,
      value: params(set.time != null ? { materials: name, time: String(set.time) } : { materials: name }),
    })),
  }
}

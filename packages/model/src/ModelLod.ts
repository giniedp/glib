import type { Model } from './Model'

/**
 * How the switch distances of the levels grow, see {@link lodLevelStart}
 *
 * - `linear`: level `n` is shown from `n * distance` on
 * - `doubling`: level 1 from `distance` on, every further level from twice the distance of the previous one
 *   (`distance * 2^(n - 1)`), like the CryEngine face area LOD (CObjManager::GetObjectLOD)
 */
export type LodSpacing = 'linear' | 'doubling'

export interface ModelLodOptions {
  /**
   * Distance where level 1 begins, the further levels follow from {@link spacing}
   */
  distance: number
  /**
   * How the switch distances of the levels grow. Defaults to `linear`
   */
  spacing?: LodSpacing
  /**
   * Highest level that may exist. Lowered automatically when a level fails to load.
   */
  maxLevel: number
  /**
   * Loads the model of a level (1 or higher). Resolves `null` if the level does not exist.
   * The resolved model is owned by the base model.
   */
  load: (level: number) => Promise<Model | null>
  /**
   * Fraction of the neighbouring level's range by which the range of the current level is widened,
   * so that a camera on a level boundary does not switch every frame. Defaults to 0.1
   */
  hysteresis?: number
  /**
   * Maximum screen size per level, as a fraction of the screen height. Level `n` is only used while the model
   * appears smaller than `maxScreenSize[n]`, a negative value means no limit.
   * Keeps large models detailed, the distance based level is lowered to the coarsest level that is allowed.
   */
  maxScreenSize?: ArrayLike<number> | null
}

/**
 * Levels of detail of a model
 *
 * @remarks
 * Level 0 is the model itself, higher levels are coarser and loaded on demand.
 * Selection is distance based, the levels begin at {@link lodLevelStart}, see {@link select}.
 * While a wanted level is loading, the closest finer level that is loaded is shown, see {@link resolve}.
 */
export class ModelLod {
  /**
   * Distance where level 1 begins
   */
  public readonly distance: number

  /**
   * How the switch distances of the levels grow
   */
  public readonly spacing: LodSpacing

  /**
   * Highest level that may exist
   */
  public maxLevel: number

  /**
   * Fraction of the neighbouring level's range by which the range of the current level is widened
   */
  public hysteresis: number

  /**
   * Maximum screen size per level, see {@link ModelLodOptions.maxScreenSize}
   */
  public maxScreenSize: ArrayLike<number> | null

  /**
   * A level to show regardless of the distance, e.g. to inspect the levels in a preview. `null` selects by distance.
   * Clamped to {@link maxLevel}, so a missing level shows the coarsest one that exists.
   */
  public forcedLevel: number | null = null

  private readonly levels: Array<Model | null> = []
  private readonly requested: boolean[] = []
  private readonly load: (level: number) => Promise<Model | null>
  private readonly base: Model

  public constructor(base: Model, options: ModelLodOptions) {
    this.base = base
    this.distance = options.distance
    this.spacing = options.spacing ?? 'linear'
    this.maxLevel = options.maxLevel
    this.hysteresis = options.hysteresis ?? 0.1
    this.maxScreenSize = options.maxScreenSize ?? null
    this.load = options.load
    this.levels[0] = base
    this.requested[0] = true
  }

  /**
   * Gets the level that should be shown at the given distance
   *
   * @param distance - distance from the camera to the model
   * @param screenSize - size of the model on screen, as a fraction of the screen height
   * @param current - the level that was selected before
   */
  public select(distance: number, screenSize: number, current: number): number {
    if (this.forcedLevel != null) {
      return Math.max(0, Math.min(this.forcedLevel, this.maxLevel))
    }
    let level = selectLodLevel(this.spacing, this.distance, this.hysteresis, distance, current)
    level = Math.max(0, Math.min(level, this.maxLevel))
    while (level > 0 && !this.allowsScreenSize(level, screenSize)) {
      level--
    }
    return level
  }

  private allowsScreenSize(level: number, screenSize: number) {
    const max = this.maxScreenSize?.[level]
    return max == null || max < 0 || screenSize < max
  }

  /**
   * Gets the loaded level that is closest to the wanted level, without being coarser.
   * Starts loading the wanted level if it is not loaded yet.
   */
  public resolve(wanted: number): number {
    if (!this.levels[wanted]) {
      this.request(wanted)
    }
    for (let level = wanted; level > 0; level--) {
      if (this.levels[level]) {
        return level
      }
    }
    return 0
  }

  /**
   * Gets the model of a level, null if the level is not loaded
   */
  public getModel(level: number): Model | null {
    return this.levels[level] ?? null
  }

  private request(level: number) {
    if (this.requested[level]) {
      return
    }
    this.requested[level] = true
    this.load(level).then(
      (model) => {
        if (model && this.base.ownership.isFinalized) {
          // the base model is gone, nobody would release the level
          model.dispose()
        } else if (model) {
          this.levels[level] = this.base.ownership.adopt(model)
        } else {
          this.markMissing(level)
        }
      },
      () => {
        this.markMissing(level)
      },
    )
  }

  private markMissing(level: number) {
    this.maxLevel = Math.min(this.maxLevel, level - 1)
  }
}

/**
 * Distance where a level of detail begins
 *
 * @param spacing - how the distances grow, see {@link LodSpacing}
 * @param distance - distance where level 1 begins
 * @param level - the level, 0 begins at 0
 */
export function lodLevelStart(spacing: LodSpacing, distance: number, level: number): number {
  if (level <= 0) {
    return 0
  }
  if (spacing === 'doubling') {
    return distance * 2 ** (level - 1)
  }
  return distance * level
}

/**
 * Level of detail that begins at or before a distance, without an upper limit
 */
export function lodLevelAt(spacing: LodSpacing, distance: number, at: number): number {
  const position = at / distance
  if (spacing === 'doubling') {
    return position < 1 ? 0 : Math.floor(Math.log2(position)) + 1
  }
  return Math.floor(position)
}

/**
 * Selects the level of detail at a distance, staying on the current level while the distance is within its range
 * widened by the hysteresis: below by a fraction of the previous level's range, above by a fraction of its own range.
 *
 * @param spacing - how the distances grow, see {@link LodSpacing}
 * @param distance - distance where level 1 begins
 * @param hysteresis - fraction of the neighbouring ranges by which the current range is widened
 * @param at - distance from the camera to the model
 * @param current - the level that was selected before
 * @returns the level, not limited to the levels that exist
 */
export function selectLodLevel(
  spacing: LodSpacing,
  distance: number,
  hysteresis: number,
  at: number,
  current: number,
): number {
  if (current >= 0) {
    const start = lodLevelStart(spacing, distance, current)
    const end = lodLevelStart(spacing, distance, current + 1)
    const below = current > 0 ? (start - lodLevelStart(spacing, distance, current - 1)) * hysteresis : 0
    const above = (end - start) * hysteresis
    if (at >= start - below && at < end + above) {
      return current
    }
  }
  return lodLevelAt(spacing, distance, at)
}

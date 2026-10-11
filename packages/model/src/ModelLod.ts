import type { Model } from './Model'

export interface ModelLodOptions {
  /**
   * Distance between two levels: level `n` is shown from `n * distance` on
   */
  distance: number
  /**
   * Highest level that may exist. Lowered automatically when a level fails to load.
   */
  maxLevel: number
  /**
   * Loads the model of a level (1 or higher). Resolves `null` if the level does not exist.
   */
  load: (level: number) => Promise<Model | null>
  /**
   * Fraction of {@link distance} by which the range of the current level is widened,
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
 * Selection is distance based: level `n` is shown from `n * distance` on, see {@link select}.
 * While a wanted level is loading, the closest finer level that is loaded is shown, see {@link resolve}.
 */
export class ModelLod {
  /**
   * Distance between two levels: level `n` is shown from `n * distance` on
   */
  public readonly distance: number

  /**
   * Highest level that may exist
   */
  public maxLevel: number

  /**
   * Fraction of {@link distance} by which the range of the current level is widened
   */
  public hysteresis: number

  /**
   * Maximum screen size per level, see {@link ModelLodOptions.maxScreenSize}
   */
  public maxScreenSize: ArrayLike<number> | null

  private readonly levels: Array<Model | null> = []
  private readonly requested: boolean[] = []
  private readonly load: (level: number) => Promise<Model | null>

  public constructor(base: Model, options: ModelLodOptions) {
    this.distance = options.distance
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
    const position = distance / this.distance
    // stay on the current level while the distance is within its range, widened by the hysteresis
    const stay = position >= current - this.hysteresis && position < current + 1 + this.hysteresis
    let level = stay ? current : Math.floor(position)
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
        if (model) {
          this.levels[level] = model
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

import { clamp } from '@gglib/math'
import { AnimationPose, poseCopy, poseIdentity } from './AnimationPose'
import type { AnimationRig } from './AnimationRig'
import type { AnimationSource } from './AnimationSource'
import { normalizedSumBlender, type JointMask, type PoseBlender } from './PoseBlender'

/**
 * @public
 */
export interface AnimationMixerOptions {
  /**
   * Number of layers, default 16
   */
  layers?: number
  /**
   * The blend routine, default {@link normalizedSumBlender}
   */
  blender?: PoseBlender
}

/**
 * @public
 */
export interface AnimationMixerPlayOptions {
  /**
   * The layer to play on, default 0. Higher layers go on top of lower ones.
   */
  layer?: number
  /**
   * Seconds to fade in over the entries already playing on the layer, default 0 (a cut)
   */
  fade?: number
  /**
   * Playback speed, default 1
   */
  speed?: number
  /**
   * Playback weight, default 1
   */
  weight?: number
  /**
   * Restart at the end. Otherwise the entry holds its last pose and reports {@link AnimationEntry.done}.
   */
  loop?: boolean
  /**
   * Normalized start time, default 0
   */
  time?: number
  /**
   * The joints the entry animates, all when missing
   */
  mask?: JointMask
}

/**
 * A source playing on a layer of an {@link AnimationMixer}
 *
 * @public
 *
 * @remarks
 * Entries are pooled by the mixer: do not keep a reference after the entry left its layer.
 */
export class AnimationEntry {
  public source: AnimationSource | null = null
  public state: unknown = null
  public layer = 0
  /**
   * Normalized time, 0 to 1
   */
  public time = 0
  public speed = 1
  /**
   * Playback weight
   */
  public weight = 1
  public loop = false
  public mask: JointMask = null
  /**
   * Seconds to fade in
   */
  public fade = 0
  /**
   * Fade in progress, 0 to 1
   */
  public ramp = 1
  /**
   * The weight on its layer after the fades of the newer entries, set by {@link AnimationMixer.update}
   */
  public blendWeight = 0
  /**
   * Whether the entry is on a layer
   */
  public active = false

  /**
   * A non looping entry reached its end
   */
  public get done(): boolean {
    if (this.loop) {
      return false
    }
    if (this.speed < 0) {
      return this.time <= 0
    }
    return this.time >= 1
  }

  /**
   * The time in seconds of the source
   */
  public get seconds(): number {
    return this.time * (this.source?.duration ?? 0)
  }
}

interface MixerLayer {
  entries: AnimationEntry[]
  weight: number
  target: number
  /**
   * Weight change per second towards the target, 0 for an immediate change
   */
  rate: number
  /**
   * The layer fades out by {@link AnimationMixer.stop}, its entries leave at weight 0
   */
  stopping: boolean
}

/**
 * Plays animation sources on layers of entries with crossfades and blends them into a pose
 *
 * @public
 *
 * @remarks
 * Modeled on CryAnimation's CSkeletonAnim: each layer is a queue of entries, a new entry fades in over the older ones
 * of its layer (an older entry leaves when a newer one is fully in). Per frame call {@link update} and then
 * {@link evaluate}, both allocate nothing.
 *
 * The pose starts from the rig's default pose. Layers apply in order. Within a layer, consecutive entries of one kind
 * form a chain: override chains blend towards their entries by the layer weight, additive chains compose their
 * deltas. A layer weight set by {@link setLayerWeight} stays when new entries play; only {@link stop} removes
 * entries.
 *
 * @example
 * ```ts
 * const mixer = new AnimationMixer(rig)
 * mixer.play(clipSource(rig.bind(idle)), { loop: true })
 * // later: cross fade to walking in 0.25 seconds
 * mixer.play(clipSource(rig.bind(walk)), { loop: true, fade: 0.25 })
 * // each frame
 * mixer.update(dt)
 * mixer.evaluate(pose)
 * ```
 */
export class AnimationMixer {
  public readonly rig: AnimationRig
  public readonly blender: PoseBlender

  private readonly layers: MixerLayer[] = []
  private readonly pool: AnimationEntry[] = []
  private readonly sample: AnimationPose
  private readonly accumulation: AnimationPose

  public constructor(rig: AnimationRig, options?: AnimationMixerOptions) {
    this.rig = rig
    this.blender = options?.blender ?? normalizedSumBlender
    const scale = !!rig.defaultPose.scales
    this.sample = new AnimationPose(rig.count, { scale })
    this.accumulation = new AnimationPose(rig.count, { scale })
    for (let i = 0; i < (options?.layers ?? 16); i++) {
      this.layers.push({
        entries: [],
        weight: 1,
        target: 1,
        rate: 0,
        stopping: false,
      })
    }
  }

  /**
   * Number of layers
   */
  public get layerCount(): number {
    return this.layers.length
  }

  /**
   * The entries of a layer, oldest first
   */
  public entries(layer: number): ReadonlyArray<AnimationEntry> {
    return this.layers[layer]?.entries ?? []
  }

  /**
   * The current weight of a layer
   */
  public layerWeight(layer: number): number {
    return this.layers[layer]?.weight ?? 0
  }

  /**
   * Starts a source on a layer, it fades in over the entries playing there
   */
  public play(source: AnimationSource, options?: AnimationMixerPlayOptions): AnimationEntry {
    const index = options?.layer ?? 0
    const layer = this.layers[index]
    if (!layer) {
      throw new Error(`AnimationMixer: layer ${index} does not exist (${this.layers.length} layers)`)
    }
    const entry = this.pool.pop() ?? new AnimationEntry()
    entry.source = source
    entry.state = source.createState()
    entry.layer = index
    entry.time = clamp(options?.time ?? 0, 0, 1)
    entry.speed = options?.speed ?? 1
    entry.weight = options?.weight ?? 1
    entry.loop = !!options?.loop
    entry.mask = options?.mask ?? null
    entry.fade = Math.max(0, options?.fade ?? 0)
    entry.ramp = entry.fade > 0 ? 0 : 1
    entry.active = true
    if (!layer.entries.length) {
      // an empty layer comes in through the fade of its first entry, at the weight it was given
      layer.stopping = false
    } else if (layer.stopping) {
      // playing on a layer that fades out brings it back
      layer.stopping = false
      this.fadeLayer(layer, 1, entry.fade)
    }
    layer.entries.push(entry)
    this.updateBlendWeights(layer)
    return entry
  }

  /**
   * Fades a layer out and removes its entries once it is out
   *
   * @param fade - seconds, 0 removes the entries now
   */
  public stop(layer: number, fade = 0) {
    const item = this.layers[layer]
    if (!item) {
      return
    }
    if (fade <= 0) {
      this.clear(item)
      return
    }
    item.stopping = true
    this.fadeLayer(item, 0, fade)
  }

  /**
   * Stops all layers now
   */
  public stopAll() {
    for (const layer of this.layers) {
      this.clear(layer)
    }
  }

  /**
   * Fades the weight of a layer to a value
   *
   * @param fade - seconds, 0 sets the weight now
   */
  public setLayerWeight(layer: number, weight: number, fade = 0) {
    const item = this.layers[layer]
    if (!item) {
      return
    }
    item.stopping = false
    this.fadeLayer(item, weight, fade)
  }

  private fadeLayer(item: MixerLayer, weight: number, fade: number) {
    item.target = clamp(weight, 0, 1)
    if (fade <= 0) {
      item.weight = item.target
      item.rate = 0
    } else {
      item.rate = Math.abs(item.target - item.weight) / fade
    }
  }

  /**
   * Advances times and fades
   *
   * @param dt - elapsed seconds
   */
  public update(dt: number) {
    for (const layer of this.layers) {
      if (!layer.entries.length) {
        continue
      }
      if (layer.weight !== layer.target) {
        const change = layer.rate > 0 ? layer.rate * dt : Infinity
        if (layer.weight < layer.target) {
          layer.weight = Math.min(layer.target, layer.weight + change)
        } else {
          layer.weight = Math.max(layer.target, layer.weight - change)
        }
        if (layer.stopping && layer.weight <= 0) {
          this.clear(layer)
          continue
        }
      }
      for (const entry of layer.entries) {
        if (entry.ramp < 1) {
          entry.ramp = entry.fade > 0 ? Math.min(1, entry.ramp + dt / entry.fade) : 1
        }
        this.advance(entry, dt)
      }
      this.updateBlendWeights(layer)
      this.dropHidden(layer)
    }
  }

  /**
   * Blends all layers into a local pose
   */
  public evaluate(out: AnimationPose): AnimationPose {
    const rig = this.rig
    const blender = this.blender
    const sample = this.sample
    const accumulation = this.accumulation
    poseCopy(rig.defaultPose, out)
    for (let index = 0; index < this.layers.length; index++) {
      const layer = this.layers[index]
      const entries = layer.entries
      if (!entries.length || layer.weight <= 0) {
        continue
      }
      // consecutive entries of one kind (override or additive) form a chain, each chain is accumulated and put onto
      // the pose on its own, as the game splits a layer where the kind changes
      let chain = false
      let chainAdditive = false
      for (const entry of entries) {
        const weight = entry.blendWeight * entry.weight
        if (weight <= 0 || !entry.source) {
          continue
        }
        const additive = entry.source.additive
        if (chain && additive !== chainAdditive) {
          blender.end(accumulation)
          blender.layer(accumulation, layer.weight, chainAdditive, out)
          chain = false
        }
        if (!chain) {
          blender.begin(accumulation)
          chain = true
          chainAdditive = additive
        }
        if (additive) {
          poseIdentity(sample)
        } else {
          poseCopy(rig.defaultPose, sample)
        }
        entry.source.sample(entry.time, sample, entry.state, additive)
        // above layer 0 a source touches only the joints it animates
        const mask = entry.mask ?? (index > 0 ? (entry.source.mask ?? null) : null)
        blender.add(sample, weight, accumulation, mask)
      }
      if (chain) {
        blender.end(accumulation)
        blender.layer(accumulation, layer.weight, chainAdditive, out)
      }
    }
    return out
  }

  private advance(entry: AnimationEntry, dt: number) {
    const source = entry.source
    if (!source) {
      return
    }
    const seconds = dt * entry.speed
    let step = 0
    if (source.step) {
      step = source.step(entry.time, seconds, entry.state)
    } else if (source.duration > 0) {
      step = seconds / source.duration
    } else {
      step = seconds > 0 ? 1 : 0
    }
    let time = entry.time + step
    if (entry.loop) {
      time -= Math.floor(time)
    } else {
      time = clamp(time, 0, 1)
    }
    entry.time = time
  }

  /**
   * Newest first: each entry takes its ramp of what the newer entries left (Cry transition weights)
   */
  private updateBlendWeights(layer: MixerLayer) {
    let remaining = 1
    for (let i = layer.entries.length - 1; i >= 0; i--) {
      const entry = layer.entries[i]
      entry.blendWeight = entry.ramp * remaining
      remaining *= 1 - entry.ramp
    }
  }

  /**
   * Removes the entries below a fully faded in one, in place
   */
  private dropHidden(layer: MixerLayer) {
    const entries = layer.entries
    let first = 0
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].ramp >= 1) {
        first = i
        break
      }
    }
    if (first === 0) {
      return
    }
    for (let i = 0; i < first; i++) {
      this.release(entries[i])
    }
    for (let i = first; i < entries.length; i++) {
      entries[i - first] = entries[i]
    }
    entries.length -= first
  }

  private clear(layer: MixerLayer) {
    for (const entry of layer.entries) {
      this.release(entry)
    }
    layer.entries.length = 0
    if (layer.stopping) {
      // a stopped layer starts over at full weight, a weight the user set stays
      layer.target = 1
    }
    layer.weight = layer.target
    layer.rate = 0
    layer.stopping = false
  }

  private release(entry: AnimationEntry) {
    entry.active = false
    entry.source = null
    entry.state = null
    entry.mask = null
    this.pool.push(entry)
  }
}

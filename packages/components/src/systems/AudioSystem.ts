import { ContentLoader } from '@gglib/content'
import { GameEntity, GameQuery, GameSystem, GameWorld, SystemOrder } from '@gglib/ecs'
import { SpaceBasis, vec3, vec3$normalize, vec3ApplyMat4Rotation } from '@gglib/math'
import { AudioDevice, setPannerPosition } from '../audio/AudioDevice'
import { AudioListenerComponent } from '../components/AudioListenerComponent'
import { AudioSourceComponent, AudioSourceVoice } from '../components/AudioSourceComponent'
import { TransformComponent } from '../components/TransformComponent'

/**
 * Constructor options for {@link AudioSystem}
 *
 * @public
 */
export interface AudioSystemOptions {
  /**
   * The audio device to play with. By default the system creates one and destroys it with the system
   */
  device?: AudioDevice
  /**
   * The master volume of a device created by the system. Defaults to `1`
   */
  volume?: number
  /**
   * Whether a device created by the system resumes on the first user gesture. Defaults to `true`
   */
  resumeOnGesture?: boolean
}

/**
 * Plays the {@link AudioSourceComponent}s and moves the listener to the {@link AudioListenerComponent}
 *
 * @public
 * @remarks
 * The system is not added by the `EcsGame` by default, add it in `onCreate`. Audio files are loaded with
 * `content.load(AudioAssetType, url)` and decoded with the context of the system, see `AudioLoader`.
 *
 * Positions are written in the render step, after all systems have moved the entities. There is one audio context
 * and one listener, so sources play regardless of the scene of their entity.
 *
 * @example
 * ```ts
 * class Game extends EcsGame {
 *   protected override onCreate() {
 *     this.world.addSystem(new AudioSystem())
 *   }
 * }
 * ```
 */
export class AudioSystem extends GameSystem {
  public override order: number = SystemOrder.Effects

  /**
   * The audio device
   */
  public readonly audio: AudioDevice

  private ownsDevice: boolean
  private output: GainNode
  private basis: SpaceBasis = SpaceBasis.Y_UP_NEG_Z
  private listeners: GameQuery
  private sources: GameQuery
  private voices = new Set<AudioSourceComponent>()
  private warnedListeners = false

  public constructor(options?: AudioSystemOptions) {
    super()
    this.ownsDevice = !options?.device
    this.audio =
      options?.device ??
      new AudioDevice({
        volume: options?.volume,
        resumeOnGesture: options?.resumeOnGesture,
      })
    // the listener volume, sources connect here
    this.output = this.audio.context.createGain()
    this.output.connect(this.audio.master)
  }

  public override initialize(world: GameWorld): void {
    this.basis = world.getSystem(SpaceBasis, { optional: true }) ?? SpaceBasis.Y_UP_NEG_Z
    const content = world.getSystem(ContentLoader, { optional: true })
    if (content) {
      this.audio.bindContent(content)
    }
    this.listeners = world.query({ scope: 'active', required: [AudioListenerComponent, TransformComponent] })
    this.sources = world.query({ scope: 'active', required: [AudioSourceComponent, TransformComponent] })
  }

  public override destroy(): void {
    for (const source of this.voices) {
      this.releaseVoice(source)
    }
    this.voices.clear()
    this.output.disconnect()
    if (this.ownsDevice) {
      this.audio.destroy()
    }
  }

  public override render(): void {
    this.updateListener()

    // voices that ended, were stopped or whose entity left the world
    for (const source of this.voices) {
      const entity = source.entity
      if (source.voice?.ended || source.pending === 'stop' || entity.isDestroyed || !entity.isActive) {
        this.releaseVoice(source)
      }
    }

    for (const entity of this.sources) {
      this.updateSource(entity)
    }
  }

  private updateListener() {
    let listener: GameEntity | null = null
    for (const entity of this.listeners) {
      if (listener) {
        if (!this.warnedListeners) {
          this.warnedListeners = true
          console.warn('AudioSystem: multiple active AudioListenerComponents, using the first one')
        }
        break
      }
      listener = entity
    }
    if (!listener) {
      return
    }

    this.output.gain.value = listener.$(AudioListenerComponent).volume
    const m = listener.$(TransformComponent).world

    vec3ApplyMat4Rotation(this.basis.forward, m, forward)
    vec3$normalize(forward)

    vec3ApplyMat4Rotation(this.basis.up, m, up)
    vec3$normalize(up)

    const target = this.audio.context.listener
    if (target.positionX) {
      target.positionX.value = m[12]
      target.positionY.value = m[13]
      target.positionZ.value = m[14]
      target.forwardX.value = forward.x
      target.forwardY.value = forward.y
      target.forwardZ.value = forward.z
      target.upX.value = up.x
      target.upY.value = up.y
      target.upZ.value = up.z
    } else {
      target.setPosition(m[12], m[13], m[14])
      target.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z)
    }
  }

  private updateSource(entity: GameEntity) {
    const source = entity.$(AudioSourceComponent)
    if (source.pending === 'play') {
      source.pending = null
      this.startVoice(source)
    } else if (source.pending === 'stop') {
      source.pending = null
    }

    const voice = source.voice
    if (!voice) {
      return
    }
    voice.gain.gain.value = source.volume
    voice.source.playbackRate.value = source.playbackRate
    voice.source.loop = source.loop
    if (source.spatial !== !!voice.panner) {
      this.route(voice, source.spatial)
    }
    const panner = voice.panner
    if (panner) {
      panner.refDistance = source.refDistance
      panner.maxDistance = source.maxDistance
      panner.rolloffFactor = source.rolloffFactor
      panner.distanceModel = source.distanceModel
      const m = entity.$(TransformComponent).world
      setPannerPosition(panner, m[12], m[13], m[14])
    }
  }

  private startVoice(source: AudioSourceComponent) {
    this.releaseVoice(source)
    if (!source.clip) {
      return
    }
    const ctx = this.audio.context
    const node = ctx.createBufferSource()
    node.buffer = source.clip
    const voice: AudioSourceVoice = {
      source: node,
      gain: ctx.createGain(),
      panner: null,
      ended: false,
    }
    node.connect(voice.gain)
    this.route(voice, source.spatial)
    node.onended = () => {
      voice.ended = true
    }
    source.voice = voice
    this.voices.add(source)
    // params are synced right after this in updateSource, before the audio thread renders the first block
    node.loop = source.loop
    node.start()
  }

  /**
   * Connects the gain of the voice to the output, through a panner if spatial
   */
  private route(voice: AudioSourceVoice, spatial: boolean) {
    voice.gain.disconnect()
    voice.panner?.disconnect()
    voice.panner = null
    if (spatial) {
      voice.panner = this.audio.context.createPanner()
      voice.panner.panningModel = 'HRTF'
      voice.gain.connect(voice.panner)
      voice.panner.connect(this.output)
    } else {
      voice.gain.connect(this.output)
    }
  }

  private releaseVoice(source: AudioSourceComponent) {
    const voice = source.voice
    this.voices.delete(source)
    if (source.pending === 'stop') {
      source.pending = null
    }
    if (!voice) {
      return
    }
    source.voice = null
    voice.source.onended = null
    if (!voice.ended) {
      voice.source.stop()
    }
    voice.source.disconnect()
    voice.gain.disconnect()
    voice.panner?.disconnect()
  }
}

const forward = vec3()
const up = vec3()

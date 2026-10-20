import type { ContentLoader } from '@gglib/content'
import type { IVec3 } from '@gglib/math'
import { AudioLoader } from './AudioLoader'

/**
 * Constructor options for {@link AudioDevice}
 *
 * @public
 */
export interface AudioDeviceOptions {
  /**
   * An existing audio context to use. By default a new context is created and closed on {@link AudioDevice.destroy}
   */
  context?: AudioContext
  /**
   * The master volume. Defaults to `1`
   */
  volume?: number
  /**
   * Whether to resume the context on the first user gesture, see {@link AudioDevice.resumeOnGesture}.
   * Defaults to `true`
   */
  resumeOnGesture?: boolean
}

/**
 * Options for {@link AudioDevice.playOneShot}
 *
 * @public
 */
export interface PlayOneShotOptions {
  /**
   * The volume of the sound. Defaults to `1`
   */
  volume?: number
  /**
   * The playback rate, also changes the pitch. Defaults to `1`
   */
  playbackRate?: number
  /**
   * World position of the sound. Without a position the sound is not spatialized
   */
  position?: IVec3
}

const gestureEvents = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Owns an `AudioContext` and the master volume
 *
 * @public
 * @remarks
 * This is the audio part that does not depend on the ECS. The `AudioSystem` uses it to play the
 * `AudioSourceComponent`s, plain games can use it directly.
 *
 * Browsers start an audio context in the `suspended` state until the user interacts with the page.
 * By default the device resumes it on the first pointer, key or touch event.
 *
 * @example
 * ```ts
 * const audio = new AudioDevice()
 * const buffer = await content.load(AudioAssetType, '/audio/impact.ogg')
 * audio.playOneShot(buffer)
 * ```
 */
export class AudioDevice {
  /**
   * The audio context
   */
  public readonly context: AudioContext

  /**
   * The node that all sounds are connected to. It is connected to the destination of the context
   */
  public readonly master: GainNode

  /**
   * The master volume
   */
  public get volume(): number {
    return this.master.gain.value
  }
  public set volume(value: number) {
    this.master.gain.value = value
  }

  private ownsContext: boolean
  private gestureTarget: EventTarget | null = null

  public constructor(options?: AudioDeviceOptions) {
    this.ownsContext = !options?.context
    this.context = options?.context ?? new AudioContext()
    this.master = this.context.createGain()
    this.master.gain.value = options?.volume ?? 1
    this.master.connect(this.context.destination)
    AudioLoader.addContext(this.context)
    if (options?.resumeOnGesture !== false && typeof window !== 'undefined') {
      this.resumeOnGesture(window)
    }
  }

  /**
   * Resumes the context on the first user gesture on the given target
   *
   * @remarks
   * Does nothing if the context is already running.
   */
  public resumeOnGesture(target: EventTarget) {
    this.removeGestureListeners()
    if (this.context.state === 'running') {
      return
    }
    this.gestureTarget = target
    for (const event of gestureEvents) {
      target.addEventListener(event, this.onGesture, { capture: true })
    }
  }

  /**
   * Decodes the {@link AudioAssetType} assets of the given content loader with the context of this device
   *
   * @remarks
   * Only needed with multiple devices. Without a binding the {@link AudioLoader} decodes with the most recently
   * created device.
   */
  public bindContent(content: ContentLoader) {
    AudioLoader.bind(content, this.context)
  }

  /**
   * Plays a sound once. The nodes are released when it ends
   *
   * @returns the source node, e.g. to stop the sound early
   */
  public playOneShot(buffer: AudioBuffer, options?: PlayOneShotOptions): AudioBufferSourceNode {
    const ctx = this.context
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = options?.playbackRate ?? 1

    const gain = ctx.createGain()
    gain.gain.value = options?.volume ?? 1
    source.connect(gain)

    let panner: PannerNode | null = null
    if (options?.position) {
      panner = ctx.createPanner()
      panner.panningModel = 'HRTF'
      setPannerPosition(panner, options.position.x, options.position.y, options.position.z)
      gain.connect(panner)
      panner.connect(this.master)
    } else {
      gain.connect(this.master)
    }

    source.onended = () => {
      source.disconnect()
      gain.disconnect()
      panner?.disconnect()
    }
    source.start()
    return source
  }

  /**
   * Removes the gesture listeners and closes the context, if it was created by this device
   */
  public destroy() {
    this.removeGestureListeners()
    AudioLoader.removeContext(this.context)
    this.master.disconnect()
    if (this.ownsContext && this.context.state !== 'closed') {
      this.context.close()
    }
  }

  private onGesture = () => {
    this.removeGestureListeners()
    if (this.context.state === 'suspended') {
      this.context.resume()
    }
  }

  private removeGestureListeners() {
    if (!this.gestureTarget) {
      return
    }
    for (const event of gestureEvents) {
      this.gestureTarget.removeEventListener(event, this.onGesture, { capture: true })
    }
    this.gestureTarget = null
  }
}

/**
 * Sets the position of a panner node, falls back to `setPosition` where the params are not supported
 *
 * @internal
 */
export function setPannerPosition(panner: PannerNode, x: number, y: number, z: number) {
  if (panner.positionX) {
    panner.positionX.value = x
    panner.positionY.value = y
    panner.positionZ.value = z
  } else {
    panner.setPosition(x, y, z)
  }
}

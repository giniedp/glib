import { AssetContainer, AssetLoader, AssetType, ContentLoader, LoadContext } from '@gglib/content'

/**
 * Asset type of decoded audio files
 *
 * @public
 * @remarks
 * Loaded by the {@link AudioLoader}. An `AudioBuffer` is not a GPU resource, so it is not owned by resource scopes
 * and stays in the content cache.
 *
 * @example
 * ```ts
 * const buffer = await content.load(AudioAssetType, '/audio/impact.ogg')
 * ```
 */
export const AudioAssetType = 'audio' as AssetType<AudioBuffer, AudioBuffer>

/**
 * Wraps a single decoded audio buffer
 *
 * @public
 */
export class AudioBufferAssetContainer implements AssetContainer {
  private readonly buffer: AudioBuffer

  public constructor(buffer: AudioBuffer) {
    this.buffer = buffer
  }

  public count(asset: AssetType<any, any>): number {
    return asset === AudioAssetType ? 1 : 0
  }

  public async load<T>(asset: AssetType<T, any>, index: number, context: LoadContext): Promise<T>
  public async load(asset: AssetType<any, any>, index: number): Promise<any> {
    if (asset !== AudioAssetType) {
      throw new Error(`AssetType not supported by this container: ${asset}`)
    }
    if (index !== 0) {
      throw new Error(`Audio index ${index} out of bounds for container with 1 audio buffer`)
    }
    return this.buffer
  }
}

const boundContexts = new WeakMap<ContentLoader, BaseAudioContext>()
const liveContexts: BaseAudioContext[] = []

/**
 * Loads and decodes audio files
 *
 * @public
 * @remarks
 * Decoding resamples to the sample rate of the audio context, so audio is decoded with the context it is played
 * with. That is the context bound to the content loader with `AudioDevice.bindContent`, or else the context of
 * the most recently created `AudioDevice` that is not destroyed. The loader is registered globally, so audio
 * can be loaded before the `AudioSystem` is initialized.
 */
export class AudioLoader implements AssetLoader {
  public static extensions = ['.ogg', '.oga', '.mp3', '.wav', '.m4a', '.aac', '.flac', '.weba']
  public static mimeTypes = [
    'audio/ogg',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/mp4',
    'audio/aac',
    'audio/flac',
    'audio/webm',
  ]
  public static create = (content: ContentLoader) => new AudioLoader(AudioLoader.resolveContext(content))
  public static register(registry = ContentLoader.loaders) {
    registry.register(AudioLoader)
    ContentLoader.registerCreator(AudioAssetType, (_, buffer) => buffer)
  }

  /**
   * Decode audio of the given content loader with the given context
   */
  public static bind(content: ContentLoader, context: BaseAudioContext) {
    boundContexts.set(content, context)
  }

  /**
   * Adds a context that is used by content loaders without a bound context
   *
   * @internal
   */
  public static addContext(context: BaseAudioContext) {
    liveContexts.push(context)
  }

  /**
   * @internal
   */
  public static removeContext(context: BaseAudioContext) {
    const index = liveContexts.indexOf(context)
    if (index >= 0) {
      liveContexts.splice(index, 1)
    }
  }

  /**
   * Gets the context to decode the audio of the given content loader with
   */
  public static resolveContext(content: ContentLoader): BaseAudioContext {
    const context = boundContexts.get(content) ?? liveContexts[liveContexts.length - 1]
    if (!context || context.state === 'closed') {
      throw new Error('No audio context to decode with, create an AudioDevice or AudioSystem before loading audio')
    }
    return context
  }

  public constructor(private readonly context: BaseAudioContext) {}

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    context.signal?.throwIfAborted()
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
      signal: context.signal,
    })
    context.signal?.throwIfAborted()
    const buffer = await this.context.decodeAudioData(response.body)
    context.signal?.throwIfAborted()
    return new AudioBufferAssetContainer(buffer)
  }
}

AudioLoader.register()

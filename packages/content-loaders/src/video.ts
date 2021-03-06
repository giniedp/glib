import { loader, Loader } from '@gglib/content'
import { Texture } from '@gglib/graphics'

/**
 *
 * @public
 */
export const loadWebmToHTMLVideoElement: Loader<string, HTMLVideoElement> = loader({
  input: '.webm',
  output: HTMLVideoElement,
  handle: async (_, context): Promise<HTMLVideoElement> => loadVideo(context.source),
})

/**
 * @public
 */
export const loadMp4ToHTMLVideoElement: Loader<string, HTMLVideoElement> = loader({
  input: '.mp4',
  output: HTMLVideoElement,
  handle: async (_, context): Promise<HTMLVideoElement> => loadVideo(context.source),
})

function loadVideo(src: string): HTMLVideoElement {
  const video = document.createElement('video')
  video.crossOrigin = Texture.crossOrigin
  video.src = src
  return video
}

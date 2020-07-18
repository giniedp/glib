import { loader } from '../../utils'

/**
 * @public
 */
export const loadWebmToHTMLVideoElement = loader({
  input: '.webm',
  output: HTMLVideoElement,
  handle: async (_, context): Promise<HTMLVideoElement> => loadVideo(context.source),
})

/**
 * @public
 */
export const loadMp4ToHTMLVideoElement = loader({
  input: '.mp4',
  output: HTMLVideoElement,
  handle: async (_, context): Promise<HTMLVideoElement> => loadVideo(context.source),
})

function loadVideo(src: string): HTMLVideoElement {
  const video = document.createElement('video')
  video.src = src
  return video
}

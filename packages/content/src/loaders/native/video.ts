import { loader } from '../../utils'

export const webmToHTMLVideoElement = loader<null, HTMLVideoElement>({
  input: '.webm',
  output: HTMLVideoElement,
  handle: async (_, context) => loadVideo(context.source),
})

export const mp4ToHTMLVideoElement = loader<null, HTMLVideoElement>({
  input: '.mp4',
  output: HTMLVideoElement,
  handle: async (_, context) => loadVideo(context.source),
})

function loadVideo(src: string): HTMLVideoElement {
  const video = document.createElement('video')
  video.src = src
  return video
}

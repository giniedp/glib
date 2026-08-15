import { NwImageViewer } from './image-viewer'
import { NwViewer } from './viewer'

const element = document.querySelector<HTMLDivElement>('#app')
const canvas = document.createElement('canvas')
const uiElement = document.createElement('div')

element.append(canvas)
element.append(uiElement)

const params = new URLSearchParams(location.search)

if (params.has('image')) {
  await bootImageViewer(params.get('image'))
} else if (params.has('material')) {
  const viewer = await bootViewer()
  viewer.loadMaterial(params.get('material'))
} else if (params.has('model')) {
  const viewer = await bootViewer()
  viewer.loadModel(params.get('model'))
} else if (params.has('level')) {
  const viewer = await bootViewer()
  viewer.loadLevel(params.get('level'))
} else {
  bootViewer()
}

async function bootImageViewer(image: string) {
  const viewer = new NwImageViewer({
    element: uiElement,
    canvas,
  })
  await viewer.run()
  viewer.load(image)
}

async function bootViewer() {
  const viewer = new NwViewer({
    element: uiElement,
    canvas,
  })
  await viewer.run()
  return viewer
}

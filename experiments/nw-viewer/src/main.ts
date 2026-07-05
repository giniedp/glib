import { NwViewer } from './viewer'

const element = document.querySelector<HTMLDivElement>('#app')
const canvas = document.createElement('canvas')
const uiElement = document.createElement('div')

element.append(canvas)
element.append(uiElement)
const viewer = new NwViewer({
  element: uiElement,
  canvas,
})
await viewer.run()

const params = new URLSearchParams(location.search)
if (params.has('model')) {
  viewer.loadModel(params.get('model'))
} else if (params.has('level')) {
  viewer.loadLevel(params.get('level'))
} else if (params.has('image')) {
  viewer.loadImage(params.get('image'))
} else if (params.has('slice')) {
  viewer.loadSlice(params.get('slice'))
}

import { DEGREE_TO_RAD } from '@gglib/math'
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
} else if (params.has('materials')) {
  // material showcase: ?materials=illum (sets in game/showcase/MaterialShowcase.ts)
  const viewer = await bootViewer()
  viewer.loadMaterials(params.get('materials'), {
    time: params.has('time') ? Number(params.get('time')) : undefined,
  })
} else if (params.has('particles')) {
  // particle showcase: ?particles (preset), ?particles=libs/particles/x.xml&filter=fire, ?particles=Lib.Effect,Lib.Effect2
  const viewer = await bootViewer()
  viewer.loadParticles(params.get('particles'), params.get('filter'), {
    spacing: Number(params.get('spacing')) || undefined,
    time: params.has('time') ? Number(params.get('time')) : undefined,
  })
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
  if (import.meta.env.DEV) {
    // handle for measurement scripts attached over CDP
    ;(globalThis as any).nwViewer = viewer
  }
  return viewer
}

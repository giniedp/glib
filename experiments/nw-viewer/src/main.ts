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

// viewer.load({
//   url: null,
//   environment: {
//     showSkybox: true,
//     panoramaUrl: 'https://assets.babylonjs.com/textures/parking.hdr',
//   },
// })
// viewer.loadLevel('nw_ori_er_questliang')
// viewer.loadLevel('nw_ctf_003_long')
// viewer.loadLevel('nw_ctf_002_wide')
// viewer.loadLevel('newworld_vitaeeterna')
//viewer.loadLevel('climaxftue_02')
viewer.loadLevel('nw_opr_004_trench')
// viewer.loadLevel('ftue_v2')
// viewer.loadLevel('frontendv2')

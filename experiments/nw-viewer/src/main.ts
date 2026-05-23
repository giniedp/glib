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

// const level = 'nw_dungeon_everfall_00'
// const level = 'nw_ori_er_questliang'
// const level = 'nw_ctf_003_long'
// const level = 'nw_ctf_002_wide'
// const level = 'newworld_vitaeeterna'
// const level = 'nw_raid_cutlasskeys_00'
// const level = 'nw_raid_monarchbluff_00'
// const level = 'climaxftue_02'
const level = 'nw_opr_004_trench'
// const level = 'ftue_v2'
// const level = 'frontendv2'

viewer.loadLevel(level)
viewer.teleport(1024, 1024, 250)
// viewer.teleport(7250, 250, 7250)
// viewer.teleport(12640, 500, 6088)
// viewer.teleport(1024 + 2048 + 2048, 250, 1024) // PvP Island
// viewer.teleport(8900, 250, 4200) // Everfall
// viewer.teleport(11400, 250, 5300) // Weavers Fen
// viewer.teleport(12600, 400, 6000) // Mourningdale (south cliff)
// viewer.teleport(9288, 630, 9125) // soul warden war camp

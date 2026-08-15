import { ModelViewer } from '@gglib/viewer'
import { mountUi } from 'tweak-ui'

const baseUrl = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets/Models'
const githubUrl = 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/master/Models'
const indexFile = `${baseUrl}/model-index.json`
type GltfIndex = GltfIndexModel[]
type GltfIndexModel = {
  name: string
  screenshot: string
  variants: {
    [key: string]: string
  }
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const viewer = new ModelViewer({ canvas })
  await viewer.run()

  viewer.loadEnvironment('/textures/hdr/footprint_court.hdr')

  mountUi(tools, (ui) => {
    ui.group('IBL', () => {
      ui.scalar(viewer, 'iblIntensity', { label: 'Intensity', range: true, min: 0, max: 2, decimals: 2 })
      ui.scalar(viewer, 'iblBlur', { label: 'Blur', range: true, min: 0, max: 1, decimals: 2 })
    })
    ui.group('Bloom', () => {
      ui.scalar(viewer.bloomPass, 'threshold', { range: true, min: 0, max: 1, decimals: 2 })
      ui.scalar(viewer.bloomPass, 'knee', { range: true, min: 0, max: 1, decimals: 2 })
      ui.scalar(viewer.bloomPass, 'steps', { range: true, min: 1, max: 10, step: 1, decimals: 0 })
      ui.scalar(viewer.bloomPass, 'intensity', { range: true, min: 0, max: 1, decimals: 2 })
    })
    ui.group('Tonemap', () => {
      ui.scalar(viewer.tonemapPass, 'exposure', { range: true, min: 0, max: 10 })
    })
  })

  const modelKey = new URL(location.href).searchParams.get('model')
  const data = await fetch(indexFile).then((res) => res.json())
  for (const mdl of data!) {
    for (const [name, path] of Object.entries(mdl.variants)) {
      if (modelKey !== `${mdl.name}_${name}`) {
        continue
      }
      viewer
        .loadModel({
          url: `${baseUrl}/${mdl.name}/${name}/${path}`,
        })
        .then(console.log)
    }
  }

  return () => {
    viewer.destroy()
  }
}

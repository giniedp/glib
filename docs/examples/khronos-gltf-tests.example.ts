import { Color, Texture } from '@gglib/graphics'
import { ModelViewer } from '@gglib/viewer'

Texture.crossOrigin = 'anonymous'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const viewer = new ModelViewer({ canvas })
  await viewer.run()
  viewer.renderer.clearColor = Color.TransparentBlack

  loadSample(tools, (url) => {
    viewer.loadModel({
      url,
      environment: {
        panoramaUrl: '/textures/hdr/footprint_court.hdr',
      },
    })
  })

  return () => {
    viewer.destroy()
  }
}

const baseUrl = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Asset-Generator/Output/Positive'
const githubUrl = 'https://github.com/KhronosGroup/glTF-Asset-Generator/tree/master/Output/Positive'
const manifest = `${baseUrl}/Manifest.json`
type Manifest = ManifestFolder[]
type ManifestFolder = {
  folder: string
  id: number
  models: ManifestModel[]
}
type ManifestModel = {
  fileName: string
  loadable: boolean
  sampleImageName: string
  camera: {
    translation: [number, number, number]
  }
}

async function loadSample(tools: HTMLElement, loadModel: (url: string) => void) {
  const res: Manifest = await fetch(manifest).then((res) => res.json())
  const list = res.sort((a, b) => a.id - b.id)
  const modelKey = new URL(location.href).searchParams.get('model')
  for (const folder of list) {
    for (const [modelId, model] of folder.models.entries()) {
      if (!model.loadable) {
        continue
      }
      if (modelKey !== `${folder.id}-${modelId}`) {
        continue
      }
      const url = `${baseUrl}/${folder.folder}/${model.fileName}`
      loadModel(url)
      return
    }
  }
}

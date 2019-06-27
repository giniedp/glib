import { Noise } from '@gglib/nosie'
import * as TweakUi from 'tweak-ui'

const noises = [
  'cell', 'lattice', 'perlin', 'simplex', 'value',
]
const fractals = [
  'none', 'fractal', 'hybridMultifractal', 'multifractal', 'rigedMultifractal',
]

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const config = {
  width: 512,
  height: 512,

  noise: 'perlin',

  fractal: 'fractal',
  octaves: 8,
  frequency: 1,
  lacunarity: 2,
  persistence: 1,
  offset: 1,
  gain: 2,

  scale: 10,
  shiftX: 0,
  shiftY: 0,
}

function resize() {
  canvas.width = config.width
  canvas.height = config.height
  canvas.style.width = `${config.width}px`
  canvas.style.height = `${config.height}px`
}

function update() {
  const width = canvas.width
  const height = canvas.height

  let noise = Noise[config.noise]()
  if (config.fractal !== 'none') {
    noise = noise[config.fractal](config)
  }
  noise = noise
    .scale(config.scale / width, config.scale / width)
    .shift(config.shiftX, config.shiftY)

  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = []
  let min = Number.MAX_VALUE
  let max = Number.MIN_VALUE
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const value = noise.sampler(x, y)
      data[y * width + x] = value
      min = Math.min(value, min)
      max = Math.max(value, max)
    }
  }

  // normalize into range [0:255]
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const index = y * width + x
      const value = ((data[index] - min) / (max - min)) * 255
      imageData.data[index * 4 ] = value
      imageData.data[index * 4 + 1] = value
      imageData.data[index * 4 + 2] = value
      imageData.data[index * 4 + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
resize()
update()

TweakUi.build('#tweak-ui', (q) => {
  q.group('Canvas', {}, (b) => {
    b.number(config, 'width', { min: 1, max: 2048, step: 1, onChange: resize })
    b.number(config, 'height', { min: 1, max: 2048, step: 1, onChange: resize })
  })

  q.group('Noise', {}, (b) => {
    b.select(config, 'noise', {
      options: noises,
      onChange: () => update(),
    })

    b.select(config, 'fractal', {
      options: fractals,
      onChange: () => update(),
    })

    b.slider(config, 'octaves', { min: 1, max: 16, step: 1, get hidden() { return config.fractal === 'none' }, onChange: update })
    b.slider(config, 'frequency', { min: 0.25, max: 10, step: 0.5, get hidden() { return config.fractal === 'none' }, onChange: update })
    b.slider(config, 'lacunarity', { min: 0.25, max: 10, step: 0.5, get hidden() { return config.fractal === 'none' }, onChange: update })
    b.slider(config, 'persistence', { min: 0.25, max: 10, step: 0.5, get hidden() { return config.fractal === 'none' }, onChange: update })
    b.slider(config, 'offset', { min: 0.25, max: 10, step: 0.5, get hidden() { return config.fractal === 'none' }, onChange: update })
    b.slider(config, 'gain', { min: 0.25, max: 10, step: 0.5, get hidden() { return config.fractal === 'none' }, onChange: update })
  })

  q.group('Modify', {}, (b) => {
    b.slider(config, 'scale', { min: 1, get max() { return canvas.width }, step: 1, onChange: update })
    b.slider(config, 'shiftX', { min: 1, get max() { return canvas.width }, step: 1, onChange: update })
    b.slider(config, 'shiftY', { min: 1, get max() { return canvas.width }, step: 1, onChange: update })
  })
})

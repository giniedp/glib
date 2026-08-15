import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const client = new RaytracerClient(canvas)
  const rect = canvas.getBoundingClientRect()
  client.width = rect.width | 0
  client.height = (rect.width | 0) / 2
  client.update()

  mountUi(tools, (ui) => {
    ui.scalar(client, 'samples', { range: true, min: 1, max: 1000, step: 1, label: 'Num Samples' })
    ui.scalar(client, 'depth', { range: true, min: 0, max: 1000, step: 1, label: 'Max Depth' })
    ui.scalar(client, 'width', { range: true, min: 300, max: 1200, step: 1, label: 'Width' })
    ui.button('Render', {
      onclick: () => {
        client.height = client.width / 2
        client.update()
      },
    })
  })

  return () => {}
}

class RaytracerClient {
  public width = 300
  public height = 150
  public samples = 50
  public depth = 5
  public canvas: HTMLCanvasElement
  public context: CanvasRenderingContext2D
  private worker: Worker[]

  private queryCount = 0
  private buffer!: Float32Array
  private imageData!: ImageData
  private sampleCount = 0
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')!
    this.worker = []
    for (let i = 0; i < navigator.hardwareConcurrency; i++) {
      const worker = new Worker('./worker.ts', {
        type: 'module',
      })
      worker.onmessage = this.onmessage.bind(this)
      this.worker.push(worker)
    }
  }

  public update() {
    this.queryCount++

    const w = this.width
    const h = this.height

    this.canvas.width = w
    this.canvas.height = h
    if (!this.buffer || this.buffer.length < w * h * 3) {
      this.buffer = new Float32Array(w * h * 3)
    } else {
      this.buffer.fill(0)
    }
    if (!this.imageData || this.imageData.width !== w || this.imageData.height !== h) {
      this.imageData = this.context.getImageData(0, 0, w, h)
    }

    const samplesPerWorker = Math.ceil(this.samples / this.worker.length)
    this.sampleCount = 0
    this.worker.forEach((worker, i) => {
      worker.postMessage({
        id: this.queryCount,
        x1: 0,
        y1: 0,
        x2: w,
        y2: h,
        dx: 1 / w,
        dy: 1 / h,
        samples: samplesPerWorker,
        depth: this.depth,
      })
    })
  }

  public onmessage(e: any) {
    const data = e.data as Float32Array
    if (data[0] !== this.queryCount) {
      return
    }

    const w = this.width
    const x1 = data[1]
    const y1 = data[2]
    const x2 = data[3]
    const y2 = data[4]
    const s = ++this.sampleCount

    const imageData = this.imageData
    const img = data.subarray(6)

    let i = 0
    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        const index = y * w + x
        const index3 = index * 3
        const index4 = index * 4

        this.buffer[index3 + 0] += img[i++]
        this.buffer[index3 + 1] += img[i++]
        this.buffer[index3 + 2] += img[i++]
        imageData.data[index4 + 0] = Math.min(Math.sqrt(this.buffer[index3 + 0] / s) * 255, 255)
        imageData.data[index4 + 1] = Math.min(Math.sqrt(this.buffer[index3 + 1] / s) * 255, 255)
        imageData.data[index4 + 2] = Math.min(Math.sqrt(this.buffer[index3 + 2] / s) * 255, 255)
        imageData.data[index4 + 3] = 255
      }
    }
    this.context.putImageData(this.imageData, 0, 0, x1, y1, x2 - x1, y2 - y1)
  }
}

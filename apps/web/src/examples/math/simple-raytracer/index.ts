import * as TweakUi from 'tweak-ui'

class RaytracerClient {
  /**
   * The image width to sample
   */
  public width = 300
  /**
   * The image height to sample
   */
  public height = 150
  /**
   * Number of samples per pixel
   */
  public samples = 10
  /**
   * Trace depth of bouncing rays
   */
  public depth = 10
  /**
   * The canvas element where to render
   */
  public canvas: HTMLCanvasElement
  /**
   * The 2d context for rendering the final image
   */
  public context: CanvasRenderingContext2D
  /**
   * The raytracer script running in a worker
   */
  private worker: Worker[]

  /**
   * Total number of horizontal pixels respecting `devicePixelRatio`
   */
  public get totalWidth() {
    return this.width // * (devicePixelRatio || 1)
  }
  /**
   * Total number of vertical pixels respecting `devicePixelRatio`
   */
  public get totalHeight() {
    return this.height // * (devicePixelRatio || 1)
  }

  private queryCount = 0
  private buffer: Float32Array
  private imageData: ImageData
  private sampleCount = 0
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.worker = []
    for (let i = 0; i < navigator.hardwareConcurrency; i++) {
      const worker = new Worker('worker.js')
      worker.onmessage = this.onmessage.bind(this)
      this.worker.push(worker)
    }
  }

  public update() {
    this.queryCount++

    const w = this.totalWidth
    const h = this.totalHeight

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
        x1: 0, y1: 0,
        x2: w, y2: h,
        dx: 1 / w, dy: 1 / h,
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

    const w = this.totalWidth
    // const h = this.totalHeight
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
        imageData.data[index4 + 0] = Math.min(Math.sqrt((this.buffer[index3 + 0] / s)) * 255, 255)
        imageData.data[index4 + 1] = Math.min(Math.sqrt((this.buffer[index3 + 1] / s)) * 255, 255)
        imageData.data[index4 + 2] = Math.min(Math.sqrt((this.buffer[index3 + 2] / s)) * 255, 255)
        imageData.data[index4 + 3] = 255
      }
    }
    this.context.putImageData(this.imageData, 0, 0, x1, y1, x2 - x1, y2 - y1)
  }
}

const client = new RaytracerClient(document.querySelector('canvas'))
client.update()

TweakUi.build('#tweak-ui', (q: TweakUi.Builder) => {
  q.slider(client, 'samples', { min: 1, max: 1000, step: 1, label: 'Num Samples' })
  q.slider(client, 'depth', { min: 0, max: 1000, step: 1, label: 'Max Depth' })
  q.slider(client, 'width', { min: 300, max: 1200, step: 1, label: 'Width' })
  q.button('Render', {
    onClick: () => {
      client.height = client.width / 2
      client.update()
    },
  })
})

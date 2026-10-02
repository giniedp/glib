import { mountUi } from 'tweak-ui'
import { sceneNames } from './scene'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const client = new RaytracerClient(canvas)
  const rect = canvas.getBoundingClientRect()
  client.width = rect.width | 0
  client.height = (rect.width | 0) / 2
  client.update()

  mountUi(tools, (ui) => {
    ui.select(client, 'scene', {
      options: sceneNames,
      onchange: () => client.update(),
    })
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

  return () => client.dispose()
}

const TILE_SIZE = 64
/** Number of jobs each worker holds, so it never idles while the next job is posted */
const JOBS_IN_FLIGHT = 2
/** Size of the result header written by the worker: id, tile, x1, y1, x2, y2 */
const HEADER_SIZE = 6

interface Tile {
  x1: number
  y1: number
  x2: number
  y2: number
  /** number of sample passes accumulated so far */
  samples: number
}

class RaytracerClient {
  public width = 300
  public height = 150
  public samples = 50
  public depth = 5
  public scene = sceneNames[0]
  public canvas: HTMLCanvasElement
  public context: CanvasRenderingContext2D
  private worker: Worker[]

  private queryCount = 0
  private buffer!: Float32Array
  private imageData!: ImageData

  // Jobs are (tile, pass) pairs handed out pass by pass, so the image refines evenly.
  // Workers pull a new job whenever they return one, which balances the load:
  // cheap tiles and fast workers simply take more jobs.
  private tiles: Tile[] = []
  private nextJob = 0
  private totalJobs = 0
  private inFlight = new Map<Worker, number>()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')!
    this.worker = Array.from({ length: navigator.hardwareConcurrency || 4 }, () => {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
      worker.addEventListener('message', (e) => this.onmessage(worker, e))
      return worker
    })
  }

  public update() {
    this.queryCount++

    const w = this.width | 0
    const h = this.height | 0

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

    this.tiles.length = 0
    for (let y = 0; y < h; y += TILE_SIZE) {
      for (let x = 0; x < w; x += TILE_SIZE) {
        this.tiles.push({
          x1: x,
          y1: y,
          x2: Math.min(x + TILE_SIZE, w),
          y2: Math.min(y + TILE_SIZE, h),
          samples: 0,
        })
      }
    }
    this.nextJob = 0
    this.totalJobs = this.tiles.length * this.samples

    // workers still busy with an outdated query pick up new jobs once they report back
    for (const worker of this.worker) {
      this.dispatch(worker)
    }
  }

  public dispose() {
    this.queryCount++
    for (const worker of this.worker) {
      worker.terminate()
    }
    this.worker.length = 0
  }

  /**
   * Tops up the worker to JOBS_IN_FLIGHT pending jobs
   */
  private dispatch(worker: Worker) {
    let pending = this.inFlight.get(worker) || 0
    while (pending < JOBS_IN_FLIGHT && this.nextJob < this.totalJobs) {
      const index = this.nextJob++ % this.tiles.length
      const tile = this.tiles[index]
      worker.postMessage({
        id: this.queryCount,
        tile: index,
        x1: tile.x1,
        y1: tile.y1,
        x2: tile.x2,
        y2: tile.y2,
        dx: 1 / this.imageData.width,
        dy: 1 / this.imageData.height,
        depth: this.depth,
        scene: this.scene,
      })
      pending++
    }
    this.inFlight.set(worker, pending)
  }

  private onmessage(worker: Worker, e: MessageEvent<Float32Array>) {
    this.inFlight.set(worker, this.inFlight.get(worker)! - 1)
    this.dispatch(worker)

    const data = e.data
    if (data[0] !== this.queryCount) {
      return
    }

    const w = this.imageData.width
    const tile = this.tiles[data[1]]
    const x1 = tile.x1
    const y1 = tile.y1
    const x2 = tile.x2
    const y2 = tile.y2
    // tiles progress independently, average by the tile's own sample count
    const s = ++tile.samples

    const imageData = this.imageData
    const img = data.subarray(HEADER_SIZE)

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

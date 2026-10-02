import { Scene, scenes } from './scene'

interface Job {
  /** query id, results of outdated queries are discarded by the client */
  id: number
  /** index of the tile, echoed back to the client */
  tile: number
  x1: number
  y1: number
  x2: number
  y2: number
  dx: number
  dy: number
  depth: number
  /** name of the scene to render, see `scenes` */
  scene: string
}

/** Size of the result header: id, tile, x1, y1, x2, y2 */
const HEADER_SIZE = 6

// built on first use and kept for following jobs
const sceneCache = new Map<string, Scene>()
function getScene(name: string) {
  let scene = sceneCache.get(name)
  if (!scene) {
    scene = scenes[name]()
    sceneCache.set(name, scene)
  }
  return scene
}

// Renders a single sample pass of one tile per message.
// Scheduling and accumulation is done by the client.
self.onmessage = (e: MessageEvent<Job>) => {
  const job = e.data
  const w = job.x2 - job.x1
  const h = job.y2 - job.y1
  const result = new Float32Array(HEADER_SIZE + w * h * 3)
  result[0] = job.id
  result[1] = job.tile
  result[2] = job.x1
  result[3] = job.y1
  result[4] = job.x2
  result[5] = job.y2
  getScene(job.scene).render(job, result.subarray(HEADER_SIZE))
  // transfer instead of copy
  postMessage(result, { transfer: [result.buffer] })
}

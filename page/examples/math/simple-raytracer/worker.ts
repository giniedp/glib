declare function importScripts(script: string): void
declare function postMessage(data: any): void
declare const scene: any
// load the math library
importScripts('/assets/math.umd.js')
// load our raytracing scene
importScripts('scene.js')

interface Job {
  id: number,
  x1: number, y1: number,
  x2: number, y2: number,
  dx: number, dy: number,
  depth: number,
}

interface Query extends Job {
  samples: number
}

const jobQueue: Job[] = []
let jobBuffer: Float32Array

self.onmessage = (e: any) => {
  const data = e.data as Query
  jobQueue.length = 0
  for (let i = 0; i < data.samples; i++) {
    jobQueue.push({ ...data })
  }

  loop(data)
}

function loop(data: Query) {
  if (!jobQueue.length || jobQueue[0].id !== data.id) {
    return
  }

  const w = data.x2 - data.x1
  const h = data.y2 - data.y1
  const size = w * h * 3 + 6
  if (!jobBuffer || jobBuffer.length !== size) {
    jobBuffer = new Float32Array(size)
  }
  const image = jobBuffer.subarray(6)

  const job = jobQueue.shift()
  scene.render(job, image)
  jobBuffer[0] = job.id
  jobBuffer[1] = job.x1
  jobBuffer[2] = job.y1
  jobBuffer[3] = job.x2
  jobBuffer[4] = job.y2
  jobBuffer[5] = data.samples - jobQueue.length
  postMessage(jobBuffer)
  setTimeout(() => loop(data))
}

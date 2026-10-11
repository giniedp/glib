/// <reference lib="webworker" />
import { VgmstreamDecoder } from './decoder'
import { AudioEngine } from './engine'
import type { MainToWorker, WorkerToMain } from './protocol'

const scope = self as unknown as DedicatedWorkerGlobalScope

const engine = new AudioEngine({
  post: (message: WorkerToMain, transfer?: Transferable[]) => scope.postMessage(message, transfer ?? []),
  loadDecoder: () => VgmstreamDecoder.load(new URL('/vendor/vgmstream/', scope.location.origin).href),
})

scope.addEventListener('message', (event: MessageEvent<MainToWorker>) => {
  engine.handle(event.data)
})

import type { CullingToMain, MainToCulling } from './protocol'

export interface CullingEngineOptions {
  post: (message: CullingToMain, transfer?: Transferable[]) => void
}

export class CullingEngine {
  public post: CullingEngineOptions['post']

  public constructor(options: CullingEngineOptions) {
    this.post = options.post
  }

  public handle(message: MainToCulling) {
    //
  }
}

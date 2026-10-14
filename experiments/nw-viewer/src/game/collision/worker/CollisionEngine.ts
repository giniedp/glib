import type { MainToCollision, CollisionToMain } from './protocol'

export interface CollisionEngineOptions {
  post: (message: CollisionToMain, transfer?: Transferable[]) => void
}

export class CollisionEngine {
  public post: CollisionEngineOptions['post']

  public constructor(options: CollisionEngineOptions) {
    this.post = options.post
  }

  public handle(message: MainToCollision) {
    //
  }
}

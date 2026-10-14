import type { RnrAsset } from '../../../formats/rnr/types'

export type MainToCollision =
  | {
      type: 'init'
      /**
       * Buffer of the PlayerBlock, null if shared memory is not available
       */
      player: SharedArrayBuffer | null
      /**
       * Absolute url of the nwbt file endpoint, shape asset paths are resolved against it
       */
      filesUrl: string
    }
  | {
      type: 'heightmapAdd'
      /**
       * Region name
       */
      id: string
      originX: number
      originY: number
      size: number
      mountainHeight: number
      /**
       * Shared with the main thread (copied if shared memory is not available)
       */
      heightmap: Float16Array<ArrayBufferLike>
    }
  | {
      type: 'heightmapRemove'
      id: string
    }
  | {
      /**
       * Requests a parsed shape asset, e.g. for the debug view
       */
      type: 'shape'
      requestId: number
      path: string
    }

export type CollisionToMain =
  | { type: 'ready' }
  | {
      type: 'shape'
      requestId: number
      /**
       * Parsed asset (a copy of the worker's), unset on error
       */
      asset?: RnrAsset
      error?: string
    }

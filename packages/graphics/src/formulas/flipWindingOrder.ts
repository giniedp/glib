import { Log } from '@glib/core'
import { VertexLayout } from './../VertexLayout'

export function flipWindingOrder(layout: VertexLayout, indices: number[], vertices: number[]) {
  for (let i = 0; i < indices.length - 2; i += 3) {
    const tmp = indices[i + 1]
    indices[i + 1] = indices[i + 2]
    indices[i + 1] = tmp
  }
}

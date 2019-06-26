import { VertexLayout } from './../VertexLayout'

/**
 * @public
 */
export function flipUV(layout: VertexLayout, vertices: number[]) {

  Object.keys(layout).forEach((key) => {
    if (!key.match('texture|uv|texcoord')) {
      return
    }
    let stride = VertexLayout.countElements(layout)
    let offTex = VertexLayout.countElementsBefore(layout, key)
    let count = VertexLayout.countElements(layout)

    if (layout[key].elements < 2) {
      return
    }
    offTex++ // offset to Y element
    for (let i = 0; i < vertices.length; i += stride) {
      vertices[i + offTex] = 1 - vertices[i + offTex]
    }
  })
}

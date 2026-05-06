import { countElements, countElementsBefore, VertexLayout } from '../../VertexLayout'

/**
 * @public
 */
export function flipUV(layout: VertexLayout, vertices: number[]) {
  Object.keys(layout).forEach((key) => {
    if (!key.match('texture|uv|texcoord')) {
      return
    }
    let stride = countElements(layout)
    let offTex = countElementsBefore(layout, key)

    if (layout[key].elementCount < 2) {
      return
    }
    offTex++ // offset to Y element
    for (let i = 0; i < vertices.length; i += stride) {
      vertices[i + offTex] = 1 - vertices[i + offTex]
    }
  })
}

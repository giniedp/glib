import { ContentLoader } from '@gglib/content'
import { CommonMaterial, WebglDevice } from '@gglib/graphics'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Loader as MTLLoader } from '../mtl/loader'
import { Loader as OBJLoader } from './loader'

const MTL_DATA = `
# some comment
newmtl myMaterial
Ka 1 2 3
d 0.1
Ns 16
`
const OBJ_DATA = `
# cube.obj
#
mtllib https://example.com/materials.mtl
usemtl myMaterial
g cube

v  0.0  0.0  0.0
v  0.0  0.0  1.0
v  0.0  1.0  0.0
v  0.0  1.0  1.0
v  1.0  0.0  0.0
v  1.0  0.0  1.0
v  1.0  1.0  0.0
v  1.0  1.0  1.0

vn  0.0  0.0  1.0
vn  0.0  0.0 -1.0
vn  0.0  1.0  0.0
vn  0.0 -1.0  0.0
vn  1.0  0.0  0.0
vn -1.0  0.0  0.0

f  1//2  7//2  5//2
f  1//2  3//2  7//2
f  1//6  4//6  3//6
f  1//6  2//6  4//6
f  3//3  8//3  7//3
f  3//3  4//3  8//3
f  5//5  7//5  8//5
f  5//5  8//5  6//5
f  1//4  5//4  6//4
f  1//4  6//4  2//4
f  2//1  6//1  8//1
f  2//1  8//1  4//1
`

describe('OBJ', () => {
  let device: WebglDevice
  let content: ContentLoader

  beforeAll(async () => {
    device = new WebglDevice({})
    content = new ContentLoader(device)
    content.registerLoader(OBJLoader)
    content.registerLoader(MTLLoader)
    content.registerMaterial(CommonMaterial, () => true)

    content.http.cacheName = 'test-cache'
    const cache = await caches.open(content.http.cacheName)
    cache.put(new Request('https://example.com/materials.mtl'), new Response(MTL_DATA))
    cache.put(new Request('https://example.com/cube.obj'), new Response(OBJ_DATA))
  })

  describe('Loader', () => {
    it('loads asset', async () => {
      const result = await content.loadModel('https://example.com/cube.obj')
      expect(result).toBeDefined()
      expect(result.meshes.length).toBe(1)
      expect(result.meshes[0].parts.length).toBe(1)
      expect(result.meshes[0].materials.length).toBe(1)
      expect(result.meshes[0].geometries[0].vertexBuffer.buffers[0].elementCount).toBe(6 * 4) // 4 vertices for each side of the cube
    })
  })
})

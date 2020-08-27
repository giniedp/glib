import { Http } from '@gglib/utils'
import { STL } from './stl'

describe('content/formats/stl', () => {
  it('parses binary file', async () => {
    const res = await Http.request({
      url: '/assets/models/stl/cube.stl',
      xhr: Http.createXMLHttpRequest('arraybuffer'),
    })
    const result = STL.parse(res.response)
    expect(result.solids.length).toBe(1)
    expect(result.solids[0].facets.length).toBe(6 * 2)
  })

  it('parses ascii file', async () => {
    const res = await Http.request({
      url: '/assets/models/stl/cube.ascii.stl',
      xhr: Http.createXMLHttpRequest('arraybuffer'),
    })
    const result = STL.parse(res.response)
    expect(result.solids.length).toBe(1)
    expect(result.solids[0].facets.length).toBe(6 * 2)
  })
})

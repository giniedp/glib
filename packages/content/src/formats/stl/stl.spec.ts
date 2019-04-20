import { Http } from '@gglib/core'
import { STL } from './stl'

describe('content/formats/stl', () => {
  it('parses binary file', (done) => {
    Http.request({
      url: '/assets/stl/cube.stl',
      xhr: Http.createXMLHttpRequest('arraybuffer'),
    }).then((res) => {
      const result = STL.parse(res.response)
      expect(result.solids.length).toBe(1)
      expect(result.solids[0].facets.length).toBe(6 * 2)
    })
    .catch(fail)
    .then(done)
  })

  it('parses ascii file', (done) => {
    Http.request({
      url: '/assets/stl/cube.ascii.stl',
      xhr: Http.createXMLHttpRequest('arraybuffer'),
    }).then((res) => {
      const result = STL.parse(res.response)
      expect(result.solids.length).toBe(1)
      expect(result.solids[0].facets.length).toBe(6 * 2)
    })
    .catch(fail)
    .then(done)
  })
})

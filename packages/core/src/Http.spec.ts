import { Http } from '@gglib/core'

describe('@gglib/core/http', () => {
  describe('.request', () => {
    beforeEach(() => {
       spyOn(XMLHttpRequest.prototype, 'open').and.callThrough()
       spyOn(XMLHttpRequest.prototype, 'send')
       Http.request({
         url: 'http://www.example.com',
         headers: {
           'Content-type': 'application/x-www-form-urlencoded',
         },
         data: 'lorem=ipsum',
        })
    })
    it ('should call open', () => {
      expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith(
        'GET',
        'http://www.example.com',
        true,
        undefined,
        undefined,
      )
    })
    it ('should call open', () => {
      expect(XMLHttpRequest.prototype.send).toHaveBeenCalledWith('lorem=ipsum')
    })
  })
})

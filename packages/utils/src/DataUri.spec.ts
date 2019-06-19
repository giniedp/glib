import { DataUri } from '@gglib/utils'

describe('DataUri', () => {
  describe('parse data:text/plain,Hello World', () => {
    const uri = 'data:text/plain,Hello World'

    it ('is data Uri', () => {
      expect(DataUri.isDataUri(uri)).toBe(true)
    })

    it ('is text/plain', () => {
      expect(DataUri.parse(uri).contentType).toBe('text/plain')
    })

    it ('is not base64', () => {
      expect(DataUri.parse(uri).isBase64).toBe(false)
    })

    it ('data is Hello world', () => {
      expect(DataUri.parse(uri).data).toBe('Hello World')
    })
  })

  describe('parse data:text/plain;base64,SGVsbG8gV29ybGQ=', () => {
    const uri = 'data:text/plain;base64,SGVsbG8gV29ybGQ='

    it ('is data Uri', () => {
      expect(DataUri.isDataUri(uri)).toBe(true)
    })

    it ('is text/plain', () => {
      expect(DataUri.parse(uri).contentType).toBe('text/plain;base64')
    })

    it ('is base64', () => {
      expect(DataUri.parse(uri).isBase64).toBe(true)
    })

    it ('data is SGVsbG8gV29ybGQ=', () => {
      expect(DataUri.parse(uri).data).toBe('SGVsbG8gV29ybGQ=')
    })
  })
})

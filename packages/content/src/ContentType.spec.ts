import { ContentType } from './ContentType'

describe('ContentType', () => {
  describe('parse', () => {
    it('parses mime type', () => {
      const res = ContentType.parse('text/plain')
      expect(res.mimeType).toBe('text/plain')
      expect(res.mediaType).toBe('text')
      expect(res.subType).toBe('plain')
      expect(res.params).toBe('')
    })

    it('parses params', () => {
      const res = ContentType.parse('text/plain; charset=utf8')
      expect(res.mimeType).toBe('text/plain')
      expect(res.mediaType).toBe('text')
      expect(res.subType).toBe('plain')
      expect(res.params).toBe('; charset=utf8')
    })

    it('parses complex type', () => {
      const res = ContentType.parse('text/plain; charset=utf8; foo="+-,.;:"')
      expect(res.mimeType).toBe('text/plain')
      expect(res.mediaType).toBe('text')
      expect(res.subType).toBe('plain')
      expect(res.params).toBe('; charset=utf8; foo="+-,.;:"')
    })
  })
})

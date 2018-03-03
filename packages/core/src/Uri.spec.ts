import { Uri } from '@gglib/core'

describe('@gglib/core/Uri', () => {
  describe('.parse', () => {
    it('parses the uri', () => {
      const parsed = Uri.parse('http://www.example.com:80/foo/bar?lorem=ipsum#dolor')
      expect(parsed.source).toBe('http://www.example.com:80/foo/bar?lorem=ipsum#dolor')
      expect(parsed.protocol).toBe('http')
      expect(parsed.host).toBe('www.example.com')
      expect(parsed.port).toBe('80')
      expect(parsed.authority).toBe('www.example.com:80')
      expect(parsed.path).toBe('/foo/bar')
      expect(parsed.directory).toBe('/foo/')
      expect(parsed.file).toBe('bar')
    })
  })

  describe('.dir', () => {
    it ('returns the dir', () => {
      expect(Uri.dir('foo/bar/lorem')).toBe('foo/bar/')
    })
  })

  describe('.file', () => {
    it ('returns the name of the file', () => {
      expect(Uri.file('foo/bar/lorem.png')).toBe('lorem.png')
    })
  })

  describe('.ext', () => {
    it ('returns the extension name of the file', () => {
      expect(Uri.ext('foo/bar/lorem.png')).toBe('.png')
    })
  })

  describe('.merge', () => {
    it ('merges two paths', () => {
      expect(Uri.merge('foo/bar/baz', '../lorem/ipsum.png')).toBe('/foo/lorem/ipsum.png')
      expect(Uri.merge('foo/bar/baz/', '../lorem/ipsum.png')).toBe('/foo/bar/lorem/ipsum.png')
      expect(Uri.merge('http://example.com/foo/bar/baz/', '../lorem/ipsum.png')).toBe('http://example.com/foo/bar/lorem/ipsum.png')
    })

    it ('ignores first param if second is absolute', () => {
      expect(Uri.merge('foo/bar/baz/', '/lorem/ipsum.png')).toBe('/lorem/ipsum.png')
      expect(Uri.merge('foo/bar/baz/', 'http://example.com')).toBe('http://example.com')
    })
  })
})

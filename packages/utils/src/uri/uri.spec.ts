import { describe, expect, it } from 'vitest'
import { mergeUri } from './merge'
import { parseUri } from './parse'
import { dirname, extname, filename } from './path'

describe('@gglib/utils/Uri', () => {
  describe('.parse', () => {
    it('parses the uri', () => {
      const parsed = parseUri('http://www.example.com:80/foo/bar?lorem=ipsum#dolor')
      expect(parsed.href).toBe('http://www.example.com:80/foo/bar?lorem=ipsum#dolor')
      expect(parsed.protocol).toBe('http')
      expect(parsed.hostname).toBe('www.example.com')
      expect(parsed.port).toBe('80')
      expect(parsed.authority).toBe('www.example.com:80')
      expect(parsed.pathname).toBe('/foo/bar')
      expect(parsed.directory).toBe('/foo/')
      expect(parsed.filename).toBe('bar')
    })
  })

  describe('dirname', () => {
    it('returns the dir', () => {
      expect(dirname('foo/bar/lorem')).toBe('foo/bar')
    })
  })

  describe('filename', () => {
    it('returns the name of the file', () => {
      expect(filename('foo/bar/lorem.png')).toBe('lorem.png')
    })
  })

  describe('extname', () => {
    it('returns the extension name of the file', () => {
      expect(extname('foo/bar/lorem.png')).toBe('.png')
    })
  })

  describe('mergeUri', () => {
    it('merges relative path', () => {
      expect(mergeUri('foo/bar/baz', '../lorem/ipsum.png')).toBe('/foo/lorem/ipsum.png')
      expect(mergeUri('foo/bar/baz/', '../lorem/ipsum.png')).toBe('/foo/bar/lorem/ipsum.png')
      expect(mergeUri('http://example.com/foo/bar/baz/', '../lorem/ipsum.png')).toBe(
        'http://example.com/foo/bar/lorem/ipsum.png',
      )
    })

    it('merges with base path', () => {
      expect(mergeUri('foo/bar/baz', '../lorem/ipsum.png', 'http://example.com')).toBe(
        'http://example.com/foo/lorem/ipsum.png',
      )
      expect(mergeUri('foo/bar/baz/', '../lorem/ipsum.png', 'http://example.com')).toBe(
        'http://example.com/foo/bar/lorem/ipsum.png',
      )
      expect(mergeUri('http://example.com/foo/bar/baz/', '../lorem/ipsum.png', 'http://example.de')).toBe(
        'http://example.de/foo/bar/lorem/ipsum.png',
      )
    })

    it('ignores first param if second is absolute', () => {
      expect(mergeUri('foo/bar/baz/', '/lorem/ipsum.png')).toBe('/lorem/ipsum.png')
      expect(mergeUri('foo/bar/baz/', 'http://example.com')).toBe('http://example.com')
    })
  })
})

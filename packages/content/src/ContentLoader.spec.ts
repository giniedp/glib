import { describe, expect, it } from 'vitest'
import { defaultUriResolver } from './ContentLoader'

describe('@gglib/content/ContentLoader', () => {
  describe('defaultUriResolver', () => {
    it('resolves against the base href', () => {
      expect(
        defaultUriResolver('lorem/ipsum.png', {
          baseUri: 'http://example.com/foo/',
        }),
      ).toBe('http://example.com/foo/lorem/ipsum.png')

      expect(
        defaultUriResolver('../lorem/ipsum.png', {
          baseUri: 'http://example.com/foo/',
        }),
      ).toBe('http://example.com/lorem/ipsum.png')

      expect(
        defaultUriResolver('lorem/ipsum.png', {
          baseUri: '/files/',
        }),
      ).toBe('/files/lorem/ipsum.png')
    })

    it('resolves against the directory of the base href', () => {
      expect(
        defaultUriResolver('lorem/ipsum.png', {
          baseUri: 'http://example.com/foo/bar',
        }),
      ).toBe('http://example.com/foo/lorem/ipsum.png')
    })

    it('resolves root-absolute uris against the origin of the base href', () => {
      expect(
        defaultUriResolver('/lorem/ipsum.png', {
          baseUri: 'http://example.com/foo/',
        }),
      ).toBe('http://example.com/lorem/ipsum.png')
    })

    it('keeps protocol uris', () => {
      expect(
        defaultUriResolver('http://example.de/ipsum.png', {
          baseUri: 'http://example.com/foo/',
        }),
      ).toBe('http://example.de/ipsum.png')
    })

    it('resolves against the parent without base href', () => {
      expect(
        defaultUriResolver('lorem/ipsum.png', {
          parentUri: 'http://example.com/files/models/model.gltf',
        }),
      ).toBe('http://example.com/files/models/lorem/ipsum.png')

      expect(
        defaultUriResolver('../lorem/ipsum.png', {
          parentUri: 'http://example.com/files/models/model.gltf',
        }),
      ).toBe('http://example.com/files/lorem/ipsum.png')
    })

    it('prefers an absolute base href over the parent', () => {
      expect(
        defaultUriResolver('lorem/ipsum.png', {
          parentUri: 'http://example.com/files/models/model.gltf',
          baseUri: 'http://example.com/files/',
        }),
      ).toBe('http://example.com/files/lorem/ipsum.png')

      expect(
        defaultUriResolver('lorem/ipsum.png', {
          parentUri: 'http://example.com/files/models/model.gltf',
          baseUri: '/assets/',
        }),
      ).toBe('http://example.com/assets/lorem/ipsum.png')
    })

    it('resolves a relative base href against the parent', () => {
      expect(
        defaultUriResolver('ipsum.png', {
          parentUri: 'http://example.com/files/models/model.gltf',
          baseUri: 'textures/',
        }),
      ).toBe('http://example.com/files/models/textures/ipsum.png')

      expect(
        defaultUriResolver('ipsum.png', {
          parentUri: 'http://example.com/files/models/model.gltf',
          baseUri: '../textures/',
        }),
      ).toBe('http://example.com/files/textures/ipsum.png')
    })

    it('resolves to root without base href and parent', () => {
      expect(defaultUriResolver('lorem/ipsum.png', {})).toBe('/lorem/ipsum.png')
    })

    it('is idempotent', () => {
      for (const baseUri of ['http://example.com/files/', '/files/']) {
        const url = defaultUriResolver('lorem/ipsum.png', { baseUri })
        expect(defaultUriResolver(url, { baseUri })).toBe(url)
      }
    })

    it('keeps query and fragment', () => {
      expect(
        defaultUriResolver('lorem/ipsum.dds?merge=true&size=512#mip', {
          baseUri: 'http://example.com/files/',
        }),
      ).toBe('http://example.com/files/lorem/ipsum.dds?merge=true&size=512#mip')
    })
  })
})

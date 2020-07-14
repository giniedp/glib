import { COLLADA } from '../core/collada'
import { DocumentCache, mapChild, mapChildren, textContent } from '../core/utils'

export interface Format {
  channels: 'RGB' | 'RGBA' | 'RGBE' | 'L' | 'LD' | 'D'
  range: 'SNORM' | 'UNORM' | 'SINT' | 'UINT' | 'FLOAT'
  precision: 'DEFAULT' | 'LOW' | 'MID' | 'HIGH' | 'MAX'
  space: string
  exact: string
}

function readFormat(el: Element): Format {
  const hint = el.querySelector('hint')
  return {
    channels: !hint ? null : hint.getAttribute('channels') as any,
    range: !hint ? null : hint.getAttribute('range') as any,
    precision: !hint ? null : hint.getAttribute('range') as any,
    space: !hint ? null : hint.getAttribute('space'),
    exact: mapChild(el, 'exact', (e) => e.textContent),
  }
}

export interface InitFrom {
  mipsGenerate: boolean,
  arrayIndex: number,
  mipIndex: number,
  depth: number,
  face: 'POSITIVE_X' | 'NEGATIVE_X' | 'POSITIVE_Y' | 'NEGATIVE_Y' | 'POSITIVE_Z' | 'NEGATIVE_Z',
  ref: string,
  hexData: any,
  hexFormat: string,
}

function readInitFrom(el: Element): InitFrom {
  const ref = mapChild(el, 'ref', textContent)
  const hexData = mapChild(el, 'hex', textContent)
  const hexFormat = mapChild(el, 'hex', (e) => e.getAttribute('format'))
  return {
    mipsGenerate: el.getAttribute('mips_generate') !== 'false',
    arrayIndex: Number(el.getAttribute('array_index')) | 0,
    mipIndex: Number(el.getAttribute('mip_index')) | 0,
    depth: Number(el.getAttribute('depth')) | 0,
    face: el.getAttribute('face') as any,
    ref: !ref && !hexData ? el.textContent : ref,
    hexData: hexData,
    hexFormat: hexFormat,
  }
}

export class Image {
  private cache = new DocumentCache()

  /**
   * A text string containing the unique identifier of this element.
   */
  public get id(): string {
    return this.el.getAttribute('id')
  }

  /**
   * A text string value containing the scoped identifier of this element.
   */
  public get sid(): string {
    return this.el.getAttribute('sid')
  }

  /**
   * The text string name of this element.
   */
  public get name(): string {
    return this.el.getAttribute('name')
  }

  public get initFrom() {
    return this.cache.get('init_from', () => mapChild(this.el, 'init_from', readInitFrom))
  }

  public get create2D() {
    return this.cache.get('create_2d', () => mapChild(this.el, 'create_2d', (el) => {
      return {
        size: mapChild(el, 'size_exact', (ch) => {
          return {
            width: Number(ch.getAttribute('width')),
            height: Number(ch.getAttribute('height')),
          }
        }),
        ratio: mapChild(el, 'size_ratio', (ch) => {
          return {
            width: Number(ch.getAttribute('width')),
            height: Number(ch.getAttribute('height')),
          }
        }),
        mipLevels: mapChild(el, 'mips', (ch) => Number(ch.getAttribute('levels'))) || 0,
        mipAutogenerate: mapChild(el, 'mips', (ch) => ch.getAttribute('auto_generate') === 'true'),
        unnormalized: mapChild(el, 'unnormalized', () => true) || false,
        arrayLength: mapChild(el, 'array', (ch) => Number(ch.getAttribute('length'))),
        format: mapChild(el, 'format', readFormat),
        initFrom: mapChildren(el, 'init_from', readInitFrom),
      }
    }))
  }

  public get create3D() {
    return this.cache.get('create_3d', () => mapChild(this.el, 'create_3d', (el) => {
      return {
        size: mapChild(el, 'size', (ch) => {
          return {
            width: Number(ch.getAttribute('width')),
            height: Number(ch.getAttribute('height')),
            depth: Number(ch.getAttribute('depth')),
          }
        }),
        mipLevels: mapChild(el, 'mips', (ch) => Number(ch.getAttribute('levels'))) || 0,
        mipAutogenerate: mapChild(el, 'mips', (ch) => ch.getAttribute('auto_generate') === 'true'),
        arrayLength: mapChild(el, 'array', (ch) => Number(ch.getAttribute('length'))),
        format: mapChild(el, 'format', readFormat),
        initFrom: mapChildren(el, 'init_from', readInitFrom),
      }
    }))
  }

  public get createCube() {
    return this.cache.get('create_cube', () => mapChild(this.el, 'create_cube', (el) => {
      return {
        size: mapChild(el, 'size', (ch) => {
          return {
            width: Number(ch.getAttribute('width')),
            height: Number(ch.getAttribute('height')),
            depth: Number(ch.getAttribute('depth')),
          }
        }),
        mipLevels: mapChild(el, 'mips', (ch) => Number(ch.getAttribute('levels'))) || 0,
        mipAutogenerate: mapChild(el, 'mips', (ch) => ch.getAttribute('auto_generate') === 'true'),
        arrayLength: mapChild(el, 'array', (ch) => Number(ch.getAttribute('length'))),
        format: mapChild(el, 'format', readFormat),
        initFrom: mapChildren(el, 'init_from', readInitFrom),
      }
    }))
  }

  public constructor(private doc: COLLADA, private el: Element) {

  }
}

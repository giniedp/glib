import { Color, CommonBlocks, Device, SpriteBatch, type InputSlot, type Material, type Texture } from '@gglib/graphics'
import type { FactoryComponent } from 'mithril'
import {
  h,
  uiBar,
  uiBarEnd,
  uiButton,
  uiColorWidget,
  uiDialog,
  uiFlex,
  uiGroup,
  uiImage,
  uiScalarWidget,
  uiSection,
  uiString,
  uiStringWidget,
  uiVectorWidget,
  uiWidget,
} from 'tweak-ui'
import icon from '../icons/brush.svg?raw'
import meta from './material-meta.json'
import { type UiAnnotation } from './types'

// TODO: move this out of global
// spriteBatch needs time to compile the shader, therefore can't be re-created for a single frame
// better pass a re-usable spritebatch from outside, or have one on the graphics device
let spriteBatch: SpriteBatch | null = null
async function getThumbnail(device: Device, texture: Texture, size = 128): Promise<ImageBitmap> {
  const target = device.createRenderTarget({
    width: size,
    height: size,
    depth: 1,
    format: 'RGBA8_UNORM',
    sampleCount: 1,
    mipLevelCount: 1,
  })

  spriteBatch ||= new SpriteBatch(device, {})
  await spriteBatch.shader.ready
  spriteBatch.begin()
  spriteBatch.next(texture).source(0, 0, texture.width, texture.height).destination(0, 0, size, size).alpha(1.0)
  spriteBatch.end()

  const pass = device.renderPass
  pass.flush()
  pass.setRenderTarget(0, target)
  pass.setClearColor(0, Color.Black)
  pass.clear()
  pass.render(spriteBatch)
  pass.submit()
  pass.flush()

  const pixels = await target.readPixelData(0, 0, size, size)
  target.dispose()

  return createImageBitmap(new ImageData(pixels, size, size))
}

export const MaterialProps: FactoryComponent<{ data: Material }> = () => {
  function renderTexture(src: any, size = 128) {
    const texture = src as Texture
    if (!texture) {
      return null
    }
    return getThumbnail(texture.device, texture, size)
  }

  let schema: Record<string, InputSlot> = {}
  let blocks: Array<{ name: string; inputs: InputSlot[] }> = []
  let dialogRef: HTMLDialogElement | null = null
  return {
    onbeforeupdate({ attrs: { data } }) {
      if (data['schema'] !== schema) {
        schema = (data['schema'] as any) || {}

        const blockGroups: Record<string, InputSlot[]> = {}
        for (const slot of Object.values(schema)) {
          blockGroups[slot.block] ||= []
          blockGroups[slot.block].push(slot)
        }

        blocks = Object.entries(blockGroups).map(([name, inputs]) => {
          return { name, inputs }
        })
      }
    },
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      return [
        uiStringWidget({
          value: data,
          field: 'name',
          readonly: true,
        }),
        uiStringWidget({
          value: data,
          field: 'uid',
          readonly: true,
        }),
        blocks.map((block) => {
          if (block.name !== CommonBlocks.Material && block.name !== '') {
            return null
          }
          return uiGroup(
            { title: block.name },
            block.inputs.map((slot) => {
              const name = slot.input
              switch (slot.type) {
                case 'scalar': {
                  const dataMeta = meta[name.toLocaleLowerCase()]
                  return uiScalarWidget({
                    label: name,
                    value: data,
                    binding: {
                      get: () => data.getInput(slot) as number,
                      set: (v: number) => data.setInput(slot, v),
                    },
                    min: dataMeta?.min,
                    max: dataMeta?.max,
                    step: dataMeta?.step,
                    range: dataMeta?.widget === 'slider',
                    decimals: 3,
                  })
                }
                case 'vec2': {
                  return uiVectorWidget({
                    label: name,
                    keys: ['x', 'y'],
                    value: data,
                    binding: {
                      get: (data) => data.getInput(slot),
                      set: (v) => data.setInput(slot, v),
                    },
                  })
                }
                case 'vec3': {
                  if (name.match(/color/i)) {
                    return uiColorWidget({
                      label: name,
                      format: '{n}xyz',
                      value: data,
                      binding: {
                        get: (data) => data.getInput(slot),
                        set: (v) => data.setInput(slot, v),
                      },
                    })
                  }
                  return uiVectorWidget({
                    label: name,
                    keys: ['x', 'y', 'z'],
                    value: data,
                    binding: {
                      get: (data) => data.getInput(slot),
                      set: (v) => data.setInput(slot, v),
                    },
                  })
                }
                case 'vec4': {
                  if (name.match(/color/i)) {
                    return uiColorWidget({
                      label: name,
                      format: '{n}xyzw',
                      value: data,
                      binding: {
                        get: (data) => data.getInput(slot),
                        set: (v) => data.setInput(slot, v),
                      },
                    })
                  }
                  return uiVectorWidget({
                    label: name,
                    keys: ['x', 'y', 'z', 'w'],
                    value: data,
                    binding: {
                      get: (data) => data.getInput(slot),
                      set: (v) => data.setInput(slot, v),
                    },
                  })
                }
                case 'texture': {
                  const texture = data.getInput(slot) as Texture
                  if (!texture) {
                    // assume texture block is not enabled
                    return null
                  }
                  return h(
                    TextureWidgetComponent as any,
                    {
                      label: name,
                      class: '',
                      texture,
                      render: renderTexture,
                    },
                    [],
                  )
                }
                default: {
                  return null
                }
              }
            }),
          )
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'Material',
  propsComponent: MaterialProps,
} satisfies UiAnnotation<Material>

export type TextureWidgetAttrs = {
  label: string
  class: string
  render: (texture: Texture, size?: number) => Promise<ImageBitmap>
  texture: Texture
}

export const TextureWidgetComponent: FactoryComponent<TextureWidgetAttrs> = () => {
  let dialogRef: HTMLDialogElement
  let renderThumb: (texture: Texture) => Promise<ImageBitmap>
  let renderTexture: (texture: Texture) => Promise<ImageBitmap>
  return {
    oninit: ({ attrs: { render } }) => {
      renderThumb = render
      renderTexture = (texture: Texture) => render(texture, texture.width)
    },
    onbeforeupdate: ({ attrs: { render } }) => {
      renderThumb = render
      renderTexture = (texture: Texture) => render(texture, texture.width)
    },
    view: ({ attrs: { label, class: className, texture, render, ...rest } }) => {
      if (!texture) {
        return null
      }
      return [
        uiWidget({ label }, [
          uiFlex({ flow: 'row' }, [
            uiImage({
              style: {
                cursor: 'pointer',
                flex: 'none',
                width: '64px',
                height: '64px',
                alignSelf: 'start',
              },
              src: texture,
              render: renderThumb,
              onclick: () => dialogRef.showModal(),
            }),
            h('div', { flow: 'column' }, [
              uiString({
                readonly: true,
                get value() {
                  return `${texture?.width} x ${texture?.height} x ${texture?.depth}`
                },
              }),
              uiString({ value: texture, field: 'format', readonly: true }),
              uiString({
                readonly: true,
                get value() {
                  return `${((texture?.sizeInBytes ?? 0) / 1024 / 1024).toFixed(2)}`
                },
                slotEnd: h('span.twk-color-muted', 'MB (estimated)'),
              }),
            ]),
          ]),
        ]),
        uiDialog(
          {
            oncreate: ({ dom }) => (dialogRef = dom as HTMLDialogElement),
            onremove: () => (dialogRef = null),
          },
          [
            uiSection(
              {
                class: 'twk-dialog-content twk-bg-300',
                header: uiBar(
                  {
                    class: 'twk-bg-neutral twk-p-2',
                  },
                  [
                    uiBarEnd({}, uiButton({ large: true, square: true, onclick: () => dialogRef?.close() }, '×')),
                    h('div.twk-px-2', {}, 'Texture'),
                  ],
                ),
                footer: uiBar({}, [
                  uiBarEnd({ class: 'twk-p-1 twk-flex-row twk-gap-1' }, [
                    uiButton({ large: true, onclick: () => dialogRef?.close() }, 'Close'),
                  ]),
                ]),
              },
              [
                h('div.twk-p-4.twk-gap-4.twk-flex', { style: { minHeight: '10rem' } }, [
                  uiImage({
                    class: 'twk-bg-checker',
                    aspect: 1,
                    fit: 'contain',
                    width: '100%',
                    src: texture,
                    render: renderTexture,
                  }),
                  // uiBar({}, [
                  //   uiBarStart({}, h('span.twk-color-dim', {}, 'MIP')),
                  //   uiBarContent({ class: 'twk-flex-row' }, [
                  //     uiButton({ square: true }, '0'),
                  //     uiButton({ square: true }, '1'),
                  //     uiButton({ square: true }, '2'),
                  //     uiButton({ square: true }, '3'),
                  //   ]),
                  //   uiBarEnd({}, h('span.twk-color-dim', {}, '400x200')),
                  // ]),
                  uiFlex({ flow: 'row', class: 'twk-gap-4' }, [
                    h('div', [
                      h('div.twk-color-dim', {}, 'SIZE'),
                      h('div', {}, `${texture.width}x${texture.height}x${texture.depth}`),
                    ]),
                    h('div.twk-divider-v'),
                    h('div', [h('div.twk-color-dim', {}, 'FORMAT'), h('div', {}, texture.format)]),
                    h('div.twk-divider-v'),
                    h('div', [h('div.twk-color-dim', {}, 'MIP LEVELS'), h('div', {}, texture.mipLevelCount)]),
                  ]),
                ]),
              ],
            ),
          ],
        ),
      ]
    },
  }
}

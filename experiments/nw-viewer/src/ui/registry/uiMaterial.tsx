import { Color, CommonBlocks, Device, SpriteBatch, type InputSlot, type Material, type Texture } from '@gglib/graphics'
import { createMemo, createSignal, For, Match, Show, Switch } from 'solid-js'
import {
  Bar,
  Button,
  ColorWidget,
  colorObject,
  Dialog,
  Divider,
  Flex,
  Group,
  Image,
  ScalarWidget,
  Section,
  TextInput,
  TextWidget,
  VectorWidget,
  Widget,
} from 'tweak-ui'
import icon from '../icons/brush.svg?raw'
import { usePanel } from '../panel'
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
    format: 'rgba8unorm',
    sampleCount: 1,
    mipLevelCount: 1,
  })

  spriteBatch ||= new SpriteBatch(device, {})
  await spriteBatch.shader.compiled
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

const colorXYZ = colorObject('xyz')
const colorXYZW = colorObject('xyzw')

export function MaterialProps(props: { data: Material }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => {
        // only a new schema regroups the inputs, a redraw keeps the controls
        const schema = createMemo(() => panel.pull(() => data['schema'] as Record<string, InputSlot>))
        // the inputs grouped by block
        const blocks = createMemo(() => {
          const groups: Record<string, InputSlot[]> = {}
          for (const slot of Object.values(schema() || {})) {
            groups[slot.block] ||= []
            groups[slot.block].push(slot)
          }
          return Object.entries(groups)
            .filter(([name]) => name === CommonBlocks.Material || name === '')
            .map(([name, inputs]) => ({ name, inputs }))
        })
        return (
          <>
            <TextWidget {...panel.bind(data, 'name')} readonly />
            <TextWidget {...panel.bind(data, 'uid')} readonly />
            <For each={blocks()}>
              {(block) => (
                <Group title={block.name}>
                  <For each={block.inputs}>{(slot) => <MaterialInput material={data} slot={slot} />}</For>
                </Group>
              )}
            </For>
          </>
        )
      }}
    </Show>
  )
}

function MaterialInput(props: { material: Material; slot: InputSlot }) {
  const panel = usePanel()
  const name = () => props.slot.input
  const value = <T,>() => panel.pull(() => props.material.getInput(props.slot) as T)
  const set = (value: unknown) => {
    props.material.setInput(props.slot, value as any)
    panel.redraw()
  }
  // vectors are modified in place
  const setElement = (element: number, key: string | number) => {
    const vector = props.material.getInput(props.slot) as unknown as Record<string | number, number>
    vector[key] = element
    set(vector)
  }
  const isColor = () => /color/i.test(name())
  const vectorKeys: Record<string, string[]> = { vec2: ['x', 'y'], vec3: ['x', 'y', 'z'], vec4: ['x', 'y', 'z', 'w'] }
  return (
    <Switch>
      <Match when={props.slot.type === 'scalar'}>
        <ScalarInputRow name={name()} value={value<number>()} onInput={set} />
      </Match>
      <Match when={props.slot.type === 'vec3' && isColor()}>
        <ColorWidget label={name()} format={colorXYZ} value={value<Record<string, number>>()} onInput={set} />
      </Match>
      <Match when={props.slot.type === 'vec4' && isColor()}>
        <ColorWidget label={name()} format={colorXYZW} value={value<Record<string, number>>()} onInput={set} />
      </Match>
      <Match when={vectorKeys[props.slot.type]}>
        {(keys) => <VectorWidget label={name()} keys={keys()} value={value<object>()} onInput={setElement} />}
      </Match>
      {/* no texture: assume the texture block is not enabled */}
      <Match when={props.slot.type === 'texture' && value<Texture>()}>
        {(texture) => <TextureWidget label={name()} texture={texture()} />}
      </Match>
    </Switch>
  )
}

function ScalarInputRow(props: { name: string; value: number; onInput: (value: number) => void }) {
  const dataMeta = () => meta[props.name.toLocaleLowerCase()]
  return (
    <ScalarWidget
      label={props.name}
      value={props.value}
      onInput={props.onInput}
      min={dataMeta()?.min}
      max={dataMeta()?.max}
      step={dataMeta()?.step}
      range={dataMeta()?.widget === 'slider'}
      decimals={3}
    />
  )
}

export default {
  icon: () => icon,
  label: () => 'Material',
  propsComponent: MaterialProps,
} satisfies UiAnnotation<Material>

/**
 * A texture thumbnail with size and format. A click on the thumbnail shows the texture in a dialog.
 */
export function TextureWidget(props: { label: string; texture: Texture }) {
  const [open, setOpen] = createSignal(false)
  // the same texture is not rendered again on redraw
  const texture = createMemo(() => props.texture)
  const thumbnail = createMemo(() => getThumbnail(texture().device, texture(), 128))
  return (
    <>
      <Widget label={props.label}>
        <Flex row style={{ 'align-items': 'start' }}>
          <button type="button" title="Show texture" style={{ flex: 'none' }} onClick={() => setOpen(true)}>
            <Image src={thumbnail()} width={64} aspect={1} />
          </button>
          <Flex>
            <TextInput readonly value={`${texture().width} x ${texture().height} x ${texture().depth}`} />
            <TextInput readonly value={texture().format} />
            <TextInput
              readonly
              value={((texture().sizeInBytes ?? 0) / 1024 / 1024).toFixed(2)}
              slotAfter={<span style={{ opacity: 0.5 }}>MB (estimated)</span>}
            />
          </Flex>
        </Flex>
      </Widget>
      <Dialog open={open()} onToggle={setOpen} style={{ 'max-width': '48rem' }}>
        <Section
          header={
            <Bar
              end={
                <Button large square onClick={() => setOpen(false)}>
                  ×
                </Button>
              }
            >
              <span style={{ padding: '0 0.5rem' }}>Texture</span>
            </Bar>
          }
          footer={
            <Bar
              end={
                <Button large onClick={() => setOpen(false)}>
                  Close
                </Button>
              }
            />
          }
        >
          <Flex style={{ padding: '1rem', gap: '1rem', 'min-height': '10rem' }}>
            <Image
              class="twk-bg-checker"
              aspect={1}
              fit="contain"
              width="100%"
              src={getThumbnail(texture().device, texture(), texture().width)}
            />
            <Flex row style={{ gap: '1rem' }}>
              <TextureFact label="SIZE" value={`${texture().width}x${texture().height}x${texture().depth}`} />
              <Divider vertical />
              <TextureFact label="FORMAT" value={texture().format} />
              <Divider vertical />
              <TextureFact label="MIP LEVELS" value={texture().mipLevelCount} />
            </Flex>
          </Flex>
        </Section>
      </Dialog>
    </>
  )
}

function TextureFact(props: { label: string; value: string | number }) {
  return (
    <div>
      <div style={{ opacity: 0.5 }}>{props.label}</div>
      <div>{props.value}</div>
    </div>
  )
}

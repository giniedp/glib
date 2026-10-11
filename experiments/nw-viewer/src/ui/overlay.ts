import { Renderer } from '@gglib/render'
import type { ClosureComponent } from 'mithril'
import {
  h,
  mountUi,
  redrawUi,
  uiBar,
  uiBarEnd,
  uiBarStart,
  uiButton,
  uiDialog,
  uiFlex,
  uiGraph,
  uiGroup,
  uiPoll,
  uiSection,
  uiSectionHeader,
  uiSelect,
  uiSplit,
  uiTabs,
} from 'tweak-ui'
import { DebugShapeSystem } from '../game/debug/DebugShapeSystem'
import { SkyLightSystem } from '../game/level/SkyLightSystem'
import { LightSystem } from '../game/light/LightSystem'
import { DebugOptions } from '../material'
import type { SceneLoadOption } from '../scenes'
import type { LevelLoadOption, NwViewer } from '../viewer'
import { NwSceneBrowser } from './browser'
import { uiIcon } from './icon'
import svgCamera from './icons/camera.svg?raw'
import svgGear from './icons/gear.svg?raw'
import svgStats from './icons/chart-simple-horizontal.svg?raw'
import svgTree from './icons/list-tree.svg?raw'
import svgVolume from './icons/volume-high.svg?raw'
import svgVolumeOff from './icons/volume-xmark.svg?raw'
import { uiRegistry } from './registry'
import { CameraComponentProps } from './registry/uiCameraComponent'
import { configActions, ConfigProps } from './registry/uiConfig'
import { DebugShapeSystemProps } from './registry/uiDebugShapeSystem'
import { LightSystemProps } from './registry/uiLightSystem'
import { RenderPipelineProps } from './registry/uiRenderPipeline'
import { TimeOfDayProps } from './registry/uiTimeOfDay'

export function attachOverlay(element: HTMLDivElement, viewer: NwViewer) {
  const el = document.createElement('div')
  el.style.position = 'absolute'
  el.style.top = '0'
  el.style.left = '0'
  el.style.pointerEvents = 'none'
  element.appendChild(el)

  mountUi(el, {
    view: () => [h(OverlayComponent, { viewer })],
  })
}

type OverlayComponentAttrs = {
  viewer: NwViewer
}

const OverlayComponent: ClosureComponent<OverlayComponentAttrs> = () => {
  let left = false
  let right = false
  let levelOptions: Record<string, LevelLoadOption[]> = {}
  const registry = uiRegistry()
  return {
    oninit: ({ attrs: { viewer } }) => {
      levelOptions = viewer.levelOptions || {}
      viewer.onLevelOptionsLoaded.add(() => {
        levelOptions = viewer.levelOptions || {}
        redrawUi()
      })
    },
    view: ({ attrs: { viewer } }) => [
      uiSection({ class: 'twk-bg-transparent', style: { height: '100%', pointerEvents: 'none' } }, [
        uiSectionHeader({ style: { pointerEvents: 'all' } }, [
          uiBar(
            {
              class: 'twk-glass twk-glass-300',
            },
            [
              uiBarStart({}, [
                uiButton(
                  {
                    square: true,
                    style: { padding: '0.25rem', margin: '0.25rem' },
                    onclick: () => (left = !left),
                  },
                  [uiIcon({ icon: svgTree })],
                ),
                uiButton(
                  {
                    square: true,
                    accent: viewer.config.value.audioEnabled,
                    title: viewer.config.value.audioEnabled ? 'Disable audio' : 'Enable audio',
                    style: { padding: '0.25rem', margin: '0.25rem 0' },
                    // runs in the click, so the audio context can start (autoplay policy)
                    onclick: () => viewer.config.set('audioEnabled', !viewer.config.value.audioEnabled),
                  },
                  [uiIcon({ icon: viewer.config.value.audioEnabled ? svgVolume : svgVolumeOff })],
                ),
              ]),
              uiBarEnd(
                {
                  style: { padding: '0.25rem' },
                },
                [
                  uiFlex({ flow: 'row', style: { alignItems: 'center' } }, [
                    uiPoll({
                      get value() {
                        const fps = Math.floor(1 / viewer.frameTime)
                          .toString()
                          .padStart(3, '0')
                        const ft = (viewer.frameTime * 1000).toFixed(2).toString().padStart(5, '0')
                        const dc = (viewer.renderStats?.drawCount ?? 0).toString().padStart(4, '0')
                        const vc = (viewer.sceneStats?.visible ?? 0).toString().padStart(4, '0')
                        const tasks = viewer.schedulerStats?.total || 0
                        const upd = viewer.world.stats.update.toFixed(2).padStart(5, '0')
                        const draw = viewer.stats.draw.toFixed(2).padStart(5, '0')
                        return `${tasks} Tasks | ${fps} FPS | ${ft} ms | upd ${upd} | draw ${draw} | ${dc} Draws | ${vc} Visible`
                      },
                    }),
                    h(LoadLevelButton, { viewer, options: levelOptions }),
                    h(SettingsButton, { viewer }),
                    uiButton(
                      {
                        square: true,
                        title: 'Download screenshot (render resolution)',
                        style: { padding: '0.25rem' },
                        onclick: () => viewer.downloadScreenshot(),
                      },
                      [uiIcon({ icon: svgCamera })],
                    ),
                    uiButton(
                      {
                        square: true,
                        style: { padding: '0.25rem' },
                        onclick: () => (right = !right),
                      },
                      [uiIcon({ icon: svgStats })],
                    ),
                  ]),
                ],
              ),
            ],
          ),
        ]),

        uiSplit({ flow: 'row', minSize: 200, style: { height: '100%' } }, [
          !left
            ? null
            : h(
                'div.twk-bg-300',
                {
                  style: { flex: '0 0 325px' },
                },
                [
                  uiSplit({ style: { height: '100%', pointerEvents: 'all' } }, [
                    h(NwSceneBrowser, {
                      viewer,
                      registry,
                    }),
                  ]),
                ],
              ),
          h('div.fluid', { style: { flex: 1, pointerEvents: 'none' } }, []),
          !right
            ? null
            : h(
                'div.twk-bg-300',
                {
                  style: {
                    flex: '0 0 325px',
                    overflowY: 'auto',
                    overflowX: 'clip',
                    pointerEvents: 'all',
                  },
                },
                [
                  uiGroup({ style: {} }, [
                    uiGraph({
                      collapsed: true,
                      rows: [
                        {
                          name: 'Frame Time',
                          min: 0,
                          max: 100,
                          smoothing: 0.9,
                          sample: () => {
                            return viewer.frameTime * 1000
                          },
                        },
                        {
                          name: 'FPS',
                          min: 0,
                          max: 240,
                          smoothing: 0.9,
                          sample: () => {
                            return viewer.frameTime > 0 ? 1 / viewer.frameTime : 0
                          },
                        },
                        {
                          name: 'Update (ms)',
                          min: 0,
                          max: 50,
                          smoothing: 0.9,
                          sample: () => viewer.world.stats.update,
                        },
                        {
                          name: 'Draw (ms)',
                          min: 0,
                          max: 50,
                          smoothing: 0.9,
                          sample: () => viewer.stats.draw,
                        },
                        {
                          name: 'Frame (MB)',
                          min: 0,
                          max: 2048,
                          sample: () => {
                            return viewer.world.getSystem(Renderer).resourceSizeInBytes / 1024 / 1024
                          },
                        },
                        {
                          name: 'Heap (MB)',
                          min: 0,
                          max: 2048,
                          sample: () => {
                            if ((performance as any).memory) {
                              return (performance as any).memory.usedJSHeapSize / 1024 / 1024
                            }
                            return 0
                          },
                        },
                        {
                          name: 'Textures',
                          min: 0,
                          max: 1000,
                          sample: () => viewer.deviceStats?.textureCount || 0,
                        },
                        {
                          name: 'Texture (MB)',
                          min: 0,
                          max: 2048,
                          sample: () => (viewer.deviceStats?.textureByteCount || 0) / 1024 / 1024,
                        },
                        {
                          name: 'Shaders',
                          min: 0,
                          max: 20,
                          sample: () => viewer.deviceStats?.shaderCount || 0,
                        },
                        {
                          name: 'Tasks total',
                          sample: () => viewer.schedulerStats?.total || 0,
                          noGraph: true,
                          fractionDigits: 0,
                        },
                        {
                          name: 'Tasks in Flight',
                          min: 0,
                          max: 1,
                          sample: () => viewer.schedulerStats?.inFlight || 0,
                          noGraph: true,
                          fractionDigits: 0,
                        },
                        {
                          name: 'Visible count',
                          min: 0,
                          max: 1,
                          sample: () => viewer.sceneStats?.visible || 0,
                          noGraph: true,
                          fractionDigits: 0,
                        },
                        {
                          name: 'Draw count',
                          min: 0,
                          max: 1,
                          sample: () => viewer.renderStats?.drawCount || 0,
                          noGraph: true,
                          fractionDigits: 0,
                        },
                      ],
                    }),
                    uiTabs({}, [
                      uiGroup({ title: 'Camera' }, [h(CameraComponentProps, { data: viewer.camera })]),
                      uiGroup({ title: 'Debug' }, [
                        uiSelect({
                          value: viewer,
                          field: 'debug',
                          label: 'Output',
                          options: DebugOptions,
                        }),
                        h(DebugShapeSystemProps, { data: viewer.world.getSystem(DebugShapeSystem) }),
                      ]),
                      uiGroup({ title: 'Time of day', collapsible: true }, [
                        h(TimeOfDayProps, { data: viewer.world.getSystem(SkyLightSystem).timeOfDay }),
                      ]),
                    ]),
                    uiGroup({ title: 'Lights' }, [h(LightSystemProps, { data: viewer.world.getSystem(LightSystem) })]),
                    uiGroup({ title: 'Render Pipeline', collapsible: true }, [
                      h(RenderPipelineProps, {
                        data: viewer.world.getSystem(Renderer).pipeline,
                        device: viewer.device,
                      }),
                    ]),
                  ]),
                ],
              ),
        ]),
      ]),
    ],
  }
}

/**
 * Opens the settings ({@link ViewerConfig}) in a dialog
 */
const SettingsButton: ClosureComponent<{ viewer: NwViewer }> = () => {
  let dialogRef: HTMLDialogElement
  return {
    view: ({ attrs: { viewer } }) => [
      uiButton(
        {
          square: true,
          title: 'Settings',
          style: { padding: '0.25rem' },
          onclick: () => dialogRef?.showModal(),
        },
        [uiIcon({ icon: svgGear })],
      ),
      uiDialog(
        {
          oncreate: ({ dom }) => (dialogRef = dom as HTMLDialogElement),
          onremove: () => (dialogRef = null),
        },
        [
          uiSection(
            {
              class: 'twk-dialog-content twk-bg-300',
              header: uiBar({ class: 'twk-bg-neutral twk-p-2' }, [
                uiBarEnd({}, uiButton({ large: true, square: true, onclick: () => dialogRef?.close() }, '×')),
                h('div.twk-px-2', {}, 'Settings'),
              ]),
              footer: uiBar({}, [
                uiBarEnd({ class: 'twk-p-1 twk-flex-row twk-gap-1' }, [
                  configActions(viewer.config, { large: true }),
                  uiButton({ large: true, onclick: () => dialogRef?.close() }, 'Close'),
                ]),
              ]),
            },
            [
              h(
                'div.twk-p-4',
                { style: { minWidth: '28rem', minHeight: '10rem', maxHeight: '60vh', overflow: 'auto' } },
                [h(ConfigProps, { data: viewer.config })],
              ),
            ],
          ),
        ],
      ),
    ],
  }
}

const LoadLevelButton: ClosureComponent<{ viewer: NwViewer; options: Record<string, LevelLoadOption[]> }> = () => {
  let dialogRef: HTMLDialogElement
  return {
    view: ({ attrs: { viewer, options } }) => {
      if (viewer.mode === 'model' || !options || !Object.keys(options).length) {
        return null
      }
      return [
        uiButton(
          {
            onclick: () => {
              dialogRef.showModal()
            },
          },
          'Scenes',
        ),
        uiDialog(
          {
            oncreate: ({ dom }) => {
              dialogRef = dom as HTMLDialogElement
              setTimeout(() => {
                if (!viewer.mode) {
                  dialogRef.showModal()
                  redrawUi()
                }
              }, 1000)
            },
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
                    h('div.twk-px-2', {}, 'Scenes'),
                  ],
                ),
                footer: uiBar({}, [
                  uiBarEnd({ class: 'twk-p-1 twk-flex-row twk-gap-1' }, [
                    uiButton({ large: true, onclick: () => dialogRef?.close() }, 'Close'),
                  ]),
                ]),
              },
              [
                uiTabs({}, [
                  uiGroup(
                    { title: 'Levels' },
                    levelList(viewer, options, () => dialogRef?.close()),
                  ),
                  uiGroup(
                    { title: 'Particles' },
                    sceneList(viewer, viewer.sceneOptions.particles, () => dialogRef?.close()),
                  ),
                  uiGroup(
                    { title: 'Materials' },
                    sceneList(viewer, viewer.sceneOptions.materials, () => dialogRef?.close()),
                  ),
                ]),
              ],
            ),
          ],
        ),
      ]
    },
  }
}

/**
 * Levels grouped by category
 */
function levelList(viewer: NwViewer, options: Record<string, LevelLoadOption[]>, close: () => void) {
  return h('div.twk-p-4.twk-gap-1.twk-flex', { style: { minHeight: '10rem', maxHeight: '50vh', overflow: 'auto' } }, [
    Object.entries(options).map(([title, options]) => {
      return uiGroup(
        { title, collapsible: true, collapsed: true },
        options.map((option) => {
          return uiButton(
            {
              class: 'twk-text-start twk-bar',
              onclick: () => {
                close()
                viewer.onLevelSelected(option.value)
              },
            },
            [
              option.label,
              h('span.twk-bar-end.twk-color-muted', {}, [
                option.isOpenWorld ? 'Open World' : '',
                option.isOpenWorld || title === 'raid' || title.match(/battle/) ? '⚠️' : '',
              ]),
            ],
          )
        }),
      )
    }),
  ])
}

/**
 * Preview scenes without a level of a tab (particle showcase …)
 */
function sceneList(viewer: NwViewer, options: SceneLoadOption[], close: () => void) {
  return h(
    'div.twk-p-4.twk-gap-1.twk-flex',
    { style: { minHeight: '10rem', maxHeight: '50vh', overflow: 'auto' } },
    options.length
      ? options.map((option) => {
          return uiButton(
            {
              class: 'twk-text-start twk-bar',
              onclick: () => {
                close()
                viewer.onLevelSelected(option.value)
              },
            },
            [option.label, h('span.twk-bar-end.twk-color-muted', {}, option.description ?? '')],
          )
        })
      : h('div.twk-color-muted.twk-p-2', {}, 'No scenes yet'),
  )
}

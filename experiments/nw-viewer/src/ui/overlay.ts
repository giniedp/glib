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
} from 'tweak-ui'
import { DebugShapeSystem } from '../game/debug/DebugShapeSystem'
import { LevelSystem } from '../game/level/LevelSystem'
import { DebugOptions } from '../material'
import type { LevelLoadOption, NwViewer } from '../viewer'
import { NwSceneBrowser } from './browser'
import { uiIcon } from './icon'
import svgStats from './icons/chart-simple-horizontal.svg?raw'
import svgTree from './icons/list-tree.svg?raw'
import { uiRegistry } from './registry'
import { CameraComponentProps } from './registry/uiCameraComponent'
import { DebugShapeSystemProps } from './registry/uiDebugShapeSystem'
import { TimeOfDayProps } from './registry/uiTimeOfDay'

export function attachOverlay(element: HTMLDivElement, viewer: NwViewer) {
  const treeEl = document.createElement('div')
  treeEl.style.position = 'absolute'
  treeEl.style.top = '0'
  treeEl.style.left = '0'
  element.appendChild(treeEl)

  mountUi(treeEl, {
    view: () => [h(OverlayComponent, { viewer })],
  })
}

type OverlayComponentAttrs = {
  viewer: NwViewer
}

const OverlayComponent: ClosureComponent<OverlayComponentAttrs> = () => {
  let left = false
  let right = false
  let levelOptions: LevelLoadOption[] = []
  const registry = uiRegistry()
  return {
    oninit: ({ attrs: { viewer } }) => {
      levelOptions = viewer.levelOptions || []
      viewer.onLevelOptionsLoaded.add(() => {
        levelOptions = viewer.levelOptions || []
        redrawUi()
      })
    },
    view: ({ attrs: { viewer } }) => [
      uiSection({ class: 'twk-bg-transparent', style: { height: '100%' } }, [
        uiSectionHeader({}, [
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
              ]),
              uiBarEnd(
                {
                  style: { padding: '0.25rem' },
                },
                [
                  uiFlex({ flow: 'row', style: { alignItems: 'center' } }, [
                    uiPoll({
                      get value() {
                        const fps = Math.floor(1000 / viewer.frameTime)
                          .toString()
                          .padStart(3, '0')
                        const ft = viewer.frameTime.toFixed(2).toString().padStart(5, '0')
                        const dc = (viewer.renderStats?.drawCount ?? 0).toString().padStart(4, '0')
                        const vc = (viewer.sceneStats?.visible ?? 0).toString().padStart(4, '0')
                        const tasks = viewer.schedulerStats?.total || 0
                        return `${tasks} Tasks | ${fps} FPS | ${ft} ms | ${dc} Draws | ${vc} Visible`
                      },
                    }),
                    h(LoadLevelButton, { viewer, options: levelOptions }),
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
                  onmousedown: (e) => e.stopPropagation(),
                },
                [
                  uiSplit({ style: { height: '100%' } }, [
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
                  style: { flex: '0 0 325px' },
                  onmousedown: (e) => e.stopPropagation(),
                },
                [
                  uiGroup({}, [
                    uiGraph({
                      collapsed: true,
                      rows: [
                        {
                          name: 'Frame Time',
                          min: 0,
                          max: 100,
                          smoothing: 0.9,
                          sample: () => {
                            return viewer.frameTime
                          },
                        },
                        {
                          name: 'FPS',
                          min: 0,
                          max: 240,
                          smoothing: 0.9,
                          sample: () => {
                            return viewer.frameTime > 0 ? 1000 / viewer.frameTime : 0
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
                    uiGroup({ title: 'Time of Day' }, [
                      h(TimeOfDayProps, { data: viewer.world.getSystem(LevelSystem).timeOfDay }),
                    ]),
                  ]),
                ],
              ),
        ]),
      ]),
    ],
  }
}

const LoadLevelButton: ClosureComponent<{ viewer: NwViewer; options: LevelLoadOption[] }> = () => {
  let dialogRef: HTMLDialogElement
  return {
    view: ({ attrs: { viewer, options } }) => {
      return [
        uiButton(
          {
            onclick: () => {
              dialogRef.showModal()
            },
          },
          'Levels',
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
                h(
                  'div.twk-p-4.twk-gap-1.twk-flex',
                  { style: { minHeight: '10rem', maxHeight: '50vh', overflow: 'auto' } },
                  [
                    options.map((option) => {
                      return uiButton(
                        {
                          onclick: () => {
                            dialogRef.close()
                            viewer.onLevelSelected(option.value)
                          },
                        },
                        [option.label],
                      )
                    }),
                  ],
                ),
              ],
            ),
          ],
        ),
      ]
    },
  }
}

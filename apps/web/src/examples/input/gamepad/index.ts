import { Gamepads } from '@gglib/input'

new Gamepads({
  autoUpdate: true,
}).on('changed', (gamepads: Gamepads, index: number) => {
  const copy = gamepads.state.map((it) => {
    if (!it) {
      return null
    }
    return {
      id: it.id,
      index: it.index,
      axes: [...it.axes],
      buttons: it.buttons.map((btn) => {
        return {
          pressed: btn.pressed,
          touched: btn.touched,
          value: btn.value,
        }
      }),
      connected: it.connected,
      mapping: it.mapping,
      timestamp: it.timestamp,
    }
  })
  document.querySelector('.canvas-container').textContent = JSON.stringify(copy, null, 2)
})

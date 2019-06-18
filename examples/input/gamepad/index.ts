import { Gamepads } from '@gglib/input'

new Gamepads({
  autopoll: true,
}).on('changed', (gamepads: Gamepads) => {
  document.querySelector('.canvas-container').textContent = JSON.stringify(gamepads.state)
})

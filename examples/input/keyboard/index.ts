import { Keyboard, Keys } from '@gglib/input'

new Keyboard().on('changed', (keyboard: Keyboard, e) => {
  const container = document.querySelector('.canvas-container')
  container.innerHTML = ''
  keyboard.state.pressedKeys.forEach((code) => {
    const el = document.createElement('span')
    el.classList.add('key')
    el.innerHTML = `<span class="key"><label>${code}</label><value>${Keys[code]}</value></span>`
    container.appendChild(el)
  })
})

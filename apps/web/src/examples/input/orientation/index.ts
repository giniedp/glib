import { Orientation } from '@gglib/input'

const orientation = new Orientation()

orientation.on('changed', (o: Orientation, e) => {
  const code = document.querySelector('code') as HTMLElement
  code.textContent = JSON.stringify(o.state, null, 2)
})

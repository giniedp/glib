---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: '[G]glib'
  text: 'Game & Graphics Libraries'
  tagline: Modular WebGPU-first libraries for game and graphics development.
  image:
    src: '/logo/gglib-256.png'
  actions:
    - theme: brand
      text: Learn more
      link: /about/gglib
    - theme: alt
      text: Github
      link: http://github.com/giniedp/glib
    # - theme: alt
    #   text: NPM
    #   link: https://www.npmjs.com/search?q=gglib
features:
  - title: WebGPU First
    icon:
      src: '/icons/webgpu-notext.svg'
    details: Built for WebGPU with optional WebGL2 support
  - title: Modular
    icon: '📦'
    details: Pick the packages you need, roll your own if you want
  - title: Math
    icon: '🔢'
    details: 3D algebra for vectors, matrices and collision shapes
  - title: Graphics
    icon: '🎨'
    details: Lower level render state management for WebGPU and WebGL2
  - title: Render
    icon: '🌄'
    details: Higher level render manager and simple frame graph
  - title: Content
    icon: '🗂️'
    details: Content loaders for various texture and model formats like .gltf, .ktx, .dds
  - title: ECS
    icon: '🧩'
    details: Extensible entity component system for scene management
  - title: More
    icon: '…'
    details: can't fit everything into the frontpage. Check the examples and source code.
---

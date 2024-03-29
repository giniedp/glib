import { Static as Mithril, Vnode } from 'mithril'

declare const Prism: any
declare const showdown: any
declare const m: Mithril

const links = document.querySelectorAll('a.list-group-item')
const containerEl = document.querySelector('.example-content')
const pageEl = document.querySelector('.example-page')
const titleEl = document.querySelector('.example-title')

document.querySelector('a.example-button-menu').addEventListener('click', () => {
  pageEl.classList.toggle('sidebar-off')
})
document.querySelector('a.example-button-prev').addEventListener('click', prevExample)
document.querySelector('a.example-button-next').addEventListener('click', nextExample)

interface ExampleData {
  title: string
  description?: string
  href: string
  frontpage: boolean
  sandbox: boolean
  skipPreview: boolean
  files: string[]
}

interface ExampleContent {
  name: string
  lang: string
  content: string
  html?: string
}

class ExampleComponent {
  private previewUrl: string
  private readme: ExampleContent
  private tabs: ExampleContent[]
  private tabIndex = 0
  private hasSandbox: boolean

  private get tab() {
    return this.tabs ? this.tabs[this.tabIndex] : null
  }

  constructor(private node: Vnode<ExampleData>) {
    //
  }

  public async oncreate() {
    const data = this.node.attrs
    const url = data.href.replace('#', location.pathname).replace(/\/+/g, '/')

    if (!data.skipPreview && !data.frontpage) {
      this.previewUrl = url
    }

    if (!data.files || data.files.length === 0) {
      this.tabs = null
      m.redraw()
      return
    }
    this.hasSandbox = data.sandbox
    const files = await Promise.all<ExampleContent>(
      this.node.attrs.files.map(async (name: string) => {
        return m
          .request({
            url: url + '/' + name,
            extract: (r) => r.responseText,
          })
          .then((content) => {
            return {
              name: name,
              content: content,
              lang: name.split(/\./)[1],
            }
          })
      }),
    )

    this.readme = files.find((it) => it.name === 'Readme.md')
    this.tabs = files.filter((it) => it.name !== 'Readme.md')
    if (this.tabs.length === 0) {
      this.tabs = null
    }
    m.redraw()
  }

  public view() {
    return m(
      'div.example-body',

      // m.fragment({}, [
      //   this.hasSandbox
      //     ? m(
      //         'button.example-tab[type="button"]',
      //         {
      //           onclick: () => this.openSandbox(),
      //         },
      //         'Open In Sandbox',
      //       )
      //     : null,
      // ]),
      m(ExamplePreviewComponent, { url: this.previewUrl }),
      m(ExampleSectionComponent, { data: this.readme }),
      m(ExampleTabsComponent, {
        tabs: this.tabs,
        active: this.tabIndex,
        select: (i: number) => {
          this.tabIndex = i
          m.redraw()
        },
      }),
      m.fragment({}, [
        m(ExampleSectionComponent, {
          key: `panel-${this.tabIndex}`,
          data: this.tab,
        }),
      ]),
    )
  }

  private openSandbox() {
    const data = this.node.attrs
    const sdk = (window as any).StackBlitzSDK
    const project = {
      files: {},
      title: data.title,
      description: data.description || '',
      template: 'typescript',
      tags: [] as string[],
      dependencies: {},
    }
    this.tabs.forEach((tab) => {
      if (tab.lang === 'ts' || tab.lang === 'html') {
        project.files[tab.name] = tab.content
      }
      if (tab.lang === 'ts') {
        tab.content.replace(/from '(@gglib\/[\w+-_]+)'/gi, (match, pkg) => {
          project.dependencies[pkg] = '*'
          return match
        })
        if (tab.content.match(/from 'tweak-ui'/gi)) {
          project.dependencies['tweak-ui'] = '*'
        }
      }
    })
    sdk.openProject(project, {
      newWindow: true
    })
  }
}

const ExamplePreviewComponent = {
  view: (node: Vnode<{ url: string }>) => {
    if (!node.attrs.url) {
      return null
    }
    return m('div.example-preview.embed-responsive.embed-responsive-21by9', m('iframe', { src: node.attrs.url }))
  },
}

class ExampleSectionComponent {
  private code: Vnode
  private content: Vnode
  private annotated: Array<{
    code: Vnode
    comments: Vnode
  }>

  get hasContent() {
    return !!this.code || !!this.content || (!!this.annotated && this.annotated.length)
  }

  constructor(private node: Vnode<{ data: ExampleContent }>) {
    this.onupdate(node)
  }

  public onupdate(node: Vnode<{ data: ExampleContent }>) {
    const hadContent = this.hasContent

    this.node = node
    this.content = null
    this.code = null
    this.annotated = null

    const data = node.attrs.data
    if (!data) {
      return
    }
    if (data.lang === 'md') {
      this.content = m.trust(this.markdown(data.content))
    } else if (data.lang === 'js' || data.lang === 'ts') {
      this.annotated = explainCode(data.content).map((it) => {
        return {
          code: m.trust(this.highlight(it.code, 'ts')),
          comments: m.trust(this.markdown(it.comments)),
        }
      })
    } else {
      this.code = m.trust(this.highlight(data.content, data.lang))
    }

    if (hadContent !== this.hasContent) {
      m.redraw()
    }
  }

  private highlight(code: string, lang: string): string {
    if ('Prism' in window && lang in Prism.languages) {
      return Prism.highlight(code, Prism.languages[lang], lang)
    } else {
      return code
    }
  }

  private markdown(content: string): string {
    if ('showdown' in window) {
      return new showdown.Converter().makeHtml(content)
    }
    return content
  }

  public view() {
    if (!this.hasContent) {
      return null
    }

    return m(
      `section.example-section.example-section-${this.node.attrs.data.lang}`,
      this.content,
      m(ExampleCodeComponent, { code: this.code } as any),
      !this.annotated
        ? null
        : m(
            '.annotated-section',
            this.annotated.map((it) => {
              return m.fragment({}, [m('div', { class: 'annotation' }, it.comments), m('pre', m('code', it.code))])
            }),
          ),
    )
  }
}

const ExampleCodeComponent = {
  view: (node: Vnode<{ code: string }>) => {
    const code = node.attrs.code
    return code ? m('pre', m('code', node.attrs.code)) : null
  },
}

class ExampleTabsComponent {
  private node: Vnode<{
    tabs: ExampleContent[]
    active: number
    select: (i: number) => void
  }>

  constructor(node: Vnode<any>) {
    this.node = node
  }

  public onupdate(node: Vnode<any>) {
    this.node = node
  }

  public view(node: Vnode<any>) {
    this.node = node

    const data = this.node.attrs
    if (!data.tabs || !data.tabs.length) {
      return null
    }

    return m(
      'div',
      { class: 'example-tabs' },
      data.tabs.map((tab, i) => {
        return m(
          'button.example-tab[type="button"]',
          {
            key: `tab-${i}`,
            class: i === data.active ? 'active' : '',
            onclick: () => this.node.attrs.select(i),
          },
          tab.name,
        )
      }),
    )
  }
}

function loadExample() {
  const hash = location.hash || links[0].getAttribute('href')
  if (!hash.match(/^#[0-9a-zA-Z/\-_]+$/)) {
    console.warn('invalid URL', hash)
    return
  }

  links.forEach((it) => it.classList.remove('active'))
  links.forEach((it) => {
    if (it.getAttribute('href') === hash) {
      openExample(hash, JSON.parse((it as HTMLElement).dataset.data))
    }
  })
}

function nextExample() {
  let open = false
  links.forEach((it) => {
    if (it.classList.contains('active')) {
      open = true
    } else if (open) {
      location.hash = it.getAttribute('href')
      open = false
    }
  })
}

function prevExample() {
  let open = false
  for (let i = links.length; i >= 0; i--) {
    const it = links.item(i)
    if (!it) {
      //
    } else if (it.classList.contains('active')) {
      open = true
    } else if (open) {
      location.hash = it.getAttribute('href')
      open = false
    }
  }
}

function openExample(hash: string, data: ExampleData) {
  links.forEach((it) => {
    it.classList.remove('active')
    if (it.getAttribute('href') === hash) {
      it.classList.add('active')
    }
  })

  containerEl.classList.remove('show')
  containerEl.classList.add('hide')
  titleEl.textContent = data.title
  setTimeout(() => {
    m.mount(containerEl, {
      view: () =>
        m(ExampleComponent, {
          ...data,
          href: hash,
        }),
    })
    setTimeout(() => {
      containerEl.classList.remove('hide')
      containerEl.classList.add('show')
    }, 500)
  }, 250)
}

interface Section {
  comments: string[]
  code: string[]
}

// escapes HTML entities
// function escapeHtml(html: string) {
//   return String(html)
//     .replace(/&/g, '&amp;')
//     .replace(/"/g, '&quot;')
//     .replace(/'/g, '&#39;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
// }

function fixIndents(text: string) {
  let lines = text.split('\n')
  // skip if string is empty
  if (!lines.length) {
    return text
  }
  // fixes 'outerHTML' indents
  // the first line of outerHTML wont have any indent but last line will.
  // Copy indent from last line to first line
  if (lines[0].match(/^<script/) && lines[lines.length - 1].match(/\s+<\/script>$/)) {
    lines[0] = lines[lines.length - 1].match(/(\s+)<\/script>$/)[1] + lines[0]
  }
  // find smallest indent value
  let minIndent = Number.MAX_VALUE
  lines.forEach((line) => {
    let match = line.match(/^(\s*)/)
    // if line is not blank
    if (match[1].length !== line.length) {
      minIndent = Math.min(minIndent, match[1].length)
    }
  })

  // remove the smallest indent from all lines
  // and join to string
  return lines
    .map((line) => {
      return line.substring(minIndent)
    })
    .join('\n')
}

function explainLine(line: string, fn: (line: string, comment: string) => void) {
  const match = line.match(/^\s*\/\/(.*)/)
  if (!match) {
    return fn(line, null)
  }

  const comment = match[1]

  if (comment.match(/^\s*@/)) {
    return fn(line, null)
  }
  if (comment.match(/^\//)) {
    return fn(line, null)
  }
  if (comment.trim() === 'prettier-ignore') {
    return
  }

  return fn(line, comment)
}

function explainCode(js: string) {
  // replace tabs with spaces
  js = js.replace(/[\t]/g, '  ')
  // normalize line feeds
  js = js.replace(/[\r\n]/g, '\n')

  // Now break lines up into sections
  let sections: Section[] = []
  let section: Section = null
  let lines = js.split(/\n/m)
  let wasComment = true

  function nextSection() {
    // add new section if previous is null or empty
    if (!section || section.comments.length || section.code.length) {
      section = { comments: [], code: [] }
      sections.push(section)
    }
  }

  nextSection()
  lines.forEach((line) => {
    const isBlank = /^\s*$/.test(line)
    if (isBlank) {
      if (wasComment) {
        nextSection()
      } else {
        section.code.push(line) // retain lines between code blocks
      }
      return
    }

    explainLine(line, (l, c) => {
      if (c) {
        if (!wasComment) {
          nextSection()
        }
        section.comments.push(c)
        wasComment = true
      } else {
        section.code.push(l)
        wasComment = false
      }
    })
  })

  return sections.map((s) => {
    return {
      comments: fixIndents(s.comments.join('\n')),
      code: s.code.join('\n'),
    }
  })
}

function openSandbox(data: ExampleData, files: ExampleContent[]) {}

if (Prism.plugins.NormalizeWhitespace) {
  Prism.plugins.NormalizeWhitespace.setDefaults({
    'remove-trailing': true,
    'remove-indent': false,
    'left-trim': false,
    'right-trim': true,
  })
}

window.addEventListener('hashchange', loadExample)
loadExample()

declare let $: any
declare const Prism: any
declare const showdown: any

const links = $('a.list-group-item')
const container = document.querySelector('.example-container')

function loadExample() {
  let hash = location.hash
  if (!hash) {
    return
  }

  const data = links
    .removeClass('active')
    .filter('[href="' + hash + '"]')
    .addClass('active')
    .data('data')

  renderExample(hash, data)
}

interface Tab {
  name: string
  content: string
  lang: string
}

function renderExample(hash: string, data: any) {
  const url = hash.replace('#', location.pathname)
  container.innerHTML = ''

  container.appendChild(makeIframe(url))

  if (!data.files) {
    return
  }

  Promise.all<Tab>(data.files.map((name: string) => {
      const partUrl = url + '/' + name
      return new Promise<Tab>((resolve, reject) => {
        $.ajax({ dataType: 'text', url: partUrl }).done((content: string) => {
          resolve({
            name: name,
            content: content,
            lang: name.split(/\./)[1],
          })
        })
      })
    })).then((tabs: Tab[]) => {
      for (const tab of tabs) {
        const section = document.createElement('section')
        container.appendChild(section)

        const h = document.createElement('h1')
        h.textContent = tab.name
        section.appendChild(h)

        if (tab.lang === 'js' || tab.lang === 'ts') {
          section.appendChild(makeAnnotatedSnippet(tab.content, tab.lang))
        } else {
          const snippet = document.createElement('div')
          snippet.appendChild(makeSnippet(tab.content, tab.lang))
          section.appendChild(snippet)
        }
      }
    })
}

interface Section {
  comments: string[],
  code: string[]
}

// escapes HTML entities
function escapeHtml(html: string) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

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

  // remove the smalles indent from all lines
  // and join to string
  return lines.map((line) => {
    return line.substring(minIndent)
  }).join('\n')
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

    let isBlank = /^\s*$/.test(line)
    if (isBlank) {
      if (wasComment) {
        nextSection()
      } else {
        section.code.push(line) // retain lines between code blocks
      }
      return
    }

    // add next comment or code
    let commentMatch = line.match(/^\s*\/\/(.*)/)
    if (commentMatch && !commentMatch[1].match(/^\s*@/) && !commentMatch[1].match(/^\//)) {
      if (!wasComment) {
        nextSection()
      }
      section.comments.push(commentMatch[1])
      wasComment = true
    } else {
      section.code.push(line)
      wasComment = false
    }
  })

  return sections.map((s) => {
    return {
      comments: fixIndents(s.comments.join('\n')),
      code: s.code.join('\n'),
    }
  })
}

if (Prism.plugins.NormalizeWhitespace) {
  Prism.plugins.NormalizeWhitespace.setDefaults({
    'remove-trailing': true,
    'remove-indent': false,
    'left-trim': false,
    'right-trim': true,
  })
}

function makeSnippet(sourceCode: string, language: string) {
  const code = document.createElement('code')
  code.textContent = sourceCode
  const pre = document.createElement('pre')
  pre.classList.add('line-numbers', 'language-' + language)
  pre.appendChild(code)
  if ('Prism' in window) {
    Prism.highlightElement(code)
  }
  return pre
}

function makeAnnotatedSnippet(code: string, language: string) {
  let converter = null
  if ('showdown' in window) {
    converter = new showdown.Converter()
  }

  const root = document.createElement('ul')
  root.classList.add('annotated-code')

  for (const section of explainCode(code)) {
    const node = document.createElement('li')
    node.classList.add('annotated-section')
    root.appendChild(node)

    const annotation = document.createElement('div')
    annotation.classList.add('annotation')
    node.appendChild(annotation)
    annotation.innerHTML = converter ? converter.makeHtml(escapeHtml(section.comments)) : escapeHtml(section.comments)

    node.appendChild(makeSnippet(section.code, language))
  }

  return root
}

function makeIframe(url: string) {
  const wrapper = document.createElement('div')
  wrapper.classList.add('example-preview')
  const iframe = document.createElement('iframe')
  iframe.src = url

  wrapper.appendChild(iframe)
  return wrapper
}

window.addEventListener('hashchange', loadExample)
$(loadExample)

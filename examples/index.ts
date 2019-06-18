declare let $: any

const links = $('a.list-group-item')
const iframe = $('iframe')

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

  console.log(data)

  iframe.attr('src', hash.replace('#', location.pathname))
}

window.addEventListener('hashchange', loadExample)
$(loadExample)

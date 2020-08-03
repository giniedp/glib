const scripts: HTMLScriptElement[] = []

export const RED10x20 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAUCAYAAAC07qxWAAAAGElEQVR42mP8z8AARIQB46jCUYWjCkEAAMXUJ+1sUc+CAAAAAElFTkSuQmCC'

export function defineScript(id: string, type: string, scriptContent: string) {
  const head = document.getElementsByTagName('head').item(0)
  const script = document.createElement('script')
  scripts.push(script)
  script.setAttribute('id', id)
  script.setAttribute('type', type)
  script.textContent = scriptContent
  head.appendChild(script)
}
export function clearScripts() {
  scripts.forEach((it) => it.remove())
  scripts.length = 0
}

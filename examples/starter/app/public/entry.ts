import { run } from 'remix/component'

const app = run({
  async loadModule(url, name) {
    const module = await import(url)
    const component = module[name]
    if (typeof component !== 'function') throw new Error(`Missing client entry ${url}#${name}`)
    return component
  },
})

app.addEventListener('error', (event) => console.error(event.error))

await app.ready()
document.documentElement.dataset.starterReady = 'true'

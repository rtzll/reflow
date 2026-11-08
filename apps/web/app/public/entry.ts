import { run } from 'remix/component'
import { enhanceShowcase } from '../ui/showcase-client.ts'

const app = run({
  async loadModule(moduleUrl, exportName) {
    const module = await import(moduleUrl)
    const component = module[exportName]
    if (typeof component !== 'function')
      throw new Error(`Missing client entry ${moduleUrl}#${exportName}`)
    return component
  },
})
app.addEventListener('error', (event) => console.error('Reflow component error:', event.error))
await app.ready()
enhanceShowcase()

import { createServer } from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'
import { assets } from './app/assets.ts'
import { router } from './app/router.ts'

const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 44100)
const server = createServer(createRequestListener(router.fetch))
server.listen(port, host, () => console.log(`Reflow is listening on http://${host}:${port}`))

function stop() {
  server.close(() => {
    void assets.close()
  })
  server.closeAllConnections()
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)

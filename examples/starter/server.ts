import { createServer } from 'node:http'
import { createRequestListener } from 'remix/node-fetch-server'
import { assets } from './app/assets.ts'
import { router } from './app/router.ts'

const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 44103)
const server = createServer(createRequestListener(router.fetch))

server.listen(port, host, () => {
  const address = server.address()
  const listeningPort = address && typeof address === 'object' ? address.port : port
  console.log(`Reflow starter is listening on http://${host}:${listeningPort}`)
})

function stop() {
  server.close(() => void assets.close())
  server.closeAllConnections()
}

process.once('SIGINT', stop)
process.once('SIGTERM', stop)

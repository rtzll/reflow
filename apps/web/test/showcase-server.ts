import { createTestServer, type TestServer } from 'remix/node-fetch-server/test'
import { assets } from '../app/assets.ts'
import { router } from '../app/router.ts'

export async function startShowcase(): Promise<TestServer> {
  const server = await createTestServer(router.fetch)
  return {
    baseUrl: server.baseUrl,
    async close() {
      try {
        await server.close()
      } finally {
        await assets.close()
      }
    },
  }
}

let server: TestServer | undefined

export async function globalSetup() {
  server = await startShowcase()
  process.env.REFLOW_TEST_ORIGIN = server.baseUrl
}

export async function globalTeardown() {
  delete process.env.REFLOW_TEST_ORIGIN
  await server?.close()
}

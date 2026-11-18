import { startLocalWorker } from '../tools/local-worker.ts'

let worker: Awaited<ReturnType<typeof startLocalWorker>> | undefined

export async function globalSetup() {
  worker = await startLocalWorker()
  process.env.REFLOW_TEST_ORIGIN = `http://${worker.address}:${worker.port}`
}

export async function globalTeardown() {
  delete process.env.REFLOW_TEST_ORIGIN
  await worker?.stop()
}

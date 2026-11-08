import { afterAll } from 'remix/test'
import { assets } from '../app/assets.ts'

export { router } from '../app/router.ts'

// HTTP servers close through t.serve(); the shared asset watchers need their
// own cleanup so workers can exit without the runner's shutdown timeout.
afterAll(() => assets.close())

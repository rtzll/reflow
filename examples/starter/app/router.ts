import { render } from 'remix/middleware/render'
import { createRouter } from 'remix/router'
import controller from './actions/controller.tsx'
import { assets } from './assets.ts'
import { routes } from './routes.ts'

export const router = createRouter({ middleware: [render({ assets })] })

router.map(routes, controller)

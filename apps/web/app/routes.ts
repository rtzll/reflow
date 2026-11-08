import { get, route } from 'remix/routes'

export const routes = route({
  gallery: get('/'),
  docs: get('/docs'),
  component: get('/docs/:slug'),
  demo: get('/demo'),
  assets: get('/assets/*path'),
})

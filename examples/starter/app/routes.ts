import { get, route } from 'remix/routes'

export const routes = route({
  home: get('/'),
  assets: get('/assets/*path'),
})

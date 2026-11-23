import { get, route } from 'remix/routes'

export const routes = route({
  gallery: get('/'),
  docs: get('/docs'),
  docsMarkdown: get('/docs.md'),
  componentMarkdown: get('/docs/:slug.md'),
  docsIndex: get('/llms.txt'),
  component: get('/docs/:slug'),
  apps: get('/apps'),
  app: get('/apps/:slug'),
  assets: get('/assets/*path'),
})

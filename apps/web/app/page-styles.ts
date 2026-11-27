const fonts = 'app/public/fonts.css'
const site = 'app/public/site.css'

export const showcaseStyles = [
  fonts,
  '../../packages/reflow/dist/styles.css',
  site,
  'app/public/examples.css',
]

// Admin uses core controls and ObjectInspector. Its app stylesheet covers its layout.
export const adminStyles = [
  fonts,
  '../../packages/reflow/dist/core.css',
  '../../packages/reflow/dist/code.css',
  site,
]

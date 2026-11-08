export interface GoogleFont {
  n: string
  w?: number[]
  a?: { wght?: [number, number]; opsz?: [number, number] }
  i?: 1
  c?: 's' | 'a' | 'd' | 'h' | 'm'
}

export const fontCategories = {
  s: 'Serif',
  a: 'Sans serif',
  d: 'Display',
  h: 'Handwriting',
  m: 'Monospace',
} as const
export const popularFonts = [
  'Playfair Display',
  'Fraunces',
  'Instrument Serif',
  'DM Serif Display',
  'Newsreader',
  'Literata',
  'Lora',
  'EB Garamond',
  'Bricolage Grotesque',
  'Space Grotesk',
  'Manrope',
  'DM Sans',
  'Syne',
  'Montserrat',
  'Poppins',
]

export function fontStylesheet(font: GoogleFont) {
  const tags: string[] = []
  const ranges: string[] = []
  if (font.i) {
    tags.push('ital')
    ranges.push('1')
  }
  if (font.a?.opsz) {
    tags.push('opsz')
    ranges.push(font.a.opsz.join('..'))
  }
  let axis = ''
  if (font.a?.wght) {
    tags.push('wght')
    ranges.push(font.a.wght.join('..'))
    axis = `:${tags.join(',')}@${ranges.join(',')}`
  } else if (font.w || font.i) {
    tags.push('wght')
    axis = `:${tags.join(',')}@${(font.w ?? [400]).map((weight) => [...ranges, weight].join(',')).join(';')}`
  }
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.n).replace(/%20/g, '+')}${axis}&display=swap`
}

export function fontWeights(font: GoogleFont) {
  if (!font.a?.wght) return font.w ?? [400]
  const [min, max] = font.a.wght
  const weights = Array.from({ length: 10 }, (_, index) => (index + 1) * 100).filter(
    (weight) => weight >= min && weight <= max,
  )
  return weights.length ? weights : [min]
}

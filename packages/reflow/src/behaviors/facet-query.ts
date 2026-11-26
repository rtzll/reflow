export interface FacetToken {
  key: string
  value: string
}

export interface ParsedFacetQuery {
  facets: FacetToken[]
  freeText: string
  regex: RegExp | null
  regexError: boolean
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Parses a structured query containing `key:value` facet tokens and optional
 * free-text or regular-expression terms. Never throws on invalid regexes.
 */
export function parseFacetQuery(
  raw: string,
  regexMode = false,
  caseSensitive = false,
): ParsedFacetQuery {
  const facets: FacetToken[] = []
  const freeParts: string[] = []
  const trimmed = raw.trim()

  if (!trimmed) {
    return { facets, freeText: '', regex: null, regexError: false }
  }

  for (const token of trimmed.split(/\s+/)) {
    const colon = token.indexOf(':')
    if (!regexMode && colon > 0 && colon < token.length - 1) {
      const key = token.slice(0, colon).toLowerCase()
      const value = token.slice(colon + 1)
      if (/^[a-z0-9_.-]+$/i.test(key)) {
        facets.push({ key, value })
        continue
      }
    }
    freeParts.push(token)
  }

  const freeText = freeParts.join(' ')
  if (!freeText) {
    return { facets, freeText: '', regex: null, regexError: false }
  }

  try {
    const pattern = regexMode ? freeText : escapeRegExp(freeText)
    const flags = caseSensitive ? 'g' : 'gi'
    return { facets, freeText, regex: new RegExp(pattern, flags), regexError: false }
  } catch {
    return { facets, freeText, regex: null, regexError: true }
  }
}

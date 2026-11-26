export type MarkdownFormatAction =
  | 'bold'
  | 'italic'
  | 'code'
  | 'codeblock'
  | 'mermaid'
  | 'suggestion'
  | 'link'
  | 'list'

export interface MarkdownFormatResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

function clamp(index: number, max: number): number {
  return Math.max(0, Math.min(max, Number.isFinite(index) ? Math.trunc(index) : 0))
}

/**
 * Applies a Markdown formatting action to `text` for the selection range
 * `[start, end]`, returning the updated text and next caret selection bounds.
 */
export function applyMarkdownFormat(
  text: string,
  rawStart: number,
  rawEnd: number,
  action: MarkdownFormatAction,
): MarkdownFormatResult {
  const len = text.length
  const s = clamp(Math.min(rawStart, rawEnd), len)
  const e = clamp(Math.max(rawStart, rawEnd), len)
  const before = text.slice(0, s)
  const selected = text.slice(s, e)
  const after = text.slice(e)

  function wrap(prefix: string, suffix: string, fallback: string): MarkdownFormatResult {
    const inner = selected || fallback
    const value = `${before}${prefix}${inner}${suffix}${after}`
    return {
      value,
      selectionStart: s + prefix.length,
      selectionEnd: s + prefix.length + inner.length,
    }
  }

  const leadingNewline = before.length > 0 && !before.endsWith('\n') ? '\n\n' : ''
  const trailingNewline = after.length > 0 && !after.startsWith('\n') ? '\n\n' : ''

  switch (action) {
    case 'bold':
      return wrap('**', '**', 'bold text')
    case 'italic':
      return wrap('_', '_', 'italic text')
    case 'code':
      return wrap('`', '`', 'code')
    case 'link': {
      const label = selected || 'link text'
      const prefix = '['
      const mid = '](https://)'
      const value = `${before}${prefix}${label}${mid}${after}`
      const urlStart = s + prefix.length + label.length + 2
      return { value, selectionStart: urlStart, selectionEnd: urlStart + 'https://'.length }
    }
    case 'list': {
      const lines = (selected || 'Item')
        .split('\n')
        .map((line) => (line.startsWith('- ') ? line : `- ${line}`))
      const inserted = lines.join('\n')
      return {
        value: `${before}${inserted}${after}`,
        selectionStart: s,
        selectionEnd: s + inserted.length,
      }
    }
    case 'codeblock': {
      const inner = selected || '// code'
      const prefix = `${leadingNewline}\`\`\`ts\n`
      const suffix = `\n\`\`\`${trailingNewline}`
      const value = `${before}${prefix}${inner}${suffix}${after}`
      return {
        value,
        selectionStart: s + prefix.length,
        selectionEnd: s + prefix.length + inner.length,
      }
    }
    case 'mermaid': {
      const inner = selected || 'flowchart LR\n  A[Client] --> B[Server]'
      const prefix = `${leadingNewline}\`\`\`mermaid\n`
      const suffix = `\n\`\`\`${trailingNewline}`
      const value = `${before}${prefix}${inner}${suffix}${after}`
      return {
        value,
        selectionStart: s + prefix.length,
        selectionEnd: s + prefix.length + inner.length,
      }
    }
    case 'suggestion': {
      const inner = selected || 'const result = nextValue'
      const prefix = `${leadingNewline}\`\`\`suggestion\n`
      const suffix = `\n\`\`\`${trailingNewline}`
      const value = `${before}${prefix}${inner}${suffix}${after}`
      return {
        value,
        selectionStart: s + prefix.length,
        selectionEnd: s + prefix.length + inner.length,
      }
    }
  }
}

export interface AnsiSpan {
  text: string
  color?: string
  bold?: boolean
  dim?: boolean
  italic?: boolean
  underline?: boolean
}

const ANSI_COLORS: Record<number, string> = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  90: 'bright-black',
  91: 'red',
  92: 'green',
  93: 'yellow',
  94: 'blue',
  95: 'magenta',
  96: 'cyan',
  97: 'white',
}

// Matches ANSI CSI sequences (including SGR color codes), OSC sequences,
// and VT100-aborted escape prefixes immediately interrupted by another ESC.
const ANSI_PATTERN =
  // oxlint-disable-next-line no-control-regex
  /\x1b(?:\[([0-9;]*)([A-Za-z])|\][^\x07\x1b]*(?:\x07|\x1b\\)|(?:\[[0-9;]*)?(?=\x1b))/g

/** Removes ANSI escape codes so copied output or search queries match plain text. */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '')
}

/** Parses one terminal line's ANSI SGR escape sequences into styled spans. */
export function parseAnsiLine(line: string): AnsiSpan[] {
  const spans: AnsiSpan[] = []
  let color: string | undefined
  let bold = false
  let dim = false
  let italic = false
  let underline = false
  let lastIndex = 0

  ANSI_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = ANSI_PATTERN.exec(line)) !== null) {
    if (match.index > lastIndex) {
      spans.push({
        text: line.slice(lastIndex, match.index),
        ...(color ? { color } : {}),
        ...(bold ? { bold } : {}),
        ...(dim ? { dim } : {}),
        ...(italic ? { italic } : {}),
        ...(underline ? { underline } : {}),
      })
    }
    lastIndex = match.index + match[0].length
    const params = match[1]
    const finalByte = match[2]
    if (finalByte !== 'm') continue
    const codes = params ? params.split(';').map((n) => (n === '' ? 0 : Number(n))) : [0]
    for (const code of codes) {
      if (code === 0) {
        color = undefined
        bold = false
        dim = false
        italic = false
        underline = false
      } else if (code === 1) {
        bold = true
      } else if (code === 2) {
        dim = true
      } else if (code === 3) {
        italic = true
      } else if (code === 4) {
        underline = true
      } else if (code === 22) {
        bold = false
        dim = false
      } else if (code === 23) {
        italic = false
      } else if (code === 24) {
        underline = false
      } else if (code === 39) {
        color = undefined
      } else if (code in ANSI_COLORS) {
        color = ANSI_COLORS[code]
      }
    }
  }

  if (lastIndex < line.length) {
    spans.push({
      text: line.slice(lastIndex),
      ...(color ? { color } : {}),
      ...(bold ? { bold } : {}),
      ...(dim ? { dim } : {}),
      ...(italic ? { italic } : {}),
      ...(underline ? { underline } : {}),
    })
  }
  return spans.length > 0 ? spans : [{ text: '' }]
}

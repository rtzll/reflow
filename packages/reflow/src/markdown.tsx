import { Lexer, type Token, type Tokens } from 'marked'
import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { applyMarkdownFormat, type MarkdownFormatAction } from './behaviors/markdown-format.ts'
import { Button } from './button.tsx'
import { CodeBlock } from './code-block.tsx'
import { Kbd } from './kbd.tsx'
import { SegmentedControl } from './segmented-control.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table.tsx'
import {
  TriggerMenu,
  type TriggerMenuFieldProps,
  type TriggerMenuTrigger,
} from './trigger-menu.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface MarkdownCodeBlock {
  /** Raw code inside the fenced or indented block. */
  code: string
  /** Optional language tag from the opening fence (e.g. `'ts'`, `'mermaid'`). */
  language?: string
  /** Surrounding density inherited from `Markdown`. */
  size?: ControlSize
}

export interface MarkdownProps {
  /** Markdown source, including partial text while a reply is streaming. */
  source: string
  /** Overrides the surrounding type density. */
  size?: ControlSize
  /** Additional class on the rendered container. */
  class?: string
  /**
   * Which images load inline. By default every image is a link, so rendering
   * loads nothing. `true` loads same-site paths; a function decides for each
   * safe source. Refused images stay links.
   */
  images?: boolean | ((src: string) => boolean)
  /**
   * Optional renderer for fenced code blocks (for example to render `mermaid`
   * fences with `<Diagram>` from `@rtzll/reflow/diagrams`). Returning `undefined`
   * falls back to the default `CodeBlock`.
   */
  renderCodeBlock?: (block: MarkdownCodeBlock) => RemixNode | undefined
}

/** CommonMark and GitHub Flavored Markdown, with CodeBlock fences and Table for pipe tables. */
export function Markdown(handle: Handle<MarkdownProps>) {
  return () => {
    const context: Context = {
      size: handle.props.size,
      prefix: handle.id,
      tasks: 0,
      images: handle.props.images,
      renderCodeBlock: handle.props.renderCodeBlock,
    }
    return (
      <div
        class={classList('rf-markdown', handle.props.class)}
        data-slot="markdown"
        data-size={handle.props.size}
      >
        {blocks(new Lexer({ gfm: true }).lex(handle.props.source), context)}
      </div>
    )
  }
}

// What every block needs from the instance: the density for CodeBlock and Table, and a
// prefix and counter for task label IDs, so several replies can share a page.
interface Context {
  size: ControlSize | undefined
  prefix: string
  tasks: number
  images: MarkdownProps['images']
  renderCodeBlock: MarkdownProps['renderCodeBlock']
}

// Whether a safe, decoded image source may load: same-site paths for `true`,
// the app's own rule for a function.
function loads(src: string, images: MarkdownProps['images']) {
  if (typeof images === 'function') return images(src)
  return images === true && src.startsWith('/')
}

// Only web, mail, same-site path and fragment links. marked leaves character references
// in destinations, so callers check the decoded URL: `/&#x2f;host` must not become `//host`.
function safeUrl(url: string) {
  return (
    /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i.test(url) &&
    !url.includes('\\') &&
    !Array.from(url).some((char) => {
      const code = char.charCodeAt(0)
      return code < 32 || code === 127
    })
  )
}

// marked decodes numeric character references but leaves named ones to an HTML parser.
// Remix renders text literally, so decode the common named references here.
const named: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  bull: '•',
  middot: '·',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  euro: '€',
  pound: '£',
  yen: '¥',
  cent: '¢',
  sect: '§',
  para: '¶',
  shy: '\u00ad',
  larr: '←',
  rarr: '→',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
  check: '✓',
}
function decode(text: string) {
  return text.replace(/&(#\d+|#x[\da-f]+|[a-z][a-z\d]*);/gi, (reference, name: string) => {
    if (name[0] !== '#') return named[name] ?? reference
    const code = /^#x/i.test(name) ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1))
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : reference
  })
}

// The decoded destination when it is safe to link to, otherwise undefined.
function href(url: string) {
  const decoded = decode(url)
  return safeUrl(decoded) ? decoded : undefined
}

function blocks(tokens: readonly Token[], context: Context): RemixNode[] {
  return tokens.map((token, key) => block(token, key, context))
}

function block(token: Token, key: number, context: Context): RemixNode {
  switch (token.type) {
    case 'space':
      return null
    // marked has no footnotes and reads `[^1]: Note` as a link definition. Keep the note
    // visible as text instead of dropping it.
    case 'def':
      return (token as Tokens.Def).tag.startsWith('^') ? (
        <p key={key}>{token.raw.replace(/\n+$/, '')}</p>
      ) : null
    case 'heading': {
      const Heading = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)[token.depth - 1]!
      return <Heading key={key}>{inline(token.tokens ?? [], context)}</Heading>
    }
    case 'paragraph': {
      const only = token.tokens?.length === 1 ? token.tokens[0] : undefined
      // An image alone in its paragraph shows as a block.
      const image =
        only?.type === 'image' &&
        !!context.images &&
        !!href(only.href) &&
        loads(href(only.href)!, context.images)
      return (
        <p key={key} data-image={image || undefined}>
          {inline(token.tokens ?? [], context)}
        </p>
      )
    }
    // Unwrapped text in a tight list item.
    case 'text':
      return token.tokens ? inline(token.tokens, context) : decode(token.text)
    case 'code': {
      const language = (token.lang ?? '').trim().split(/\s+/)[0] || undefined
      const custom = context.renderCodeBlock?.({
        code: token.text,
        language,
        size: context.size,
      })
      if (custom !== undefined) return <div key={key}>{custom}</div>
      return <CodeBlock key={key} size={context.size} code={token.text} language={language} />
    }
    case 'blockquote':
      return <blockquote key={key}>{blocks(token.tokens ?? [], context)}</blockquote>
    case 'list': {
      const list = token as Tokens.List
      const items = list.items.map((entry, index) => item(entry, index, context))
      return list.ordered ? (
        <ol key={key} start={list.start === '' || list.start === 1 ? undefined : list.start}>
          {items}
        </ol>
      ) : (
        <ul key={key}>{items}</ul>
      )
    }
    case 'hr':
      return <hr key={key} />
    case 'table':
      return table(token as Tokens.Table, key, context)
    // Raw HTML stays visible as text. An HTML block reads as its own paragraph.
    case 'html':
      return <p key={key}>{token.text.replace(/\n+$/, '')}</p>
    default:
      return 'raw' in token ? token.raw : null
  }
}

// Tasks get a read-only checkbox beside the item's content, labelled by the item's first
// line: a paragraph in a loose list, a span around the bare text in a tight one.
function item(entry: Tokens.ListItem, key: number, context: Context): RemixNode {
  const tokens = entry.tokens.filter((token) => token.type !== 'checkbox')
  if (!entry.task) return <li key={key}>{blocks(tokens, context)}</li>
  const id = `${context.prefix}-task-${context.tasks++}`
  const first = tokens[0]
  const label =
    first?.type === 'paragraph' ? (
      <p key={0} id={id}>
        {inline(first.tokens ?? [], context)}
      </p>
    ) : first?.type === 'text' ? (
      <span key={0} id={id}>
        {first.tokens ? inline(first.tokens, context) : decode(first.text)}
      </span>
    ) : null
  return (
    <li key={key} class="rf-markdown-task">
      <input type="checkbox" disabled checked={entry.checked === true} aria-labelledby={id} />
      <div id={label ? undefined : id}>
        {tokens.map((token, index) =>
          index === 0 && label ? label : block(token, index, context),
        )}
      </div>
    </li>
  )
}

function table(token: Tokens.Table, key: number, context: Context): RemixNode {
  const style = (column: number) => {
    const align = token.align[column]
    return align ? { textAlign: align } : undefined
  }
  return (
    <Table key={key} size={context.size} fluidHover={false}>
      <TableHeader>
        <TableRow hover={false}>
          {token.header.map((cell, column) => (
            <TableHead key={column} style={style(column)}>
              {inline(cell.tokens, context)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {token.rows.map((row, index) => (
          <TableRow key={index} hover={false}>
            {row.map((cell, column) => (
              <TableCell key={column} style={style(column)}>
                {inline(cell.tokens, context)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function inline(tokens: readonly Token[], context: Context): RemixNode[] {
  return tokens.map((token, key): RemixNode => {
    switch (token.type) {
      case 'text':
        return token.tokens ? inline(token.tokens, context) : decode(token.text)
      case 'escape':
        return token.text
      case 'strong':
        return <strong key={key}>{inline(token.tokens ?? [], context)}</strong>
      case 'em':
        return <em key={key}>{inline(token.tokens ?? [], context)}</em>
      case 'del':
        return <del key={key}>{inline(token.tokens ?? [], context)}</del>
      // Code spans are literal, character references included.
      case 'codespan':
        return <code key={key}>{token.text}</code>
      case 'br':
        return <br key={key} />
      case 'link': {
        // A footnote reference, `[^1]`, stays literal like its note.
        if (/^\[\^[^\]]+\]$/.test(token.raw)) return token.raw
        const url = href(token.href)
        return url ? (
          <a key={key} href={url} title={token.title ? decode(token.title) : undefined}>
            {inline(token.tokens ?? [], context)}
          </a>
        ) : (
          inline(token.tokens ?? [], context)
        )
      }
      // Images show as links unless the app lets their source load, so by
      // default Markdown loads nothing.
      case 'image': {
        const alt = decode(token.text)
        const label = alt || token.href
        const url = href(token.href)
        if (url && context.images && loads(url, context.images))
          return (
            <img
              key={key}
              src={url}
              alt={alt}
              title={token.title ? decode(token.title) : undefined}
              aria-hidden={alt ? undefined : 'true'}
              loading="lazy"
              decoding="async"
            />
          )
        return url ? (
          <a key={key} href={url}>
            {label}
          </a>
        ) : (
          label
        )
      }
      // Inline raw HTML stays visible as text.
      case 'html':
        return token.text
      // A loose task's marker sits in its first paragraph; item() renders the checkbox.
      case 'checkbox':
        return null
      default:
        return 'raw' in token ? token.raw : null
    }
  })
}

export type MarkdownEditorMode = 'write' | 'preview' | 'split'

export interface MarkdownEditorProps {
  /** Controlled Markdown value. */
  value?: string
  /** Initial Markdown value when uncontrolled. */
  defaultValue?: string
  /** Called whenever the editor text changes. */
  onValueChange?: (value: string) => void
  /** Controlled view mode (`'write' | 'preview' | 'split'`). */
  mode?: MarkdownEditorMode
  /** Initial view mode when uncontrolled. Default `'write'`. */
  defaultMode?: MarkdownEditorMode
  /** Called when the user switches between Write, Preview, and Split modes. */
  onModeChange?: (mode: MarkdownEditorMode) => void
  /** Shows the Split view option beside Write and Preview. Default `true`. */
  allowSplit?: boolean
  /** Shows the Markdown formatting toolbar (bold, italic, code, mermaid, suggestion, etc.). Default `true`. */
  toolbar?: boolean
  /** Optional caret triggers (`@mentions`, `#refs`, `/commands`) powered by `TriggerMenu`. */
  triggers?: readonly TriggerMenuTrigger[]
  /** Optional code fence renderer passed to `Markdown` preview (e.g. Pele `<Diagram>` for `mermaid` fences). */
  renderCodeBlock?: MarkdownProps['renderCodeBlock']
  /** Image loading policy passed to `Markdown` preview. */
  images?: MarkdownProps['images']
  /** Placeholder text in the textarea. */
  placeholder?: string
  /** Accessible name for the textarea. Default `'Markdown editor'`. */
  label?: string
  /** Minimum visible rows for the textarea. Default `5`. */
  minRows?: number
  /** Message shown in Preview mode when the editor is empty. Default `'Nothing to preview yet.'`. */
  emptyPreview?: string
  /** Label for the submit button when `onSubmit` is provided. Default `'Comment'`. */
  submitLabel?: string
  /** Called on submit button click or `Mod+Enter` shortcut when content is non-empty. */
  onSubmit?: (value: string) => void
  /** Disables editing and submission. */
  disabled?: boolean
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

const TOOLBAR_ACTIONS: readonly { action: MarkdownFormatAction; label: string; title: string }[] = [
  { action: 'bold', label: 'B', title: 'Bold' },
  { action: 'italic', label: 'I', title: 'Italic' },
  { action: 'code', label: '`c`', title: 'Inline code' },
  { action: 'codeblock', label: '```', title: 'Code block' },
  { action: 'mermaid', label: 'Mermaid', title: 'Insert Mermaid diagram' },
  { action: 'suggestion', label: 'Suggest', title: 'Insert code suggestion' },
  { action: 'link', label: 'Link', title: 'Insert link' },
  { action: 'list', label: 'List', title: 'Bullet list' },
]

/**
 * Markdown discussion composer with Write / Preview / Split modes, a formatting
 * toolbar (including Mermaid & code suggestion snippets), optional `TriggerMenu`
 * caret mentions, live `Markdown` preview, and `Mod+Enter` submission.
 */
export function MarkdownEditor(handle: Handle<MarkdownEditorProps>) {
  let uncontrolledValue = handle.props.defaultValue ?? ''
  let uncontrolledMode: MarkdownEditorMode = handle.props.defaultMode ?? 'write'
  let textareaEl: HTMLTextAreaElement | null = null

  function currentValue(): string {
    return handle.props.value !== undefined ? handle.props.value : uncontrolledValue
  }

  function currentMode(): MarkdownEditorMode {
    return handle.props.mode !== undefined ? handle.props.mode : uncontrolledMode
  }

  function setValue(next: string) {
    if (handle.props.value === undefined) uncontrolledValue = next
    handle.props.onValueChange?.(next)
    void handle.update()
  }

  function setMode(next: MarkdownEditorMode) {
    if (handle.props.mode === undefined) uncontrolledMode = next
    handle.props.onModeChange?.(next)
    void handle.update()
  }

  const mountTextarea = ref<HTMLTextAreaElement>((node) => {
    textareaEl = node
  })

  return () => {
    const props = handle.props
    const value = currentValue()
    const mode = currentMode()
    const showWrite = mode === 'write' || mode === 'split'
    const showPreview = mode === 'preview' || mode === 'split'
    const allowSplit = props.allowSplit ?? true

    function runFormat(action: MarkdownFormatAction) {
      if (props.disabled) return
      const start = textareaEl?.selectionStart ?? value.length
      const end = textareaEl?.selectionEnd ?? value.length
      const result = applyMarkdownFormat(value, start, end, action)
      setValue(result.value)
      if (mode === 'preview') setMode('write')
      queueMicrotask(() => {
        if (!textareaEl) return
        textareaEl.focus()
        textareaEl.setSelectionRange(result.selectionStart, result.selectionEnd)
      })
    }

    function submit() {
      if (props.disabled || !value.trim()) return
      props.onSubmit?.(value)
    }

    const modeOptions = [
      { value: 'write', label: 'Write' },
      { value: 'preview', label: 'Preview' },
      ...(allowSplit ? [{ value: 'split', label: 'Split' }] : []),
    ]

    const renderTextarea = (fieldProps?: TriggerMenuFieldProps) => {
      const { mix: triggerMix, ...restFieldProps } = fieldProps ?? {}
      const triggerMixes = triggerMix ? (Array.isArray(triggerMix) ? triggerMix : [triggerMix]) : []
      return (
        <textarea
          {...restFieldProps}
          class="rf-md-editor-textarea"
          aria-label={props.label ?? 'Markdown editor'}
          placeholder={props.placeholder ?? 'Write Markdown… Use **bold**, `code`, or ```mermaid'}
          rows={props.minRows ?? 5}
          value={value}
          disabled={props.disabled}
          mix={[
            ...triggerMixes,
            mountTextarea,
            on<HTMLTextAreaElement, 'input'>('input', (event) => {
              setValue(event.currentTarget.value)
            }),
            on<HTMLTextAreaElement, 'keydown'>('keydown', (event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && props.onSubmit) {
                event.preventDefault()
                submit()
              }
            }),
          ]}
        />
      )
    }

    return (
      <div
        class={classList('rf-md-editor', props.class)}
        data-mode={mode}
        data-size={props.size === 'compact' ? 'compact' : undefined}
      >
        <div class="rf-md-editor-head">
          <SegmentedControl
            label="Editor mode"
            size="compact"
            value={mode}
            options={modeOptions}
            onValueChange={(next) => {
              setMode(next === 'preview' ? 'preview' : next === 'split' ? 'split' : 'write')
            }}
          />

          {(props.toolbar ?? true) && (
            <div class="rf-md-editor-toolbar" role="toolbar" aria-label="Markdown formatting">
              {TOOLBAR_ACTIONS.map((item) => (
                <button
                  key={item.action}
                  type="button"
                  class="rf-md-editor-tool"
                  title={item.title}
                  aria-label={item.title}
                  disabled={props.disabled || mode === 'preview'}
                  mix={on('click', () => runFormat(item.action))}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div class="rf-md-editor-body">
          {showWrite && (
            <div class="rf-md-editor-write">
              {props.triggers && props.triggers.length > 0 ? (
                <TriggerMenu
                  triggers={props.triggers}
                  renderField={(fieldProps) => renderTextarea(fieldProps)}
                />
              ) : (
                renderTextarea()
              )}
            </div>
          )}

          {showPreview && (
            <div class="rf-md-editor-preview" aria-label="Markdown preview">
              {value.trim() ? (
                <Markdown
                  source={value}
                  size={props.size}
                  images={props.images}
                  renderCodeBlock={props.renderCodeBlock}
                />
              ) : (
                <p class="rf-md-editor-empty">{props.emptyPreview ?? 'Nothing to preview yet.'}</p>
              )}
            </div>
          )}
        </div>

        {props.onSubmit && (
          <div class="rf-md-editor-footer">
            <span class="rf-md-editor-hint">
              <span>Markdown & Mermaid supported ·</span>
              <Kbd size="compact" variant="outline" keys="mod+enter" />
              <span>to submit</span>
            </span>
            <Button
              size="compact"
              variant="primary"
              disabled={props.disabled || !value.trim()}
              mix={on('click', submit)}
            >
              {props.submitLabel ?? 'Comment'}
            </Button>
          </div>
        )}
      </div>
    )
  }
}

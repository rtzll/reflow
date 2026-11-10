import { CodeBlock, SegmentedControl, type HighlightedCode } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { playCopySuccess } from './showcase-sound.ts'

/** Highlighted on the server by code-samples.ts, keyed by sample name. */
export type CodeSamples = Record<string, HighlightedCode>

/** The samples one docs preview shows, so each preview carries only its own. */
export function samplesFor(all: CodeSamples, variant: string | undefined): CodeSamples {
  const names =
    variant === undefined || variant === 'languages'
      ? Object.keys(all).filter((name) => name.startsWith('lang-'))
      : [variant === 'gallery' ? 'card' : variant]
  return Object.fromEntries(names.filter((name) => name in all).map((name) => [name, all[name]!]))
}

export const codeLanguages = ['tsx', 'css', 'bash', 'json', 'python', 'rust'] as const

interface CardProps {
  source: HighlightedCode
}

/** The gallery card: a CodeBlock showing the code that renders it. */
export function CodeBlockCard(handle: Handle<CardProps>) {
  return () => (
    <CodeBlock
      code={handle.props.source} // [!code highlight]
      filename="code-block-example.tsx"
      lineNumbers
      wrap
      size="compact"
    />
  )
}

function Languages(handle: Handle<{ samples: CodeSamples; size?: 'default' | 'compact' }>) {
  let language: string = codeLanguages[0]
  return () => (
    <div class="doc-code-languages">
      <SegmentedControl
        label="Language"
        size={handle.props.size}
        value={language}
        onValueChange={(value) => {
          language = value
          void handle.update()
        }}
        options={codeLanguages.map((value) => ({ value, label: value }))}
      />
      <CodeBlock
        onCopy={playCopySuccess}
        code={handle.props.samples[`lang-${language}`] ?? ''}
        size={handle.props.size}
      />
    </div>
  )
}

export interface CodeBlockDemoProps {
  variant: string
  samples?: CodeSamples
  size?: 'default' | 'compact'
  language?: string
  filename?: boolean
  lineNumbers?: boolean
  wrap?: boolean
  copyable?: boolean
}

/** The CodeBlock docs demos and playground, rendering code highlighted on the server. */
export function CodeBlockDemo(handle: Handle<CodeBlockDemoProps>) {
  return () => {
    const { variant, size } = handle.props
    const samples = handle.props.samples ?? {}
    const sample = (name: string) => samples[name] ?? ''
    switch (variant) {
      case 'notation':
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={sample('notation')}
            filename="cart.ts"
            size={size}
          />
        )
      case 'focus':
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={sample('focus')}
            filename="route.tsx"
            size={size}
          />
        )
      case 'line-numbers':
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={sample('line-numbers')}
            filename="code-block.css"
            lineNumbers
            startLine={42}
            size={size}
          />
        )
      case 'languages':
        return <Languages samples={samples} size={size} />
      case 'folded':
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={sample('folded')}
            filename="highlight.ts"
            lineNumbers
            maxLines={8}
            size={size}
          />
        )
      case 'wrap':
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={sample('wrap')}
            language="md"
            wrap
            size={size}
          />
        )
      case 'plain':
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={'pnpm add --save-exact @rtzll/reflow remix\npnpm add shiki @shikijs/transformers'}
            language="bash"
            size={size}
          />
        )
      case 'themes':
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={sample('themes')}
            filename="theme.ts"
            size={size}
          />
        )
      case 'gallery':
        return <CodeBlockCard source={sample('card') as HighlightedCode} />
      case 'playground': {
        const language = handle.props.language ?? 'tsx'
        const extension = {
          tsx: 'tsx',
          css: 'css',
          bash: 'sh',
          json: 'json',
          python: 'py',
          rust: 'rs',
        }[language]
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={sample(`lang-${language}`)}
            filename={handle.props.filename ? `example.${extension ?? language}` : undefined}
            lineNumbers={handle.props.lineNumbers}
            wrap={handle.props.wrap}
            copyable={handle.props.copyable}
            size={size}
          />
        )
      }
      default:
        return (
          <CodeBlock
            onCopy={playCopySuccess}
            code={sample('basic')}
            filename="route.tsx"
            size={size}
          />
        )
    }
  }
}

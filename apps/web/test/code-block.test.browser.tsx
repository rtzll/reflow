import { CodeBlock, type HighlightedCode } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { describe, it } from 'remix/test'

async function waitFor(check: () => boolean, frames = 60) {
  for (let i = 0; i < frames; i++) {
    if (check()) return
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  ok(check(), 'Expected code block state did not settle')
}

// What highlight() returns for a short diff, written out by hand: browser
// tests stay free of Shiki.
const diff: HighlightedCode = {
  lang: 'ts',
  code: 'const a = 1\nconst b = 2\nconst c = 3\nfocus()',
  flags: ['has-diff', 'has-highlighted', 'has-focused'],
  lines: [
    {
      class: 'highlighted',
      tokens: [
        { content: 'const', style: 'color:var(--rf-code-token-keyword)' },
        { content: ' a = 1' },
      ],
    },
    { class: 'diff add', tokens: [{ content: 'const b = 2' }] },
    { class: 'diff remove', tokens: [{ content: 'const c = 3' }] },
    {
      class: 'focused',
      tokens: [{ content: 'focus', class: 'highlighted-word' }, { content: '()' }],
    },
  ],
}

describe('CodeBlock', () => {
  it('shows plain code with its language, in a labelled scrollable region', async (t) => {
    const { $, $$, cleanup } = render(<CodeBlock code={'let x = 1\nlet y = 2'} language="js" />)
    t.after(cleanup)
    const root = $('[data-slot="code-block"]') as HTMLElement
    equal(root.querySelector('.rf-code-language')?.textContent, 'js')
    equal($$('.rf-code-line').length, 2)
    equal(root.querySelector('code')?.textContent, 'let x = 1\nlet y = 2')
    const region = root.querySelector('[role="region"]') as HTMLElement
    equal(region.getAttribute('aria-label'), 'js code')
    equal(region.tabIndex, 0)
  })

  it('names the block by its file and copies the code it shows', async (t) => {
    const copied: string[] = []
    const writeText = navigator.clipboard.writeText
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: async (text: string) => void copied.push(text),
    })
    t.after(() =>
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: writeText,
      }),
    )
    let callbacks = 0
    const { $, cleanup } = render(
      <CodeBlock code={diff} filename="math.ts" onCopy={() => callbacks++} />,
    )
    t.after(cleanup)
    const root = $('[data-slot="code-block"]') as HTMLElement
    equal(root.querySelector('.rf-code-filename')?.textContent, 'math.ts')
    equal(root.querySelector('[role="region"]')?.getAttribute('aria-label'), 'math.ts')
    const copy = root.querySelector('button.rf-code-copy') as HTMLButtonElement
    equal(copy.getAttribute('aria-label'), 'Copy code')
    copy.click()
    await waitFor(() => root.dataset.state === 'copied')
    equal(copied.join(), diff.code)
    equal(callbacks, 1)
    equal(copy.getAttribute('aria-label'), 'Copied')
    equal(root.querySelector('[aria-live="polite"]')?.textContent, 'Copied')
  })

  it('renders highlighted tokens and marks highlighted, diff and focused lines', async (t) => {
    const { $, $$, cleanup } = render(<CodeBlock code={diff} />)
    t.after(cleanup)
    const root = $('[data-slot="code-block"]') as HTMLElement
    ok(root.hasAttribute('data-has-diff'))
    ok(root.hasAttribute('data-has-focused'))
    ok(root.hasAttribute('data-has-highlighted'))
    const lines = Array.from($$('.rf-code-line')) as HTMLElement[]
    equal(lines.length, 4)
    ok(lines[0]!.classList.contains('highlighted'))
    ok(lines[1]!.matches('.diff.add'))
    ok(lines[2]!.matches('.diff.remove'))
    ok(lines[3]!.classList.contains('focused'))
    equal(lines.map((line) => line.querySelector('.rf-code-mark')?.textContent).join(''), ' +- ')
    const keyword = lines[0]!.querySelector('.rf-code-text > span') as HTMLElement
    equal(keyword.textContent, 'const')
    equal(keyword.style.color, 'var(--rf-code-token-keyword)')
    ok(lines[3]!.querySelector('.highlighted-word'))
    // The markers stay out of the text a reader selects.
    equal(lines[1]!.querySelector('.rf-code-mark')?.getAttribute('aria-hidden'), 'true')
  })

  it('numbers lines from any start, wraps on request, and folds long code', async (t) => {
    const code = Array.from({ length: 12 }, (_, index) => `line ${index + 1}`).join('\n')
    const { $, cleanup } = render(
      <CodeBlock code={code} lineNumbers startLine={10} wrap maxLines={5} />,
    )
    t.after(cleanup)
    const root = $('[data-slot="code-block"]') as HTMLElement
    ok(root.hasAttribute('data-line-numbers'))
    ok(root.hasAttribute('data-wrap'))
    equal(root.style.getPropertyValue('--rf-code-start'), '9')
    equal(root.dataset.collapsed, 'true')
    equal(root.style.getPropertyValue('--rf-code-max-lines'), '5')
    const toggle = root.querySelector('button.rf-code-toggle') as HTMLButtonElement
    equal(toggle.textContent, 'Show all 12 lines')
    equal(toggle.getAttribute('aria-expanded'), 'false')
    toggle.click()
    await waitFor(() => root.dataset.collapsed === 'false')
    equal(toggle.textContent, 'Show less')
    equal(toggle.getAttribute('aria-expanded'), 'true')
  })

  it('leaves short code unfolded and the copy button out when not copyable', async (t) => {
    const { $, cleanup } = render(<CodeBlock code="one line" maxLines={5} copyable={false} />)
    t.after(cleanup)
    const root = $('[data-slot="code-block"]') as HTMLElement
    ok(!root.querySelector('.rf-code-toggle'))
    ok(!root.hasAttribute('data-collapsed'))
    ok(!root.querySelector('.rf-code-copy'))
  })
})

import { Terminal, parseAnsiLine, stripAnsi } from '@rtzll/reflow'
import { deepEqual, equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('parses ANSI SGR colors and strips escape codes cleanly', () => {
  const line = '\x1b[1;32mPASS\x1b[0m \x1b[2m(42ms)\x1b[0m'
  equal(stripAnsi(line), 'PASS (42ms)')
  deepEqual(parseAnsiLine(line), [
    { text: 'PASS', color: 'green', bold: true },
    { text: ' ' },
    { text: '(42ms)', dim: true },
  ])
})

it('renders status, filters lines, and copies ANSI-stripped plain text', async (t) => {
  let copiedText = ''
  const originalClipboard = navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copiedText = text
      },
    },
  })
  t.after(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    })
  })

  const { $, $$, act, cleanup } = render(
    <Terminal
      command="pnpm test"
      status="failed"
      exitCode={1}
      searchable
      lineNumbers
      output={['\x1b[32m✓\x1b[0m parser passes', '\x1b[31m✗\x1b[0m diff border fails']}
    />,
  )
  t.after(cleanup)

  equal($('.rf-terminal')?.getAttribute('data-status'), 'failed')
  equal($('.rf-terminal-status-label')?.textContent, 'Failed (1)')
  equal($$('.rf-terminal-line').length, 2)
  ok($('.rf-term-span[data-color="red"]'))

  const input = $('.rf-terminal-search-input') as HTMLInputElement
  await act(() => {
    input.value = 'border'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  equal($$('.rf-terminal-line').length, 1)
  equal($('.rf-terminal-match-count')?.textContent, '1/2')

  const copyBtn = $('.rf-terminal-copy') as HTMLButtonElement
  await act(() => copyBtn.click())
  equal(copiedText, '✓ parser passes\n✗ diff border fails')
})

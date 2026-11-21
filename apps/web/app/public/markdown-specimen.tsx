import { Button, Switch, Textarea } from '@rtzll/reflow'
import { Markdown } from '@rtzll/reflow/markdown'
import { on, type Handle } from 'remix/component'

const sample = `# Getting started with Reflow

**Runtime** Remix 3 · **Styles** CSS · **License** MIT

## Setup

- [x] Install the type scale and styles
- [x] Add a dropdown and a dialog
- [ ] Move every list to fluid hover
  - [x] Sidebar
  - [ ] Command menu
- [ ] Switch dense screens to compact

## How it moves

Every component shares **three motion tiers**, and hover *glides* to the item under your cursor. A label gains weight without moving its neighbors. The [motion page](/docs/motion) describes the tokens.

> Shared motion keeps the interface feeling consistent.

### What you get

- Native Remix components
  - Accessible keyboard behavior
  - Form-aware controls
- A size ladder of 36px and 28px
- A skill for your coding agent

### Motion tiers

| Speed | Perceived duration | Used for |
| --- | --- | --- |
| fast | 80ms | Hover and focus |
| moderate | 160ms | Menus and tabs |
| slow | 240ms | Dialogs and drawers |

## Install

Install Reflow from npm and serve its stylesheet through Remix. Replace ~~duplicated controls~~ repeated markup with reusable components.

\`\`\`tsx
import { Button } from '@rtzll/reflow'

<Button>Continue</Button>
\`\`\`

### Next steps

1. Read the component examples
2. Install the skill
   1. Let it inspect the project
   2. Apply the relevant guidance
3. Review keyboard and motion behavior

---

Found an issue? Record a reproducible example.
`

export function MarkdownSpecimen(handle: Handle) {
  let source = sample
  let editing = false
  let revision = 0
  return () => (
    <div class="system-markdown-specimen">
      <div class="system-markdown-toolbar">
        <Switch
          label="Edit Markdown"
          checked={editing}
          onCheckedChange={(value) => {
            editing = value
            handle.update()
          }}
        />
        <Button
          variant="ghost"
          size="compact"
          mix={on('click', () => {
            source = sample
            revision++
            handle.update()
          })}
        >
          Reset sample
        </Button>
      </div>
      {editing && (
        <Textarea
          aria-label="Markdown source"
          value={source}
          rows={18}
          spellCheck={false}
          mix={on<HTMLTextAreaElement, 'input'>('input', (event) => {
            source = event.currentTarget.value
            handle.update()
          })}
        />
      )}
      <article key={revision} aria-label="Rendered Markdown">
        <Markdown source={source} />
      </article>
    </div>
  )
}

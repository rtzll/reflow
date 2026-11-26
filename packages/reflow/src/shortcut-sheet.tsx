import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { attachKeymap } from './behaviors/keymap.ts'
import { Dialog } from './dialog.tsx'
import { Input } from './input.tsx'
import { Kbd } from './kbd.tsx'
import { classList, type ControlSize } from './systems/styling.ts'

export interface ShortcutSheetItem {
  /** Single shortcut (`'mod+k'`, `'j'`) or multi-key chord (`['g', 'p']`). */
  keys: string | readonly string[]
  /** Action label shown beside the keycaps. */
  label: string
  /** Optional section heading; defaults to `'General'`. */
  group?: string
  /** Optional supporting detail. */
  description?: string
}

export interface ShortcutSheetProps {
  /** Shortcuts displayed and searchable inside the sheet. */
  shortcuts: readonly ShortcutSheetItem[]
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called whenever the sheet opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Optional visible trigger rendered inline (such as a button). */
  trigger?: RemixNode
  /** Global hotkey that toggles the sheet outside editable fields. Default `'?'`. Pass `false` to disable. */
  hotkey?: string | false
  /** Dialog heading. Default `'Keyboard shortcuts'`. */
  title?: string
  /** Shows a search input to filter shortcuts. Default `true`. */
  searchable?: boolean
  /** Controls spacing and typography scale. */
  size?: ControlSize
  class?: string
}

/**
 * Searchable keyboard shortcut reference dialog with grouped chord display and
 * optional global `?` toggle hotkey.
 */
export function ShortcutSheet(handle: Handle<ShortcutSheetProps>) {
  let uncontrolledOpen = Boolean(handle.props.defaultOpen)
  let query = ''

  function isOpen(): boolean {
    return handle.props.open !== undefined ? handle.props.open : uncontrolledOpen
  }

  function setOpen(next: boolean) {
    if (handle.props.open === undefined) uncontrolledOpen = next
    if (!next) query = ''
    handle.props.onOpenChange?.(next)
    void handle.update()
  }

  const mountHotkey = ref<HTMLDivElement>((_node, signal) => {
    const hotkey = handle.props.hotkey === undefined ? '?' : handle.props.hotkey
    if (hotkey === false || !hotkey) return
    attachKeymap(
      document,
      [
        {
          keys: hotkey,
          label: 'Toggle keyboard shortcuts',
          handler: () => setOpen(!isOpen()),
        },
      ],
      signal,
    )
  })

  return () => {
    const props = handle.props
    const open = isOpen()
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? props.shortcuts.filter((item) => {
          const keysText = Array.isArray(item.keys) ? item.keys.join(' ') : item.keys
          return `${item.label} ${item.group ?? ''} ${item.description ?? ''} ${keysText}`
            .toLowerCase()
            .includes(needle)
        })
      : props.shortcuts

    const groups = new Map<string, ShortcutSheetItem[]>()
    for (const item of filtered) {
      const name = item.group ?? 'General'
      const list = groups.get(name)
      if (list) list.push(item)
      else groups.set(name, [item])
    }

    return (
      <div
        class={classList('rf-shortcut-sheet-host', props.class)}
        data-size={props.size}
        mix={mountHotkey}
      >
        <Dialog
          open={open}
          onOpenChange={setOpen}
          trigger={props.trigger}
          title={props.title ?? 'Keyboard shortcuts'}
          size="lg"
        >
          <div class="rf-shortcut-sheet" data-size={props.size}>
            {(props.searchable ?? true) && (
              <div class="rf-shortcut-sheet-search">
                <Input
                  type="search"
                  aria-label="Filter shortcuts"
                  placeholder="Filter shortcuts…"
                  size={props.size}
                  value={query}
                  mix={on<HTMLInputElement, 'input'>('input', (event) => {
                    query = event.currentTarget.value
                    void handle.update()
                  })}
                />
              </div>
            )}

            {groups.size === 0 ? (
              <p class="rf-shortcut-sheet-empty">No matching shortcuts.</p>
            ) : (
              <div class="rf-shortcut-sheet-groups">
                {[...groups.entries()].map(([groupName, items]) => (
                  <section key={groupName} class="rf-shortcut-sheet-group">
                    <h3 class="rf-shortcut-sheet-heading">{groupName}</h3>
                    <dl class="rf-shortcut-sheet-list">
                      {items.map((item, idx) => (
                        <div key={`${item.label}-${idx}`} class="rf-shortcut-sheet-row">
                          <dt class="rf-shortcut-sheet-label">
                            <span>{item.label}</span>
                            {item.description && (
                              <span class="rf-shortcut-sheet-desc">{item.description}</span>
                            )}
                          </dt>
                          <dd class="rf-shortcut-sheet-keys">
                            <Kbd
                              keys={item.keys}
                              separator={Array.isArray(item.keys) ? 'then' : undefined}
                              size="compact"
                              variant="outline"
                            />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            )}
          </div>
        </Dialog>
      </div>
    )
  }
}

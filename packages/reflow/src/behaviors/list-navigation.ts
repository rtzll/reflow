/**
 * Where an arrow key, Home or End moves within a list, for components that
 * move focus between their items (Toolbar, Tabs, CheckboxGroup, Sidebar) or
 * move the active option while focus stays in a text field (Combobox,
 * CommandMenu, TriggerMenu, TimeField).
 *
 * It only computes the index. Which items count, which keys apply at the
 * moment, and whether moving means focusing or highlighting stay with the
 * component.
 *
 * Remix UI's listbox, menu and tabs navigate inside their own primitives but
 * expose no navigation of their own for other components to use.
 */
export interface ListNavigationOptions {
  /** Which arrow keys move: Up and Down, Left and Right, or both. Default both. */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** Right-to-left text, where ArrowLeft moves forward. Default false. */
  rtl?: boolean
  /** Wrap from the last item to the first and back. Default true; otherwise stop at the ends. */
  wrap?: boolean
  /** Whether Home and End jump to the ends. Default true. */
  homeEnd?: boolean
}

/**
 * The index `key` moves to from `index` in a list of `length` items, or
 * undefined when the key does not move. From no item (`index` -1), forward
 * moves to the first item and backward to the last.
 */
export function navigationIndex(
  key: string,
  index: number,
  length: number,
  { orientation = 'both', rtl = false, wrap = true, homeEnd = true }: ListNavigationOptions = {},
): number | undefined {
  if (length === 0) return undefined
  if (homeEnd && key === 'Home') return 0
  if (homeEnd && key === 'End') return length - 1
  let step = 0
  if (orientation !== 'horizontal' && key === 'ArrowDown') step = 1
  else if (orientation !== 'horizontal' && key === 'ArrowUp') step = -1
  else if (orientation !== 'vertical' && key === 'ArrowRight') step = rtl ? -1 : 1
  else if (orientation !== 'vertical' && key === 'ArrowLeft') step = rtl ? 1 : -1
  if (step === 0) return undefined
  if (index < 0) return step > 0 ? 0 : length - 1
  const next = index + step
  return wrap ? (next + length) % length : Math.min(length - 1, Math.max(0, next))
}

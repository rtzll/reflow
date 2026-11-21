# ContextMenu design note

Proposed for wave 8. In the [project tree](../apps/web/app/public/project-tree-example.tsx), a reader previewing `code-block-example.tsx` can right-click `README.md` to see its file actions. Choosing **Open file** switches the preview to the README. Dismissing the menu with **Escape** returns focus to the README row while the source file stays in view.

## Proposed API

Wrap the tree in one `ContextMenu` and identify the rows that can open it. In this tree, file rows have `aria-selected` and folders have `aria-expanded`. Document the existing `data-tree-value` attribute as the way to read a row's `TreeItem.value`. Both activation paths call `openFile(value)`, the example's handler for updating the preview.

```tsx
<ContextMenu
  label="File actions"
  target='[role="treeitem"][aria-selected]'
  size="compact"
  items={[{ value: 'open', label: 'Open file' }]}
  onSelect={(action, row) => {
    const value = row.dataset.treeValue
    if (action === 'open' && value !== undefined) openFile(value)
  }}
>
  <Tree
    label="Project files"
    items={projectFiles}
    defaultExpanded={['app']}
    value={file}
    onValueChange={openFile}
    size="compact"
  />
</ContextMenu>
```

`label` names the menu. `target` is a CSS selector for focusable descendants. When the event starts on an icon or label, the closest matching row inside the wrapped content is the target. `items` takes Dropdown's `readonly DropdownItem[]`. `onSelect(value, target, checked?)` receives the action value, the matched `HTMLElement` captured on open, and the checked state for a checkbox or radio action. `size` is optional and follows Dropdown.

## Interaction

- A context click opens the menu at the pointer. Shift+F10 or the Menu key opens it below the focused file row. The surface flips or shifts at viewport edges. Opening gives focus to the named menu list and preserves the tree selection.
- Arrow keys, typeahead, disabled items, submenus, and activation follow Dropdown. Escape from the root menu returns focus to the invoking row. Tab dismisses and continues through the page. An outside click dismisses and lets the clicked control receive focus.
- Folders, blank space, inputs, textareas, selects, and editable content keep the browser menu. A descendant that already handled the event takes precedence. On touch, use the platform's context-menu event where available. Tapping a file opens it directly.

## Reuse and verification

Share the item rendering, menu surface, fluid hover, focus ring, and reduced-motion fade with [Dropdown](../packages/reflow/src/dropdown.tsx). The installed `@remix-run/ui/menu` 0.14.0 provides the menu list, items, submenus, and popover. Its `contextTrigger()` handles a single host, consumes context clicks, and anchors keyboard opens to that host's bounds. For a delegated target, check eligibility first, use the pointer coordinates or matched row's bounds for the popover anchor, and register that row for focus return. Keep this trigger logic in ContextMenu and the shared surface internal to the package.

Write the first browser test with the source file selected and the README focused. Open by keyboard, dismiss with Escape, and assert both focus and selection. Reopen and choose **Open file** to prove the callback targets the README exactly once. Cover the native-menu exceptions by checking that their events keep their default action.

In the showcase end-to-end test, right-click the README's icon and verify that the menu opens at the pointer and **Open file** updates the preview. Open with the Menu key and verify placement against the focused row. At a viewport edge, check that every action is visible. Check that hydration preserves the tree's single tab stop and that reduced motion uses Dropdown's fade. [Existing project tree tests](../apps/web/test/tree.test.e2e.ts)

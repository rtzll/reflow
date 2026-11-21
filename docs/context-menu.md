# ContextMenu design note

Implemented for wave 8. In the [project tree](../apps/web/app/public/project-tree-example.tsx), a reader previewing `code-block-example.tsx` can right-click `README.md` to see its file actions. Choosing **Open file** switches the preview to the README. Dismissing the menu with **Escape** returns focus to the README row while the source file stays in view.

## API

Wrap the tree in one `ContextMenu` and identify the rows that can open it. In this tree, file rows have `aria-selected` and folders have `aria-expanded`. Each file’s `TreeItem.value` is its project-relative path. The menu passes the invoking row to the handler, so someone previewing the README can copy the source file’s path without changing the preview.

```tsx
<ContextMenu
  label="File actions"
  target='[role="treeitem"][aria-selected]'
  size="compact"
  items={[
    { value: 'open', label: 'Open file', icon: <Icon name="file" />, shortcut: 'Enter' },
    { value: 'copy', label: 'Copy', icon: <Icon name="copy" />, separatorBefore: true,
      children: [
        { value: 'copy-name', label: 'File name', icon: <Icon name="file" /> },
        { value: 'copy-path', label: 'Relative path', icon: <Icon name="folder" /> },
      ],
    },
  ]}
  onSelect={selectAction}
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

`label` names the menu. `target` is a CSS selector for focusable descendants. When the event starts on an icon or label, the closest matching row inside the wrapped content is the target. `items` takes Dropdown's `readonly DropdownItem[]`, or a function that builds them from the matched row when the menu opens, so an action that does not apply to that row can be disabled. `onSelect(value, target, checked?)` receives the action value, the matched `HTMLElement` captured on open, and the checked state for a checkbox or radio action. `size` is optional and follows Dropdown.

## Interaction

- A context click opens the menu at the pointer. Shift+F10 or the Menu key opens it below the focused file row. The surface flips or shifts at viewport edges. Opening gives focus to the named menu list and preserves the tree selection.
- Arrow keys, typeahead, disabled items, submenus, and activation follow Dropdown. Escape from the root menu returns focus to the invoking row. Tab dismisses and continues through the page. An outside click dismisses and lets the clicked control receive focus.
- An item’s `icon` accepts a decorative Remix node. Its `shortcut` displays a key hint on the right, including a glyph such as `⌫`. The application supplies the shortcut behavior. Here, Tree already opens a focused file on Enter. Hover over **Copy** or use Right Arrow to enter its submenu. Left Arrow returns to **Copy**.
- Folders, blank space, inputs, textareas, selects, and editable content keep the browser menu. A descendant that already handled the event takes precedence. On touch, use the platform's context-menu event where available. Tapping a file opens it directly.

## Reuse and verification

ContextMenu shares [Dropdown’s menu surface](../packages/reflow/src/dropdown.tsx), including its item rendering, fluid hover, focus ring, and reduced-motion fade. Remix UI’s `contextTrigger()` binds to a single host. Reflow [resolves the matching descendant](../packages/reflow/src/context-menu.tsx) and gives the menu primitive that row for focus return. Pointer opens use viewport coordinates. Keyboard opens use the row as the popover anchor.

The [browser tests](../apps/web/test/context-menu.test.browser.tsx) cover keyboard activation, dismissal, native-menu exceptions, switching regions, and scroll-lock cleanup. The [project tree tests](../apps/web/test/tree.test.e2e.ts) exercise icon targeting, file selection, focus traversal, reduced motion, and placement at a viewport edge. The [playground test](../apps/web/test/context-menu.test.e2e.ts) checks the size control and its copyable example.

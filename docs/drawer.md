# Drawer

Drawer is a modal panel attached to one edge of the screen, built on the native `<dialog>` like Dialog. It follows a drag toward its edge and closes past a quarter of its size or on a quick flick. This note covers the two additions on top of that: snap points and background scaling.

## Snap points

A bottom sheet on a phone often opens part way, showing a summary, and expands to show the rest. Pass `snapPoints` to a top or bottom drawer to give it resting heights. Each point is a share of the viewport height between 0 and 1, such as `0.4`, or a length in pixels, such as `'320px'`. List them from smallest to largest. Side drawers ignore them.

```tsx
<Drawer trigger="Route" title="Route to Lisbon" snapPoints={[0.35, 0.9]}>
  …
</Drawer>
```

The panel is as tall as its largest point and rests at the current one, with the rest of it below the edge of the screen. It opens at the first point unless `defaultSnap` names another index. `snap` and `onSnapChange` control the index from the parent, as `open` and `onOpenChange` control whether it is open.

**Dragging.** The panel follows the pointer between points and resists past the largest one. On release it settles at the nearest point. A flick moves one point in its direction, however short the drag. From the smallest point, a drag past a quarter of that point's height or a flick toward the edge closes the drawer, as it does without snap points; a drawer that is not dismissible settles at the smallest point instead.

**Scrolling.** Below the largest point, a drag anywhere on the panel resizes it and its content does not scroll, so touch drags move the sheet rather than the text inside it. At the largest point the content scrolls, and a drag toward the edge takes over once the content is back at its start, as it already does.

**Keyboard and assistive technology.** With snap points the handle is a button, labelled "Expand drawer" below the largest point and "Collapse drawer" at it. Activating it moves to the next point and wraps back to the first. Arrow keys on the handle move one point: Up expands a bottom drawer and Down collapses it, and the reverse for a top drawer. The handle shows whether the drawer is expanded with `aria-expanded`. A drawer without snap points keeps its decorative handle.

**Resizing.** Points in shares of the viewport are measured again when the window resizes, and the panel keeps its current index.

**Motion.** Moving between points uses the drawer's existing ease. With reduced motion the panel moves between points without the slide, as it already opens with a fade.

## Background scaling

Set `scaleBackground` on a bottom drawer to push the page back while it is open, as iOS sheets do. Mark the element that holds the page with `data-rf-drawer-background`; Reflow scales that element, rounds its top corners and moves it down a little, and follows a drag back as the drawer closes. The document shows black around it; set `--rf-drawer-page-background` to change that. The marked element gets the page background and at least the viewport's height while scaled, so nothing behind it shows through. Without a marked element the prop does nothing.

```tsx
<body>
  <div data-rf-drawer-background>…the app…</div>
</body>
```

Reflow marks the document with `data-rf-drawer-scaled` while such a drawer is open, so an app can adjust anything else outside the scaled element. Reduced motion turns the scaling off. Only bottom drawers scale the page; the effect reads as a sheet lifting the page from below, and it does not fit the other edges.

## Reused pieces

- The modal behavior for opening, closing, Escape, the backdrop and focus return.
- The existing drag: its threshold, axis lock, resistance, flick speed and the check for scrolled content.
- The drawer's 500ms ease for every move between points.

## Not included

Nested drawers, where opening a drawer from inside another scales the first one back. Add them once an app needs them.

## Verification

Browser tests cover the starting height, settling at the nearest point, a flick moving one point, closing from the smallest point, a non-dismissible drawer stopping there, the controlled index, the handle's keyboard steps and labels, and the background element's attributes. An end-to-end test checks the resting position at each point and the scaled page in the showcase.

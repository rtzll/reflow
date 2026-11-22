import { on } from 'remix/component'

// The control a label names: the native tooltip goes on it, so it shows
// anywhere over the row and not only over the text.
const hosts = 'a, button, label, [role^="menuitem"], [role="option"]'

/**
 * Names a truncated label in full as the pointer or keyboard focus reaches
 * it, through a native tooltip on the control the label names. Only a label
 * that is cut gets one, so a label that fits shows nothing extra. It is read
 * on arrival: cheap, and current whenever the tooltip could show.
 *
 * Mix it into the element that holds the labels, with a selector for them.
 * Breadcrumb names its few steps in the library Tooltip instead; this suits
 * lists of rows, where a Tooltip per row would be heavy.
 */
export function cutTitle(labels: string) {
  const check = (event: Event) => {
    const container = event.currentTarget
    if (!(event.target instanceof Element) || !(container instanceof Element)) return
    const label =
      event.target.closest<HTMLElement>(labels) ??
      event.target.closest(hosts)?.querySelector<HTMLElement>(labels)
    if (!label || !container.contains(label)) return
    // A label with no control of its own inside the container, such as a
    // chip's, carries the tooltip itself.
    const control = label.closest<HTMLElement>(hosts)
    const host = control && container.contains(control) ? control : label
    const cut = [label, ...label.children].some((node) => node.scrollWidth > node.clientWidth + 0.5)
    if (cut) {
      host.title = label.textContent?.trim() ?? ''
      host.setAttribute('data-rf-cut-title', '')
    } else if (host.hasAttribute('data-rf-cut-title')) {
      host.removeAttribute('title')
      host.removeAttribute('data-rf-cut-title')
    }
  }
  return [
    on<HTMLElement, 'pointerover'>('pointerover', check),
    on<HTMLElement, 'focusin'>('focusin', check),
  ]
}

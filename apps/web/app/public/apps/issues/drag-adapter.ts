import type { ElementEventPayloadMap } from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/utils/set-custom-native-drag-preview'
import type { Issue } from './fixtures.ts'

export {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter'

export function setIssueDragPreview(
  { source, location, nativeSetDragImage }: ElementEventPayloadMap['onGenerateDragPreview'],
  companions: Issue[],
  layout: string,
) {
  const bounds = source.element.getBoundingClientRect()
  const { clientX, clientY } = location.initial.input
  const face = document.createElement('div')
  face.className = 'issues-row'
  for (const child of source.element.children) face.append(child.cloneNode(true))
  const count = face.querySelector<HTMLElement>('.issues-check')!
  count.className = 'issues-drag-count'
  count.textContent = String(companions.length + 1)

  setCustomNativeDragPreview({
    nativeSetDragImage,
    render({ container }) {
      container.setAttribute('aria-hidden', 'true')
      const stack = document.createElement('div')
      stack.className = 'issues-drag-stack'
      stack.dataset.layout = layout
      stack.style.width = bounds.width + 'px'
      stack.append(face)
      for (const issue of companions.slice(0, 2)) {
        const layer = document.createElement('div')
        layer.className = 'issues-drag-layer'
        const id = document.createElement('span')
        id.className = 'issues-id'
        id.textContent = issue.id
        const title = document.createElement('span')
        title.textContent = issue.title
        layer.append(id, title)
        stack.append(layer)
      }
      container.append(stack)
    },
    getOffset() {
      // On wide lists the lifted row is compact. Keep the same relative grab point.
      const preview = face.getBoundingClientRect()
      return {
        x: ((clientX - bounds.left) / bounds.width) * preview.width,
        y: ((clientY - bounds.top) / bounds.height) * preview.height,
      }
    },
  })
}

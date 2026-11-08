import { renderIconNodes } from '@rtzll/reflow'
import { showcaseIcons } from './icon-data.ts'

/** Kept in the server shell, outside interactive islands. */
export function ShowcaseIconSprite() {
  return () => (
    <svg width="0" height="0" aria-hidden="true" focusable="false" class="site-icon-sprite">
      <defs>
        {Object.entries(showcaseIcons).flatMap(([family, icons]) =>
          Object.entries(icons).map(([name, icon]) => {
            const id = `rf-icon-${family}-${name}`
            return (
              <symbol key={id} id={id} viewBox={icon.viewBox}>
                <g {...icon.paint}>{renderIconNodes(icon.nodes)}</g>
              </symbol>
            )
          }),
        )}
      </defs>
    </svg>
  )
}

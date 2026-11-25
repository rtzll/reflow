import { Button, DiffView } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const sampleDiff = `--- a/packages/reflow/src/behaviors/shortcut.ts
+++ b/packages/reflow/src/behaviors/shortcut.ts
@@ -154,3 +154,11 @@ export function isMacPlatform() {
   const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
   return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform ?? nav.platform ?? '')
 }
+
+export function ariaShortcut(shortcut: string) {
+  const { mod, meta, ctrl, alt, shift, key } = parseShortcut(shortcut)
+  if (!key) return ''
+  return [(mod || ctrl) && 'Control', meta && 'Meta', alt && 'Alt', shift && 'Shift', key.toUpperCase()]
+    .filter(Boolean)
+    .join('+')
+}
`

/** The DiffView example: a unified diff with a Unified/Split toggle and actions. */
export function DiffViewExample(_handle: Handle) {
  return () => (
    <div style={{ width: 'min(100%, 640px)' }}>
      <DiffView
        diff={sampleDiff}
        viewToggle
        actions={
          <Button size="compact" variant="ghost">
            Copy patch
          </Button>
        }
      />
    </div>
  )
}

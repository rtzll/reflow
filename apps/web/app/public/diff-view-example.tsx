import { Button, Icon } from '@rtzll/reflow'
import { DiffView } from '@rtzll/reflow/diffs'
import { on, type Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from './showcase-sound.ts'

const sampleDiff = `--- a/packages/reflow/src/behaviors/shortcut.ts
+++ b/packages/reflow/src/behaviors/shortcut.ts
@@ -151,8 +151,13 @@ export function isMacPlatform() {
   if (typeof navigator === 'undefined') return false
-  const platform = navigator.platform ?? ''
-  return /mac/i.test(platform)
+  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
+  const platform = nav.userAgentData?.platform ?? nav.platform ?? ''
+  return /mac|iphone|ipad|ipod/i.test(platform)
 }
 
-export function formatAria(shortcut: string) {
-  return shortcut.toUpperCase()
+export function ariaShortcut(shortcut: string) {
+  const { mod, meta, ctrl, alt, shift, key } = parseShortcut(shortcut)
+  if (!key) return ''
+  return [(mod || ctrl) && 'Control', meta && 'Meta', alt && 'Alt', shift && 'Shift', key.toUpperCase()]
+    .filter(Boolean)
+    .join('+')
 }
`

/** The DiffView example: a unified diff with a Unified/Split toggle and copyable patch. */
export function DiffViewExample(handle: Handle) {
  let state: 'idle' | 'copied' | 'error' = 'idle'
  let timer: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })

  async function copyPatch() {
    clearTimeout(timer)
    try {
      await navigator.clipboard.writeText(sampleDiff)
      state = 'copied'
      playCopySuccess()
    } catch {
      state = 'error'
      playCopyError()
    }
    void handle.update()
    timer = setTimeout(() => {
      state = 'idle'
      void handle.update()
    }, 1600)
  }

  return () => (
    <div style={{ width: 'min(100%, 760px)' }}>
      <DiffView
        diff={sampleDiff}
        viewToggle
        wrap
        size="compact"
        actions={
          <Button
            size="compact"
            variant="ghost"
            leadingIcon={<Icon name={state === 'copied' ? 'check' : 'copy'} size={14} />}
            mix={on('click', () => void copyPatch())}
          >
            {state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : 'Copy patch'}
          </Button>
        }
      />
    </div>
  )
}

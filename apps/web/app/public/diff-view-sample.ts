export const sampleDiff = `--- a/packages/reflow/src/behaviors/shortcut.ts
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

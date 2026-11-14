import { Progress } from '@rtzll/reflow'
import { equal, ok } from 'remix/assert'
import { render } from 'remix/component/test'
import { it } from 'remix/test'

it('names determinate and indeterminate progress using native semantics', (t) => {
  const { $, cleanup } = render(
    <div>
      <Progress label="Uploading files" value={3} max={8} showValue />
      <Progress label="Preparing files" />
    </div>,
  )
  t.after(cleanup)
  const upload = $('progress[aria-label="Uploading files"]') as HTMLProgressElement
  const prepare = $('progress[aria-label="Preparing files"]') as HTMLProgressElement
  equal(upload.value, 3)
  equal(upload.max, 8)
  ok(upload.parentElement?.textContent?.includes('38%'))
  equal(prepare.position, -1)
})

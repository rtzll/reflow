import { LogViewer, type LogGroup } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { playCopyError, playCopySuccess } from './showcase-sound.ts'

const sampleGroups: readonly LogGroup[] = [
  {
    id: 'install',
    title: 'Install dependencies',
    status: 'passed',
    duration: '1.4s',
    entries: [
      { text: '\x1b[2m$ pnpm install --frozen-lockfile\x1b[0m', timestamp: '+00:00.1' },
      { text: '\x1b[32m✓\x1b[0m Lockfile up to date (reused 142 packages)', timestamp: '+00:01.3' },
    ],
  },
  {
    id: 'build',
    title: 'Build workspace & Cloudflare Worker',
    status: 'passed',
    duration: '3.2s',
    entries: [
      {
        text: '\x1b[36m▸\x1b[0m Building @rtzll/reflow (core.css + per-domain CSS)',
        timestamp: '+00:01.6',
      },
      {
        text: 'WARN: 1 deprecated subdependency in test harness',
        level: 'warn',
        timestamp: '+00:02.9',
      },
      {
        text: '\x1b[32m✓\x1b[0m Built showcase with 16 client entry modules',
        timestamp: '+00:04.6',
      },
    ],
  },
  {
    id: 'e2e',
    title: 'Run E2E suite (chromium)',
    status: 'failed',
    duration: '24.8s',
    entries: [
      { text: '\x1b[32m✓\x1b[0m app-review.test.e2e.ts (3.4s)', timestamp: '+00:08.2' },
      {
        text: '\x1b[31m✗\x1b[0m apps.test.e2e.ts:57 strict mode violation on App navigation',
        level: 'error',
        timestamp: '+00:26.1',
      },
      {
        text: '  Expected 1 landmark, resolved 2 elements (.site-app-nav, .studio-app-nav)',
        level: 'error',
        timestamp: '+00:26.1',
      },
    ],
  },
]

/** The LogViewer example: grouped CI step logs with auto-opened failures, severity filters, and line selection. */
export function LogViewerExample(_handle: Handle) {
  return () => (
    <div style={{ width: 'min(100%, 760px)' }}>
      <LogViewer
        title="verify · chromium"
        status="failed"
        duration="29.4s"
        groups={sampleGroups}
        maxHeight="320px"
        size="compact"
        onCopy={playCopySuccess}
        onCopyError={playCopyError}
      />
    </div>
  )
}

import type { FileTreeSsrPayload } from '@rtzll/reflow/trees'
import type { RemixNode } from 'remix/component'

export interface AppPrerendered {
  diffs?: Record<string, string>
  tree?: FileTreeSsrPayload
  diagrams?: Record<string, string>
}

export interface ExampleApp {
  slug: string
  name: string
  description: string
  /** Render the app using the request's query string, including the leading ?. */
  render: (
    search: string,
    soundEnabled: boolean,
    prerenderedDiffs?: Record<string, string>,
    prerendered?: AppPrerendered,
  ) => RemixNode
}

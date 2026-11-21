import type { RemixNode } from 'remix/component'

export interface ExampleApp {
  slug: string
  name: string
  description: string
  /** Render the app using the request's query string, including the leading ?. */
  render: (search: string) => RemixNode
}

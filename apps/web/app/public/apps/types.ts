import type { RemixNode } from 'remix/component'

export interface ExampleApp {
  slug: string
  name: string
  description: string
  components: readonly { slug: string; name: string }[]
  /** Render the app using the request's query string, including the leading ?. */
  render?: (search: string) => RemixNode
}

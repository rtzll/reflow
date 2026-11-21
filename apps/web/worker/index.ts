import { router } from '../app/router.ts'

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const response = await router.fetch(request)
      // Pages depend on URL settings and preference cookies. Clone headers so
      // immutable responses such as Response.redirect() can be updated safely.
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', 'private, no-store')
      headers.set('X-Content-Type-Options', 'nosniff')
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      console.error(
        JSON.stringify({
          message: 'Showcase request failed',
          error: error instanceof Error ? error.message : String(error),
        }),
      )
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      })
    }
  },
}

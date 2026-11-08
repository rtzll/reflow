import { router } from '../app/router.ts'

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      const response = await router.fetch(request)
      // Pages depend on URL settings and preference cookies.
      response.headers.set('Cache-Control', 'private, no-store')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
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

import type { ExampleApp } from '../types.ts'
import { conversations } from './fixtures.ts'
import { localThreadId } from './local-threads.ts'
import { ChatWorkspace } from './workspace.tsx'

export const chatApp: ExampleApp = {
  slug: 'chat',
  name: 'Chat',
  description: 'Outline a story, draft interview questions, or proof an edit.',
  render(search) {
    const thread = new URLSearchParams(search).get('thread')
    const initialId =
      thread && (conversations.some(({ id }) => id === thread) || localThreadId.test(thread))
        ? thread
        : `conversation-${crypto.randomUUID()}`
    return <ChatWorkspace conversations={conversations} initialId={initialId} search={search} />
  },
}

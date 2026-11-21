import type { ExampleApp } from '../types.ts'
import { conversations } from './fixtures.ts'
import { ChatWorkspace } from './workspace.tsx'

export const chatApp: ExampleApp = {
  slug: 'chat',
  name: 'Chat workspace',
  description: 'Switch between conversations, compose a reply, and return to a draft.',
  render(search) {
    const thread = new URLSearchParams(search).get('thread')
    const initialId = conversations.find(({ id }) => id === thread)?.id ?? conversations[0].id
    return <ChatWorkspace conversations={conversations} initialId={initialId} />
  },
}

import type { ExampleApp } from '../types.ts'

export const chatApp: ExampleApp = {
  slug: 'chat',
  name: 'Chat workspace',
  description: 'Switch between conversations, compose a reply, and return to a draft.',
  components: [
    { slug: 'chat-layout', name: 'ChatLayout' },
    { slug: 'input-message', name: 'InputMessage' },
    { slug: 'chat-message', name: 'ChatMessage' },
  ],
}

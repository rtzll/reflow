import type { ChatEntry, Conversation } from './fixtures.ts'

export interface Thread extends Conversation {
  draft: string
}

// One key per thread keeps edits in separate tabs from overwriting unrelated drafts.
const prefix = 'reflow.chat.v1.'
export const localThreadId = /^conversation-[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/

export function blankThread(id: string): Thread {
  return { id, title: 'New chat', messages: [], draft: '' }
}

function isMessage(value: unknown): value is ChatEntry {
  if (!value || typeof value !== 'object') return false
  return (
    'role' in value &&
    (value.role === 'user' || value.role === 'assistant') &&
    'text' in value &&
    typeof value.text === 'string' &&
    (!('stopped' in value) || typeof value.stopped === 'boolean') &&
    (!('proofChecklist' in value) ||
      (value.role === 'assistant' &&
        (value.proofChecklist === 'requested' ||
          value.proofChecklist === 'approved' ||
          value.proofChecklist === 'denied')))
  )
}

export function restoreThreads(threads: Thread[]) {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(prefix)) continue
      const id = key.slice(prefix.length)
      const existing = threads.find((thread) => thread.id === id)
      if (!existing && !localThreadId.test(id)) continue
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
        if (
          !saved ||
          typeof saved.title !== 'string' ||
          typeof saved.draft !== 'string' ||
          !Array.isArray(saved.messages) ||
          !saved.messages.every(isMessage)
        )
          continue
        const thread: Thread = {
          id,
          title: saved.title,
          messages: saved.messages,
          draft: saved.draft,
        }
        if (existing) Object.assign(existing, thread)
        else threads.unshift(thread)
      } catch {
        // A damaged record should not hide the other conversations.
      }
    }
  } catch {
    // In private or restricted storage the open page can still keep drafts in memory.
  }
}

export function saveThread(thread: Thread, streaming?: ChatEntry) {
  try {
    localStorage.setItem(
      prefix + thread.id,
      JSON.stringify({
        title: thread.title,
        draft: thread.draft,
        messages: streaming
          ? thread.messages.map((message) =>
              message === streaming ? { ...message, stopped: true } : message,
            )
          : thread.messages,
      }),
    )
  } catch {
    // Keep the live conversation usable when storage is unavailable or full.
  }
}

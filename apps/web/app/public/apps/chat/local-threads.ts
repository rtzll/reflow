import type { ChatEntry, Conversation } from './fixtures.ts'

export interface Thread extends Conversation {
  draft: string
  pinned?: boolean
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
    (!('sentAt' in value) || typeof value.sentAt === 'string') &&
    (!('attachments' in value) ||
      (Array.isArray(value.attachments) &&
        value.attachments.every(
          (file: unknown) =>
            !!file && typeof file === 'object' && 'name' in file && typeof file.name === 'string',
        ))) &&
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
        // A deleted seed conversation stays deleted.
        if (saved?.deleted === true) {
          if (existing) threads.splice(threads.indexOf(existing), 1)
          continue
        }
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
          pinned: saved.pinned === true,
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
        pinned: thread.pinned || undefined,
        // Object URLs end with the page, so only names and types are kept.
        messages: thread.messages.map((message) => {
          const saved = message === streaming ? { ...message, stopped: true } : { ...message }
          if (saved.attachments)
            saved.attachments = saved.attachments.map(({ name, type }) => ({ name, type }))
          return saved
        }),
      }),
    )
  } catch {
    // Keep the live conversation usable when storage is unavailable or full.
  }
}

/** Forgets a conversation. A seed conversation keeps a marker so it stays gone. */
export function deleteThread(thread: Thread, seed: boolean) {
  try {
    if (seed) localStorage.setItem(prefix + thread.id, JSON.stringify({ deleted: true }))
    else localStorage.removeItem(prefix + thread.id)
  } catch {
    // Without storage the conversation is only gone until the page reloads.
  }
}

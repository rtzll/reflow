let currentTransition: ViewTransition | undefined

export function messageTransitionName(id: string) {
  return (
    'rf-message-' + Array.from(id, (character) => character.codePointAt(0)!.toString(16)).join('-')
  )
}

/** Keep the document still while the named queue row becomes a message bubble. */
export async function transitionMessage(update: () => Promise<void>, signal: AbortSignal) {
  if (signal.aborted) return
  if (
    !document.startViewTransition ||
    currentTransition ||
    ('activeViewTransition' in document && document.activeViewTransition) ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    await update()
    return
  }

  document.documentElement.setAttribute('data-rf-message-transition', '')
  let transition: ViewTransition
  try {
    transition = document.startViewTransition(update)
  } catch {
    document.documentElement.removeAttribute('data-rf-message-transition')
    await update()
    return
  }
  currentTransition = transition
  const cancel = () => transition.skipTransition()
  // A consumer can await a network request. Release the capture promptly while
  // letting that same update finish, so sending never freezes the document.
  const captureDeadline = setTimeout(cancel, 200)
  signal.addEventListener('abort', cancel, { once: true })
  // Unsupported captures and canceled animations still complete the DOM update.
  void transition.ready.catch(() => {})
  void transition.finished
    .catch(() => {})
    .finally(() => {
      signal.removeEventListener('abort', cancel)
      if (currentTransition !== transition) return
      currentTransition = undefined
      document.documentElement.removeAttribute('data-rf-message-transition')
    })
  try {
    await transition.updateCallbackDone
  } finally {
    clearTimeout(captureDeadline)
  }
}

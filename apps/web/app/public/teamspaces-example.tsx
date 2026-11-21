import { AlertDialog, Button, Dialog, Input, type DialogProps } from '@rtzll/reflow'
import { on, ref, type Handle } from 'remix/component'

type Options = Pick<
  DialogProps,
  'size' | 'position' | 'modal' | 'showCloseButton' | 'dismissOnBackdrop'
>

export function TeamspacesExample(handle: Handle<Options>) {
  let spaces = [
    { id: 1, name: 'Design' },
    { id: 2, name: 'Engineering' },
  ]
  let nextId = 3
  let creating = false
  let name = ''
  let pending: (typeof spaces)[number] | undefined
  let pendingName = 'teamspace'
  let newButton: HTMLButtonElement | undefined
  const rememberButton = ref<HTMLButtonElement>((button) => {
    newButton = button
  })

  function setCreating(open: boolean) {
    creating = open
    name = ''
    void handle.update()
  }
  function create(event: SubmitEvent) {
    event.preventDefault()
    if (!name.trim()) return
    spaces = [...spaces, { id: nextId++, name: name.trim() }]
    setCreating(false)
  }
  async function remove() {
    const id = pending?.id
    if (id === undefined) return
    spaces = spaces.filter((space) => space.id !== id)
    pending = undefined
    await handle.update()
    if (!handle.signal.aborted) newButton?.focus()
  }

  return () => (
    <section class="example-teamspaces" aria-label="Teamspaces">
      <div class="example-space-heading">
        <strong>Teamspaces</strong>
        <Button
          size="compact"
          variant="secondary"
          aria-haspopup="dialog"
          mix={[rememberButton, on('click', () => setCreating(true))]}
        >
          New teamspace
        </Button>
      </div>
      {spaces.length ? (
        <ul aria-label="Teamspaces">
          {spaces.map((space) => (
            <li key={space.id}>
              <span>{space.name}</span>
              <Button
                size="compact"
                variant="ghost"
                aria-label={'Delete ' + space.name}
                aria-haspopup="dialog"
                mix={on('click', () => {
                  pending = space
                  pendingName = space.name
                  void handle.update()
                })}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No teamspaces yet.</p>
      )}
      <Dialog
        {...handle.props}
        open={creating}
        onOpenChange={setCreating}
        title="Create teamspace"
        footer={(close) => (
          <>
            <Button variant="ghost" mix={on('click', close)}>
              Cancel
            </Button>
            <Button type="submit" form={handle.id + '-create'} disabled={!name.trim()}>
              Create
            </Button>
          </>
        )}
      >
        <form id={handle.id + '-create'} mix={on<HTMLFormElement, 'submit'>('submit', create)}>
          <label>
            Name
            <Input
              autofocus
              required
              name="name"
              value={name}
              mix={on<HTMLInputElement, 'input'>('input', (event) => {
                name = event.currentTarget.value
                void handle.update()
              })}
            />
          </label>
        </form>
      </Dialog>
      <AlertDialog
        open={!!pending}
        title={'Delete ' + (pending?.name ?? pendingName) + '?'}
        description="This teamspace will be removed from the list."
        confirmLabel="Delete teamspace"
        onOpenChange={(open) => {
          if (!open) pending = undefined
          void handle.update()
        }}
        onConfirm={remove}
      />
    </section>
  )
}

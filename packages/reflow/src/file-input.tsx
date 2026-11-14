import { on, ref, type Handle, type RemixNode } from 'remix/component'
import { Button } from './button.tsx'
import { Field } from './field.tsx'
import { Input } from './input.tsx'
import type { ControlSize } from './systems/styling.ts'
import { partitionFiles } from './behaviors/file-selection.ts'
import { Icon } from './icon.tsx'
import { onFormReset } from './behaviors/form-reset.ts'

export interface FileInputProps {
  label: string
  name?: string
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  required?: boolean
  disabled?: boolean
  description?: RemixNode
  size?: ControlSize
  onFilesChange?: (files: readonly File[]) => void
}

export function FileInput(handle: Handle<FileInputProps>) {
  let files: File[] = []
  let rejections: string[] = []
  let dragging = false
  let input: HTMLInputElement | undefined

  function change(next: File[]) {
    if (!input) return
    const transfer = new DataTransfer()
    for (const file of next) transfer.items.add(file)
    input.files = transfer.files
    files = next
    handle.props.onFilesChange?.(next)
    void handle.update()
  }

  function add(incoming: FileList | null) {
    if (!incoming?.length || !input || input.matches(':disabled')) return
    const { accept, multiple, maxFiles, maxSize } = handle.props
    const limit = multiple ? Math.max(1, Math.floor(maxFiles ?? Infinity)) : 1
    const previous = multiple ? files : []
    const { accepted, rejected } = partitionFiles(incoming, accept)
    rejections = rejected.map((file) => `${file.name}: unsupported file type.`)
    const next = [...previous]
    for (const file of accepted) {
      if (maxSize !== undefined && file.size > maxSize)
        rejections.push(`${file.name}: exceeds the file size limit.`)
      else if (next.length >= limit)
        rejections.push(`${file.name}: exceeds the limit of ${limit} files.`)
      else next.push(file)
    }
    change(next.length === 0 ? files : next)
  }

  const reset = onFormReset(() => {
    rejections = []
    dragging = false
    change([])
  })

  const bind = ref<HTMLInputElement>((element, signal) => {
    input = element
    signal.addEventListener(
      'abort',
      () => {
        input = undefined
      },
      { once: true },
    )
  })

  return () => {
    const { label, description, name, accept, multiple, required, disabled, size } = handle.props
    return (
      <Field label={label} description={description} class="rf-file-field">
        {(control) => (
          <>
            <div
              class="rf-file-drop"
              data-dragging={dragging || undefined}
              mix={[
                on('dragover', (event) => {
                  if (input?.matches(':disabled') || !event.dataTransfer?.types.includes('Files'))
                    return
                  event.preventDefault()
                  if (!dragging) {
                    dragging = true
                    void handle.update()
                  }
                }),
                on('dragleave', (event) => {
                  if (
                    event.relatedTarget instanceof Node &&
                    event.currentTarget.contains(event.relatedTarget)
                  )
                    return
                  dragging = false
                  void handle.update()
                }),
                on('drop', (event) => {
                  if (!event.dataTransfer?.files.length) return
                  event.preventDefault()
                  dragging = false
                  add(event.dataTransfer.files)
                  void handle.update()
                }),
                on('paste', (event) => {
                  if (!event.clipboardData?.files.length || input?.matches(':disabled')) return
                  event.preventDefault()
                  add(event.clipboardData.files)
                }),
              ]}
            >
              <Input
                {...control}
                aria-describedby={
                  [
                    control['aria-describedby'],
                    rejections.length ? handle.id + '-rejected' : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                type="file"
                name={name}
                accept={accept}
                multiple={multiple}
                required={required}
                disabled={disabled}
                size={size}
                mix={[
                  bind,
                  reset,
                  on<HTMLInputElement, 'change'>('change', (event) =>
                    add(event.currentTarget.files),
                  ),
                ]}
              />
            </div>
            {files.length > 0 && (
              <ul class="rf-file-list" aria-label="Selected files">
                {files.map((file, index) => (
                  <li key={index}>
                    <Icon name="file" />
                    <span>{file.name}</span>
                    <Button
                      aria-label={`Remove ${file.name}`}
                      variant="ghost"
                      size="icon-compact"
                      disabled={disabled}
                      mix={on<HTMLButtonElement, 'click'>('click', (event) => {
                        rejections = []
                        const list = event.currentTarget.closest('ul')
                        change(files.filter((_, position) => position !== index))
                        handle.queueTask(() => {
                          const row = list?.children[Math.min(index, files.length - 1)]
                          const target = row?.querySelector('button') ?? input
                          target?.focus()
                        })
                      })}
                    >
                      <Icon name="x" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {rejections.length > 0 && (
              <p id={handle.id + '-rejected'} class="rf-file-rejections" role="alert">
                {rejections.join(' ')}
              </p>
            )}
          </>
        )}
      </Field>
    )
  }
}

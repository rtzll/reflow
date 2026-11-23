import { ref, type Handle } from 'remix/component'
import { Badge } from './badge.tsx'
import { classList } from './systems/styling.ts'

/** A file that is not a local `File`, such as one already uploaded. */
export interface RemoteFile {
  name: string
  /** The MIME type. Picks between an image preview and a name card. */
  type?: string
  /** An image to show in place of the name card. */
  previewUrl?: string
}

export interface FileThumbnailProps {
  file: File | RemoteFile
  /** Height in pixels. Image tiles are square; name cards are twice as wide. Defaults to 80. */
  size?: number
  class?: string
}

// Image types every current browser draws in an <img>. Others, such as HEIC
// or TIFF, get a name card rather than a broken image.
const previewableImages = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/bmp',
])

// Splits a name at its last dot into the name the card shows and the
// extension its badge shows, upper-cased. A dotfile such as `.env` or a name
// without a dot has no extension.
export function splitFileName(name: string) {
  const dot = name.lastIndexOf('.')
  return dot > 0 && dot < name.length - 1
    ? { base: name.slice(0, dot), extension: name.slice(dot + 1).toUpperCase() }
    : { base: name, extension: '' }
}

/**
 * Shows a file as a square image preview or, for anything else, a card with
 * its name and an extension badge. InputMessage and ChatMessage use it for
 * attachments. A local `File` is read through an object URL that is revoked
 * when the thumbnail leaves or its file changes.
 */
export function FileThumbnail(handle: Handle<FileThumbnailProps>) {
  let image: HTMLImageElement | undefined
  let previousFile: File | undefined
  let url: string | undefined
  function updateImage() {
    const file = handle.props.file
    if (!image || !(file instanceof File) || previousFile === file) return
    if (url) URL.revokeObjectURL(url)
    previousFile = file
    url = URL.createObjectURL(file)
    image.src = url
  }
  const capture = ref((element, signal) => {
    if (!(element instanceof HTMLImageElement)) return
    image = element
    updateImage()
    signal.addEventListener(
      'abort',
      () => {
        if (url) URL.revokeObjectURL(url)
        url = undefined
        previousFile = undefined
        image = undefined
      },
      { once: true },
    )
  })
  return () => {
    const { file, size, class: className } = handle.props
    const local = typeof File !== 'undefined' && file instanceof File
    const previewUrl = local ? undefined : (file as RemoteFile).previewUrl
    const isImage = local ? previewableImages.has(file.type.toLowerCase()) : Boolean(previewUrl)
    if (local && isImage) handle.queueTask(updateImage)
    const { base, extension } = splitFileName(file.name)
    return (
      <div
        class={classList('rf-file-thumbnail', className)}
        data-kind={isImage ? 'image' : 'file'}
        style={size ? { '--rf-file-thumbnail-size': `${size}px` } : undefined}
      >
        {isImage ? (
          local ? (
            <img alt={file.name} mix={capture} />
          ) : (
            <img alt={file.name} src={previewUrl} />
          )
        ) : (
          <div class="rf-file-thumbnail-card">
            <span class="rf-file-thumbnail-name">{base}</span>
            {extension && <Badge size="compact">{extension}</Badge>}
          </div>
        )}
      </div>
    )
  }
}

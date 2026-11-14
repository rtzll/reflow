/**
 * Split files into those an `accept` list allows and those it rejects, by
 * extension, exact MIME type or `type/*`, as the native file input matches
 * them. FileInput and InputMessage use it for dropped and pasted files, which
 * the browser does not filter. The platform exposes no matcher for this.
 */
export function partitionFiles(files: Iterable<File>, accept?: string) {
  const types = (accept ?? '')
    .split(',')
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean)
  const accepted: File[] = []
  const rejected: File[] = []
  for (const file of files) {
    const mime = file.type.toLowerCase()
    const name = file.name.toLowerCase()
    const matches =
      types.length === 0 ||
      types.some((type) => {
        if (type.startsWith('.')) return name.endsWith(type)
        if (type.endsWith('/*')) return mime.startsWith(type.slice(0, -1))
        return mime === type
      })
    if (matches) accepted.push(file)
    else rejected.push(file)
  }
  return { accepted, rejected }
}

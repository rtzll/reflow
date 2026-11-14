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

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import * as assert from 'remix/assert'
import { it } from 'remix/test'
import { componentApi } from '../app/docs-data.ts'

interface ParsedInterface {
  kind: 'interface'
  exported: boolean
  extendsClause: string
  body: string
  file: string
}

interface ParsedTypeAlias {
  kind: 'type'
  exported: boolean
  rhs: string
  file: string
}

type ParsedDecl = ParsedInterface | ParsedTypeAlias

interface PropInfo {
  required: boolean
  typeStr: string
}

interface ResolvedProps {
  props: Map<string, PropInfo>
  extendsExternal: boolean
}

const distDir = fileURLToPath(new URL('../../../packages/reflow/dist/', import.meta.url))

function stripComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => ' '.repeat(match.length))
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

function splitTopLevel(text: string, sep: string) {
  const parts: string[] = []
  let brace = 0
  let paren = 0
  let bracket = 0
  let angle = 0
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch
      i++
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') i++
        i++
      }
      continue
    }
    if (ch === '{') brace++
    else if (ch === '}') brace--
    else if (ch === '(') paren++
    else if (ch === ')') paren--
    else if (ch === '[') bracket++
    else if (ch === ']') bracket--
    else if (ch === '<') angle++
    else if (ch === '>' && text[i - 1] !== '=') angle = Math.max(0, angle - 1)
    else if (ch === sep && brace === 0 && paren === 0 && bracket === 0 && angle === 0) {
      parts.push(text.slice(start, i).trim())
      start = i + 1
    }
  }
  const tail = text.slice(start).trim()
  if (tail) parts.push(tail)
  return parts
}

function parseDeclFile(file: string, source: string) {
  const clean = stripComments(source)
  const types = new Map<string, ParsedDecl>()
  let i = 0
  const len = clean.length

  function skipWs() {
    while (i < len && /\s/.test(clean[i])) i++
  }

  function readBalanced(open: string, close: string) {
    let depth = 0
    const start = i
    while (i < len) {
      const ch = clean[i]
      if (ch === "'" || ch === '"' || ch === '`') {
        const quote = ch
        i++
        while (i < len && clean[i] !== quote) {
          if (clean[i] === '\\') i++
          i++
        }
        i++
        continue
      }
      if (ch === open) depth++
      else if (ch === close) {
        depth--
        if (depth === 0) {
          i++
          return clean.slice(start, i)
        }
      }
      i++
    }
    return clean.slice(start)
  }

  function readUntilSemi() {
    let brace = 0
    let paren = 0
    let bracket = 0
    const start = i
    while (i < len) {
      const ch = clean[i]
      if (ch === "'" || ch === '"' || ch === '`') {
        const quote = ch
        i++
        while (i < len && clean[i] !== quote) {
          if (clean[i] === '\\') i++
          i++
        }
        i++
        continue
      }
      if (ch === '{') brace++
      else if (ch === '}') brace--
      else if (ch === '(') paren++
      else if (ch === ')') paren--
      else if (ch === '[') bracket++
      else if (ch === ']') bracket--
      else if (ch === ';' && brace === 0 && paren === 0 && bracket === 0) {
        const out = clean.slice(start, i)
        i++
        return out
      }
      i++
    }
    return clean.slice(start)
  }

  while (i < len) {
    skipWs()
    if (i >= len) break
    const rest = clean.slice(i)
    const ifaceMatch = rest.match(
      /^(export\s+)?(declare\s+)?interface\s+(\w+)(?:<[^>]*>)?(?:\s+extends\s+([^{]+))?\s*(?=\{)/,
    )
    if (ifaceMatch) {
      i += ifaceMatch[0].length
      const body = readBalanced('{', '}')
      types.set(ifaceMatch[3], {
        kind: 'interface',
        exported: Boolean(ifaceMatch[1]),
        extendsClause: ifaceMatch[4]?.trim() ?? '',
        body,
        file,
      })
      continue
    }
    const typeMatch = rest.match(/^(export\s+)?(declare\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*/)
    if (typeMatch) {
      i += typeMatch[0].length
      const rhs = readUntilSemi().trim()
      types.set(typeMatch[3], {
        kind: 'type',
        exported: Boolean(typeMatch[1]),
        rhs,
        file,
      })
      continue
    }
    const nextSemi = clean.indexOf(';', i)
    if (nextSemi === -1) break
    i = nextSemi + 1
  }
  return types
}

function parseObjectMembers(body: string) {
  const inner = body.slice(1, -1)
  const props = new Map<string, PropInfo>()
  for (const stmt of splitTopLevel(inner, ';')) {
    const trimmed = stmt.trim()
    if (!trimmed || trimmed.startsWith('[')) continue
    const match = trimmed.match(/^(?:readonly\s+)?(?:'([^']+)'|"([^"]+)"|(\w+))(\?)?\s*:/)
    if (!match) continue
    const name = match[1] ?? match[2] ?? match[3]
    const optional = Boolean(match[4])
    const typeStr = trimmed.slice(match[0].length).trim()
    props.set(name, { required: !optional, typeStr })
  }
  return props
}

function parseStringLiteralUnion(expr: string) {
  return new Set([...expr.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]))
}

function loadDeclarations() {
  const allTypes = new Map<string, ParsedDecl>()
  const fileTypes = new Map<string, Map<string, ParsedDecl>>()
  for (const name of readdirSync(distDir)) {
    if (!name.endsWith('.d.ts') || name === 'index.d.ts') continue
    const file = join(distDir, name)
    const parsed = parseDeclFile(file, readFileSync(file, 'utf8'))
    fileTypes.set(file, parsed)
    for (const [typeName, decl] of parsed) {
      if (decl.exported) allTypes.set(typeName, decl)
    }
  }
  return { allTypes, fileTypes }
}

function resolveExpression(
  expr: string,
  scope: Map<string, ParsedDecl> | undefined,
  allTypes: Map<string, ParsedDecl>,
  fileTypes: Map<string, Map<string, ParsedDecl>>,
  visited: Set<string>,
): ResolvedProps {
  const trimmed = expr.trim()
  const props = new Map<string, PropInfo>()
  let extendsExternal = false

  if (trimmed === 'never') return { props, extendsExternal }

  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    let depth = 0
    let wraps = true
    for (let i = 0; i < trimmed.length - 1; i++) {
      if (trimmed[i] === '(') depth++
      else if (trimmed[i] === ')') {
        depth--
        if (depth === 0) {
          wraps = false
          break
        }
      }
    }
    if (wraps) return resolveExpression(trimmed.slice(1, -1), scope, allTypes, fileTypes, visited)
  }

  // Conditional type: A extends B ? C : D. Drop an uninhabited `: never` branch.
  const condMatch = trimmed.match(/^.+\bextends\b.+\?([\s\S]+):([\s\S]+)$/)
  if (condMatch && !trimmed.startsWith('{')) {
    const left = condMatch[1].trim()
    const right = condMatch[2].trim()
    if (right === 'never') {
      return resolveExpression(left, scope, allTypes, fileTypes, visited)
    }
    const leftResolved = resolveExpression(left, scope, allTypes, fileTypes, new Set(visited))
    const rightResolved = resolveExpression(right, scope, allTypes, fileTypes, new Set(visited))
    extendsExternal = leftResolved.extendsExternal || rightResolved.extendsExternal
    for (const key of new Set([...leftResolved.props.keys(), ...rightResolved.props.keys()])) {
      const a = leftResolved.props.get(key)
      const b = rightResolved.props.get(key)
      props.set(key, {
        required: Boolean(a?.required && b?.required),
        typeStr: a?.typeStr ?? b?.typeStr ?? '',
      })
    }
    return { props, extendsExternal }
  }

  const unionParts = splitTopLevel(trimmed, '|')
  if (unionParts.length > 1) {
    const branches = unionParts.map((part) =>
      resolveExpression(part, scope, allTypes, fileTypes, new Set(visited)),
    )
    extendsExternal = branches.some((branch) => branch.extendsExternal)
    const allKeys = new Set(branches.flatMap((branch) => [...branch.props.keys()]))
    for (const key of allKeys) {
      const realBranches = branches.filter((branch) => {
        const info = branch.props.get(key)
        return info && info.typeStr !== 'never'
      })
      if (realBranches.length === 0) continue
      const requiredInAll = branches.every((branch) => {
        const info = branch.props.get(key)
        return Boolean(info && info.required && info.typeStr !== 'never')
      })
      props.set(key, {
        required: requiredInAll,
        typeStr: realBranches[0].props.get(key)?.typeStr ?? '',
      })
    }
    return { props, extendsExternal }
  }

  const interParts = splitTopLevel(trimmed, '&')
  if (interParts.length > 1) {
    for (const part of interParts) {
      const resolved = resolveExpression(part, scope, allTypes, fileTypes, new Set(visited))
      extendsExternal = extendsExternal || resolved.extendsExternal
      for (const [key, info] of resolved.props) props.set(key, info)
    }
    return { props, extendsExternal }
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return { props: parseObjectMembers(trimmed), extendsExternal }
  }

  const omitPick = trimmed.match(/^(Omit|Pick)<([\s\S]+)>$/)
  if (omitPick) {
    const args = splitTopLevel(omitPick[2], ',')
    if (args.length === 2) {
      const base = resolveExpression(args[0], scope, allTypes, fileTypes, new Set(visited))
      const keys = parseStringLiteralUnion(args[1])
      extendsExternal = base.extendsExternal
      for (const [key, info] of base.props) {
        if (omitPick[1] === 'Omit' ? !keys.has(key) : keys.has(key)) props.set(key, info)
      }
    }
    return { props, extendsExternal }
  }

  const genericRef = trimmed.match(/^([\w.]+)(?:<([\s\S]+)>)?$/)
  if (genericRef) {
    const refName = genericRef[1]
    if (visited.has(refName)) return { props, extendsExternal }
    const target = scope?.get(refName) ?? allTypes.get(refName)
    if (!target) {
      // External type such as Props<'button'>, StyledProps<'div'>, or a Remix UI primitive context.
      return { props, extendsExternal: true }
    }
    const nextVisited = new Set(visited)
    nextVisited.add(refName)
    const nextScope = fileTypes.get(target.file)
    if (target.kind === 'interface') {
      if (target.extendsClause) {
        for (const base of splitTopLevel(target.extendsClause, ',')) {
          const resolved = resolveExpression(
            base,
            nextScope,
            allTypes,
            fileTypes,
            new Set(nextVisited),
          )
          extendsExternal = extendsExternal || resolved.extendsExternal
          for (const [key, info] of resolved.props) props.set(key, info)
        }
      }
      for (const [key, info] of parseObjectMembers(target.body)) props.set(key, info)
      return { props, extendsExternal }
    }
    return resolveExpression(target.rhs, nextScope, allTypes, fileTypes, nextVisited)
  }

  return { props, extendsExternal: true }
}

// Standard HTML / Remix styling passthrough attributes that components sometimes
// redeclare for narrower typing; docs note these once in apiDescription.
const htmlPassthrough = new Set([
  'class',
  'className',
  'style',
  'id',
  'aria-describedby',
  'aria-invalid',
])

// Intentional omissions where a secondary section only lists its delta over a primary
// table on the same page, or a compatibility field is ignored at runtime.
const allowedOmissions: Record<string, ReadonlySet<string>> = {
  // RoutedDataTable sits directly under DataTable and documents only its routed props.
  'data-table:RoutedDataTable': new Set([
    'label',
    'rows',
    'columns',
    'rowKey',
    'pageSize',
    'size',
    'freezeRowHeader',
    'filterAction',
    'loading',
    'rowActions',
    'rowSelection',
    'paginationLabel',
    'rowCount',
  ]),
  // BarChartSeriesItem accepts an optional `value` only so BarChartItem is assignable; it is ignored.
  'bar-chart:BarChartSeriesItem': new Set(['value']),
}

it('keeps component API tables aligned with exported TypeScript prop names and requiredness', () => {
  const { allTypes, fileTypes } = loadDeclarations()
  const issues: string[] = []

  for (const [slug, sections] of Object.entries(componentApi)) {
    for (const section of sections) {
      const typeName = allTypes.has(`${section.name}Props`)
        ? `${section.name}Props`
        : allTypes.has(section.name)
          ? section.name
          : null
      if (!typeName) continue

      const decl = allTypes.get(typeName)!
      const resolved = resolveExpression(
        typeName,
        fileTypes.get(decl.file),
        allTypes,
        fileTypes,
        new Set(),
      )
      const allowed = allowedOmissions[`${slug}:${section.name}`]
      const docProps = new Map<string, { required: boolean }>()
      for (const prop of section.props) {
        for (const name of prop.name.split('/').map((part) => part.trim())) {
          docProps.set(name, { required: prop.required })
        }
      }

      for (const [name, info] of resolved.props) {
        if (htmlPassthrough.has(name) || allowed?.has(name)) continue
        const doc = docProps.get(name)
        if (!doc) {
          issues.push(`${slug}.${section.name}: missing documented prop "${name}"`)
        } else if (doc.required !== info.required) {
          issues.push(
            `${slug}.${section.name}.${name}: requiredness mismatch (TS=${info.required}, docs=${doc.required})`,
          )
        }
      }

      if (!resolved.extendsExternal) {
        for (const name of docProps.keys()) {
          if (!resolved.props.has(name)) {
            issues.push(
              `${slug}.${section.name}: documented prop "${name}" not found on ${typeName}`,
            )
          }
        }
      }
    }
  }

  assert.deepEqual(issues, [])
})

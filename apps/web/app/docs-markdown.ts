import { Kbd } from '@rtzll/reflow'
import { Fragment, type RemixNode } from 'remix/component'
import { catalog } from './catalog.tsx'
import { apiDescription, componentReference } from './component-reference.ts'
import { defaultPreviewValues, previewCode } from './public/documentation-code.ts'
import {
  SystemInstallation,
  reflowInstallCommand,
  skillInstallCommand,
} from './public/install-prompt.tsx'
import { SkillComparison, skillContent } from './public/skill-page.tsx'
import { CompactRegionDemo } from './public/system-size-toolbar.tsx'
import { RevealPresetDemo } from './public/system-reveal-demo.tsx'
import {
  HeadingDemo,
  HoverComparisonFrame,
  MotionDemo,
  MotionReference,
  SystemFrame,
  SystemSection,
  TokenTable,
  TypographyComparison,
  motionTiers,
  systemContent,
} from './public/system-page.tsx'
import { routes } from './routes.ts'
import {
  CopyCode,
  introductionContent,
  introductionSummary,
  type ShowcaseComponent,
} from './ui/site.tsx'

function backticks(text: string, minimum: number) {
  const width = (text.match(/`+/g) ?? []).reduce(
    (size, run) => Math.max(size, run.length + 1),
    minimum,
  )
  return '`'.repeat(width)
}

function fence(text: string, language: string) {
  const marker = backticks(text, 3)
  return `${marker}${language}\n${text}\n${marker}`
}

function inlineCode(text: string) {
  const marker = backticks(text, 1)
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : ''
  return marker + pad + text + pad + marker
}

function table(headings: readonly string[], rows: readonly (readonly string[])[]) {
  const row = (cells: readonly string[]) =>
    '| ' + cells.map((cell) => cell.replaceAll('|', '\\|')).join(' | ') + ' |'
  return [row(headings), row(headings.map(() => '---')), ...rows.map(row)].join('\n')
}

// Read the guides' authored JSX. A live preview contributes its published sample
// or reference values; its controls and demonstration data belong to the browser.
function guideText(node: RemixNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map(guideText).join('')
  if (typeof node !== 'object') return String(node)
  const { type, props } = node
  const childNodes: RemixNode = props.children
  const children = () => guideText(childNodes)
  switch (type) {
    case Fragment:
    case 'div':
    case 'section':
      return children()
    case 'ul':
    case 'ol': {
      const items = Array.isArray(childNodes) ? childNodes : [childNodes]
      return (
        items
          .map((item, index) => {
            const prefix = type === 'ol' ? `${index + 1}.` : '-'
            return prefix + ' ' + guideText(item).trim()
          })
          .join('\n') + '\n\n'
      )
    }
    case 'span':
      return props['aria-hidden'] ? '' : children()
    case 'p':
      return children().trim() + '\n\n'
    case 'h2':
    case 'h3':
      return `${type === 'h2' ? '##' : '###'} ${children()}\n\n`
    case 'a': {
      const href = String(props.href)
      const target =
        href === routes.docs.href() || /^\/docs\/[\w-]+$/.test(href) ? href + '.md' : href
      return `[${children()}](${target})`
    }
    case 'kbd':
    case 'code':
      return inlineCode(children())
    case Kbd: {
      const keys = props.keys
      if (keys !== undefined) {
        const list = typeof keys === 'string' ? [keys] : (keys as readonly string[])
        return inlineCode(list.join(' '))
      }
      return inlineCode(children())
    }
    case 'strong':
      return `**${children()}**`
    case 'li': {
      const parts = Array.isArray(childNodes) ? childNodes : [childNodes]
      return parts
        .map((part) => {
          const paragraph =
            part != null && typeof part === 'object' && !Array.isArray(part) && part.type === 'p'
          return paragraph ? ' ' + guideText(part).trim() : guideText(part)
        })
        .join('')
        .trim()
    }
    case SystemSection:
      return (
        [`## ${props.title}`, props.description, children().trim()].filter(Boolean).join('\n\n') +
        '\n\n'
      )
    case CopyCode:
    case HoverComparisonFrame:
    case MotionDemo:
    case SystemFrame:
      return fence(props.code, props.language ?? 'tsx') + '\n\n'
    case SystemInstallation:
      return (
        '## Installation\n\n' +
        fence(props.skill ? skillInstallCommand : reflowInstallCommand, 'sh') +
        '\n\n'
      )
    case TokenTable:
      return (
        table(
          props.headings ?? ['Token', 'Default', 'Compact'],
          props.rows.map(([name, value, last]: string[]) => [
            inlineCode(name),
            value,
            last ?? value,
          ]),
        ) + '\n\n'
      )
    case MotionReference:
      return (
        table(
          ['Speed', 'Enter', 'Exit', 'Use for'],
          motionTiers.map(({ speed, timing, exit, usage }) => [
            speed,
            `motion.${speed} (${timing})`,
            `motionExit.${speed} (${exit}, ease-out)`,
            usage,
          ]),
        ) + '\n\n'
      )
    case HeadingDemo:
    case CompactRegionDemo:
    case RevealPresetDemo:
    case SkillComparison:
    case TypographyComparison:
      // These specimens are described by their surrounding section.
      return ''
    default:
      throw new Error(
        `Missing Markdown representation for ${typeof type === 'string' ? type : type.name}`,
      )
  }
}

export function introductionMarkdown() {
  return `# Introduction\n\n${introductionSummary}\n\n${guideText(introductionContent()).trim()}\n`
}

export function pageMarkdown(component: ShowcaseComponent) {
  const { name, slug, description } = component
  const blocks = ['# ' + (slug === 'skill' ? '/reflow skill' : name), description]
  if (component.category === 'system') {
    const guide = slug === 'skill' ? skillContent() : systemContent(slug)
    if (!guide) throw new Error(`Missing guide content for ${slug}`)
    blocks.push(guideText(guide).trim())
  } else {
    const { importCode, playground, examples, api } = componentReference(component)
    blocks.push('## Installation', fence(importCode, 'tsx'))
    if (playground) {
      const code = previewCode(playground, defaultPreviewValues(slug))
      blocks.push('## ' + playground.title, fence(code, 'tsx'))
    }
    for (const example of examples) {
      blocks.push('## ' + example.title)
      if (example.description) blocks.push(example.description)
      blocks.push(fence(previewCode(example, undefined), 'tsx'))
    }
    if (api.length) blocks.push('## API Reference', apiDescription)
    for (const section of api) {
      blocks.push('### ' + section.name)
      blocks.push(
        section.props
          .map((prop) => {
            const details = [inlineCode(prop.type)]
            if (prop.required) details.push('required')
            if (prop.defaultValue !== undefined)
              details.push('default ' + inlineCode(prop.defaultValue))
            return `- ${inlineCode(prop.name)} (${details.join(', ')}). ${prop.description}`
          })
          .join('\n'),
      )
    }
  }
  return blocks.join('\n\n') + '\n'
}

export function docsIndex(origin: URL) {
  const link = (title: string, path: string, description: string) =>
    `- [${title}](${new URL(path, origin).href}): ${description}`
  const entries = (system: boolean) =>
    catalog
      .filter((entry) => (entry.category === 'system') === system)
      .map((entry) =>
        link(entry.name, routes.componentMarkdown.href({ slug: entry.slug }), entry.description),
      )
      .join('\n')
  return (
    [
      '# Reflow',
      '> Reflow is a native Remix 3 UI library with accessible components, shared theme tokens, and motion.',
      '## Getting started',
      link(
        'Introduction',
        routes.docsMarkdown.href(),
        'Install Reflow, set up styles and the browser runtime, and learn the design principles.',
      ),
      '## Components',
      entries(false),
      '## Systems and skill',
      entries(true),
    ].join('\n\n') + '\n'
  )
}

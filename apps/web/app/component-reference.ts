import { componentApi, componentDefaults } from './docs-data.ts'
import { componentExamples } from './public/demos/examples.ts'
import type { ShowcaseComponent } from './ui/site.tsx'

export const apiDescription =
  'Public props for the Reflow implementation. Native controls also accept their standard HTML attributes and Remix event mixes.'

export function componentReference(component: ShowcaseComponent) {
  const { name, slug, source } = component
  const module = name === 'Markdown' ? '@rtzll/reflow/markdown' : '@rtzll/reflow'
  const importCode = `import { ${name} } from '${module}'`
  const title =
    {
      'chat-message': 'Conversation',
      'color-picker': 'Default',
      dialog: 'Basic',
      'queued-stack': 'Basic',
      field: 'Form',
      slider: 'Compact',
      'thinking-steps': 'Basic',
    }[slug] ?? 'Playground'
  const playground =
    component.preview == null
      ? undefined
      : { title, slug, source, code: component.code ?? importCode }
  const examples = (componentExamples[slug] ?? []).map((example) => ({
    ...example,
    slug,
    source: ['command-menu', 'tabs'].includes(slug) ? source : undefined,
  }))
  const api = (componentApi[slug] ?? []).map((section) => ({
    name: section.name,
    props: section.props.map((prop) => ({
      ...prop,
      defaultValue: componentDefaults[section.name]?.[prop.name],
    })),
  }))
  return { module, importCode, playground, examples, api }
}

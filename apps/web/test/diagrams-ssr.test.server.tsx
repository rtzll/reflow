import { Diagram } from '@rtzll/reflow/diagrams'
import { prerenderDiagram } from '@rtzll/reflow/diagrams/ssr'
import { Markdown } from '@rtzll/reflow/markdown'
import { equal, ok } from 'remix/assert'
import { renderToString } from 'remix/component/server'
import { it } from 'remix/test'

const sampleFlow = `flowchart LR
  Server[SSR] --> Shadow[Declarative Shadow DOM]
  Shadow --> Hydrate[Client hydrate]`

it('prerenderDiagram synchronously outputs themeable Pele SVG with dimensions and type', () => {
  const result = prerenderDiagram(sampleFlow)
  equal(result.type, 'flowchart')
  ok(result.width > 0)
  ok(result.height > 0)
  ok(result.svg.includes('<svg'))
  ok(result.svg.includes('class="pele '))
  ok(result.svg.includes('Declarative Shadow DOM'))
})

it('Diagram server-renders pre-rendered SVG and integrates cleanly with Markdown renderCodeBlock', async () => {
  const { svg } = prerenderDiagram(sampleFlow)
  const markdown = `Architecture overview:\n\n\`\`\`mermaid\n${sampleFlow}\n\`\`\``
  const html = await renderToString(
    <Markdown
      source={markdown}
      renderCodeBlock={({ code, language, size }) =>
        language === 'mermaid' ? (
          <Diagram
            code={code}
            prerenderedSVG={svg}
            title="SSR pipeline"
            size={size}
            copyable
            showSourceToggle
          />
        ) : undefined
      }
    />,
  )

  ok(html.includes('data-rf-diagram-ready'))
  ok(html.includes('SSR pipeline'))
  ok(html.includes('<svg'))
  ok(html.includes('class="pele '))
  ok(html.includes('Declarative Shadow DOM'))
})

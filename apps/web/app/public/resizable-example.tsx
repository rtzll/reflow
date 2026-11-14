import { ChatMessage, Citation, Icon, Resizable } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { citationSources } from './citation-example.tsx'

const references = [
  {
    claim: 'Dieter Rams argued for making a product as simple as possible.',
    source: citationSources[0]!,
  },
  {
    claim: 'Don Norman emphasized making possible actions easy to discover.',
    source: citationSources[1]!,
  },
]

export function DesignConversation(handle: Handle<{ showResume?: boolean }>) {
  return () => (
    <div class="example-chat-gallery">
      {handle.props.showResume && (
        <ChatMessage role="system" animate={false} icon={<Icon name="clock" />}>
          Conversation resumed
        </ChatMessage>
      )}
      <ChatMessage role="user" animate={false}>
        What makes a product easy to use?
      </ChatMessage>
      <ChatMessage role="assistant" animate={false}>
        {references.map(({ claim, source }, index) => (
          <p key={source.href}>
            {claim} <Citation index={index + 1} sources={source} />
          </p>
        ))}
      </ChatMessage>
    </div>
  )
}

export function ResizableDemo(handle: Handle<{ orientation?: 'horizontal' | 'vertical' }>) {
  return () => (
    <Resizable
      class="example-split"
      label="Resize conversation"
      orientation={handle.props.orientation}
      defaultValue={65}
      min={40}
      max={75}
      first={<DesignConversation />}
      second={
        <section class="example-split-sources" aria-label="Sources">
          <h3>Sources</h3>
          <ol>
            {references.map(({ source }) => (
              <li key={source.href}>
                <a class="rf-link" href={source.href}>
                  {source.title}
                </a>
              </li>
            ))}
          </ol>
        </section>
      }
    />
  )
}

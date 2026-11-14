import { ChatMessage, Citation, Icon, Resizable } from '@rtzll/reflow'
import type { Handle } from 'remix/component'
import { citationSources } from './citation-example.tsx'

export function ResizableDemo(handle: Handle<{ orientation?: 'horizontal' | 'vertical' }>) {
  return () => (
    <Resizable
      class="example-split"
      label="Resize conversation"
      orientation={handle.props.orientation}
      defaultValue={65}
      min={40}
      max={75}
      first={
        <div class="example-chat-gallery">
          <ChatMessage role="system" animate={false} icon={<Icon name="clock" />}>
            Conversation resumed
          </ChatMessage>
          <ChatMessage role="user" animate={false}>
            What does “good design” actually mean?
          </ChatMessage>
          <ChatMessage role="assistant" animate={false}>
            Mostly that you stop noticing it.
            <Citation index={1} sources={citationSources[0]!} /> It lets you do what you came to do,
            and it feels right while you do it.
          </ChatMessage>
          <ChatMessage role="user" animate={false}>
            So function over form?
          </ChatMessage>
          <ChatMessage role="assistant" animate={false}>
            Something that feels good to use is, in a real sense, working better.
          </ChatMessage>
        </div>
      }
      second={
        <section class="example-split-sources" aria-label="Sources">
          <h3>Sources</h3>
          <ol>
            {citationSources.map((source) => (
              <li key={source.href}>
                <a href={source.href}>{source.title}</a>
              </li>
            ))}
          </ol>
        </section>
      }
    />
  )
}

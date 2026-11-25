import {
  AskUserQuestions,
  Button,
  ChatMessage,
  InputMessage,
  ThinkingIndicator,
  ThinkingSteps,
} from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'
import type { ExampleImages } from '../../assets.ts'
import { ControlledQuestions, RichThinkingSteps } from '../advanced-demos.tsx'
import { ChatExample } from '../chat-example.tsx'
import { ChatLayoutDemo } from '../chat-layout-example.tsx'
import { CitationDemo } from '../citation-example.tsx'
import { composerTriggers, inputMessagePrompts } from '../component-example-data.ts'
import { ConfirmationDemo } from '../confirmation-example.tsx'
import { ModelPicker } from '../model-picker.tsx'
import { questionExample } from '../question-example-data.ts'

export const conversationDemoSlugs = new Set([
  'ask-user-questions',
  'chat-layout',
  'chat-message',
  'citation',
  'confirmation',
  'input-message',
  'thinking-indicator',
  'thinking-steps',
  'trigger-menu',
])

// Example attachments for the InputMessage demo: one image, which shows a
// thumbnail, and three files that show their name and type. A fixed
// lastModified keeps the server and browser renders keyed alike.
function sampleAttachments() {
  const lastModified = Date.UTC(2026, 0, 1)
  const sketch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#dbe6ff"/><circle cx="56" cy="24" r="10" fill="#6b97ff"/><path d="M0 64 24 38l18 18 12-10 26 22v12H0z" fill="#3d5fb8"/></svg>`
  return [
    new File([sketch], 'landscape.svg', { type: 'image/svg+xml', lastModified }),
    new File(['# Meeting notes'], 'meeting-notes.md', { type: 'text/markdown', lastModified }),
    new File(['audio'], 'recording.ogg', { type: 'audio/ogg', lastModified }),
    new File(['%PDF'], 'quarterly-report.pdf', { type: 'application/pdf', lastModified }),
  ]
}

export function ConversationDemos(
  handle: Handle<{ slug: string; variant: string; images: ExampleImages }>,
) {
  let output = ''
  let streaming = true
  let lastQueuedId: string | undefined
  let attachmentFiles = sampleAttachments()

  const say = (value: string) => {
    output = value
    handle.update()
  }

  return () => {
    const { slug, variant, images } = handle.props
    if (slug === 'ask-user-questions' && variant === 'controlled') return <ControlledQuestions />
    if (slug === 'thinking-steps' && ['streaming-text', 'images', 'rich'].includes(variant))
      return <RichThinkingSteps variant={variant} previewImage={images.thinkingPreview} />

    switch (slug) {
      case 'ask-user-questions':
        return (
          <div class="doc-demo-wide">
            <AskUserQuestions
              questions={questionExample(variant)}
              onComplete={(answers) =>
                say(
                  `Saved ${Object.keys(answers).length} ${Object.keys(answers).length === 1 ? 'answer' : 'answers'}.`,
                )
              }
            />
            <output class="doc-demo-feedback" aria-live="polite">
              {output}
            </output>
          </div>
        )
      case 'chat-layout':
        return <ChatLayoutDemo variant={variant} />
      case 'chat-message':
        return (
          <ChatExample
            variant={
              variant === 'attachments' ? 'attachments' : variant === 'system' ? 'system' : 'roles'
            }
          />
        )
      case 'citation':
        return <CitationDemo variant={variant} />
      case 'confirmation':
        return <ConfirmationDemo variant={variant} />
      case 'input-message':
        return (
          <div class="doc-demo-composer">
            <>
              <InputMessage
                suggestions={
                  variant === 'suggested-messages'
                    ? ['Summarize this document', 'Plan my next project']
                    : variant === 'suggestions'
                      ? inputMessagePrompts
                      : undefined
                }
                history={variant === 'history' ? ['Draft a plan', 'Review the design'] : undefined}
                status={variant === 'streaming' && streaming ? 'streaming' : 'idle'}
                onStop={() => {
                  streaming = false
                  handle.update()
                }}
                placeholderSuggestion={
                  variant === 'suggestions' ? 'Why is every other input box so stiff?' : undefined
                }
                attachments={!['basic', 'left', 'right'].includes(variant)}
                rightActions={
                  variant === 'right' ? (
                    <ModelPicker
                      onChange={({ model, effort }) => say(`Switched to ${model}, ${effort}.`)}
                    />
                  ) : undefined
                }
                maxFiles={variant === 'attachments' ? 4 : 3}
                pasteAsFile={variant === 'attachments' ? 1000 : undefined}
                voice={variant === 'attachments'}
                files={variant === 'attachments' ? attachmentFiles : undefined}
                onFilesChange={
                  variant === 'attachments'
                    ? (next) => {
                        attachmentFiles = next
                        handle.update()
                      }
                    : undefined
                }
                disabled={variant === 'disabled'}
                actions={
                  variant === 'actions' || variant === 'left' ? (
                    <Button
                      variant="ghost"
                      size="compact"
                      mix={on('click', () => say('Workspace context attached.'))}
                    >
                      Attach context
                    </Button>
                  ) : undefined
                }
                transitionMessages={variant === 'streaming'}
                onSend={async ({ text, files, queuedId }) => {
                  if (variant === 'send') await new Promise((resolve) => setTimeout(resolve, 800))
                  output = text || `${files.length} attachments sent.`
                  lastQueuedId = queuedId
                  await handle.update()
                }}
              />
              {output && (
                <ChatMessage role="user" transitionId={lastQueuedId} animate={!lastQueuedId}>
                  {output}
                </ChatMessage>
              )}
            </>
          </div>
        )
      case 'thinking-indicator':
        return (
          <ThinkingIndicator
            showIcon={variant !== 'text'}
            labels={
              variant === 'labels' ? ['Researching', 'Reading', 'Writing'] : ['Thinking', 'Working']
            }
            interval={2500}
          />
        )
      case 'thinking-steps':
        if (variant === 'custom-content') {
          return (
            <ThinkingSteps
              label="Release checks"
              heading={<strong>Release checks · 2 passed</strong>}
              defaultOpen
            >
              <ul>
                <li>Build verified</li>
                <li>Browser smoke test passed</li>
              </ul>
            </ThinkingSteps>
          )
        }
        if (variant === 'minimal') {
          return (
            <ThinkingSteps
              label="Thinking"
              variant="timeline"
              steps={[
                { value: 'command', title: 'Ran a command' },
                { value: 'done', title: 'Done' },
              ]}
            />
          )
        }
        return <RichThinkingSteps variant={variant} previewImage={images.thinkingPreview} />
      case 'trigger-menu':
        return (
          <div class="example-composer">
            <InputMessage
              triggers={composerTriggers}
              attachments={false}
              placeholder="Type @ or /"
              onSend={({ text }) => say(text)}
            />
            {output && <ChatMessage role="user">{output}</ChatMessage>}
          </div>
        )
    }
    return null
  }
}

import type { Handle } from 'remix/component'
import type { ExampleImages } from '../assets.ts'
import { ConversationDemos, conversationDemoSlugs } from './demos/conversation.tsx'
import { DisplayDemos, displayDemoSlugs } from './demos/display.tsx'
import { FormDemos, formDemoSlugs } from './demos/forms.tsx'
import { OverlayAndNavDemos, overlayAndNavDemoSlugs } from './demos/overlays-and-navigation.tsx'

export { componentExamples, type DocumentationExample } from './demos/examples.ts'

export function ComponentDemo(
  handle: Handle<{ slug: string; variant: string; images: ExampleImages }>,
) {
  return () => {
    const { slug, variant, images } = handle.props
    if (formDemoSlugs.has(slug)) return <FormDemos slug={slug} variant={variant} />
    if (displayDemoSlugs.has(slug))
      return <DisplayDemos slug={slug} variant={variant} images={images} />
    if (overlayAndNavDemoSlugs.has(slug))
      return <OverlayAndNavDemos slug={slug} variant={variant} images={images} />
    if (conversationDemoSlugs.has(slug))
      return <ConversationDemos slug={slug} variant={variant} images={images} />
    return null
  }
}

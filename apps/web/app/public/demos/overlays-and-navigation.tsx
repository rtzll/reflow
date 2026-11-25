import { Accordion, AlertDialog, Button, Dialog, Textarea, Tooltip } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'
import type { ExampleImages } from '../../assets.ts'
import { WorkspaceSidebar } from '../advanced-demos.tsx'
import { BreadcrumbDemo } from '../breadcrumb-example.tsx'
import { CarouselDemo } from '../carousel-demo.tsx'
import { CarouselExample } from '../carousel-example.tsx'
import {
  accordionItems,
  multipleAccordionItems,
  rowHighlightAccordionItems,
  standaloneAccordionItems,
} from '../component-example-data.ts'
import { DrawerDemo } from '../drawer-example.tsx'
import { DropdownDemo } from '../dropdown-example.tsx'
import { HoverCardDemo } from '../hover-card-example.tsx'
import { PopoverDemo } from '../popover-example.tsx'
import { CommandVariants } from '../project-commands.tsx'
import { ProjectTabs } from '../project-tabs.tsx'
import { ResizableDemo } from '../resizable-example.tsx'
import { SettingsDialogExample } from '../settings-dialog-example.tsx'
import { SidebarDemo } from '../sidebar-demos.tsx'
import { setShowcaseTheme } from '../site-settings.ts'
import { ToasterDemo } from '../toaster-example.tsx'

export const overlayAndNavDemoSlugs = new Set([
  'accordion',
  'alert-dialog',
  'breadcrumb',
  'carousel',
  'carousel-dots',
  'command-menu',
  'dialog',
  'drawer',
  'dropdown',
  'hover-card',
  'popover',
  'resizable',
  'sidebar',
  'tabs',
  'toaster',
  'tooltip',
])

export function OverlayAndNavDemos(
  handle: Handle<{ slug: string; variant: string; images: ExampleImages }>,
) {
  let editingNotes = true

  return () => {
    const { slug, variant, images } = handle.props
    if (slug === 'sidebar' && variant === 'workspace') return <WorkspaceSidebar />

    switch (slug) {
      case 'accordion':
        return variant === 'standalone' ? (
          <div class="doc-accordion-standalone">
            <Accordion defaultValue="item-1" items={standaloneAccordionItems} />
          </div>
        ) : variant === 'multiple' ? (
          <Accordion
            type="multiple"
            defaultValue={['item-1', 'item-3']}
            items={multipleAccordionItems}
          />
        ) : variant === 'separated' ? (
          <Accordion defaultValue="item-1" highlight="trigger" items={rowHighlightAccordionItems} />
        ) : (
          <Accordion defaultValue="item-1" items={accordionItems} />
        )
      case 'alert-dialog':
        return editingNotes ? (
          <div class="example-stack">
            <Textarea aria-label="Project notes" defaultValue="Review the release notes." />
            <AlertDialog
              trigger="Leave editor"
              title="Leave without saving?"
              description="Your unsaved changes will be discarded."
              cancelLabel="Keep editing"
              confirmLabel="Leave"
              onConfirm={() => {
                editingNotes = false
                void handle.update()
              }}
            />
          </div>
        ) : (
          <Button
            mix={on('click', () => {
              editingNotes = true
              void handle.update()
            })}
          >
            Reopen editor
          </Button>
        )
      case 'breadcrumb':
        return <BreadcrumbDemo variant={variant} />
      case 'carousel':
        return <CarouselDemo variant={variant} />
      case 'carousel-dots':
        return <CarouselExample autoplay={variant === 'autoplay'} />
      case 'command-menu':
        return (
          <div class="doc-demo-wide">
            <CommandVariants variant={variant} setTheme={setShowcaseTheme} />
          </div>
        )
      case 'dialog':
        if (variant === 'sizes')
          return (
            <div class="doc-demo-row">
              {(['sm', 'lg', 'xl'] as const).map((size, position) => (
                <Dialog
                  key={size}
                  size={size}
                  title={['Small dialog', 'Large dialog', 'Extra large dialog'][position]}
                  trigger={['Small', 'Large', 'Extra large'][position]}
                  description={
                    [
                      '400px: a confirmation, 1 field, a short message.',
                      '540px: a short form, or a longer confirmation.',
                      '880px: 2 columns, a table, or a sidebar beside a panel.',
                    ][position]
                  }
                  footer={(close) => (
                    <Button variant="ghost" mix={on('click', close)}>
                      Close
                    </Button>
                  )}
                />
              ))}
            </div>
          )
        return <SettingsDialogExample />
      case 'drawer':
        return <DrawerDemo variant={variant} />
      case 'dropdown':
        return <DropdownDemo variant={variant} />
      case 'hover-card':
        return <HoverCardDemo variant={variant} />
      case 'popover':
        return <PopoverDemo variant={variant} />
      case 'resizable':
        return <ResizableDemo orientation="vertical" />
      case 'sidebar':
        if (variant !== 'dialog')
          return <SidebarDemo variant={variant} avatar={images.sidebarAvatar} />
        return <SettingsDialogExample />
      case 'tabs':
        return (
          <ProjectTabs
            icons={variant === 'icons'}
            activeLabel={variant === 'active-label'}
            variant={variant === 'underline' ? 'underline' : 'pill'}
          />
        )
      case 'toaster':
        return <ToasterDemo variant={variant} />
      case 'tooltip':
        if (variant === 'placement')
          return (
            <div class="doc-demo-row">
              {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                <Tooltip
                  key={side}
                  side={side}
                  content={side[0].toUpperCase() + side.slice(1)}
                  renderTrigger={(props) => (
                    <Button {...props} variant="secondary">
                      {side[0].toUpperCase() + side.slice(1)}
                    </Button>
                  )}
                />
              ))}
            </div>
          )
        if (variant === 'cursor')
          return (
            <div class="doc-tooltip-follow">
              <Tooltip
                followCursor="x"
                side="top"
                content="Following x"
                renderTrigger={(props) => (
                  <div {...props} class="doc-tooltip-follow-x" tabIndex={0}>
                    Move along me
                  </div>
                )}
              />
              <Tooltip
                followCursor="y"
                side="right"
                content="Following y"
                renderTrigger={(props) => (
                  <div {...props} class="doc-tooltip-follow-y" tabIndex={0}>
                    <span>Move along me</span>
                  </div>
                )}
              />
            </div>
          )
        if (variant === 'delay')
          return (
            <div class="doc-demo-row">
              <Tooltip
                delayDuration={0}
                content="Instant"
                renderTrigger={(props) => (
                  <Button {...props} variant="secondary">
                    No delay
                  </Button>
                )}
              />
              <Tooltip
                delayDuration={500}
                content="Slow"
                renderTrigger={(props) => (
                  <Button {...props} variant="secondary">
                    500ms delay
                  </Button>
                )}
              />
            </div>
          )
        return (
          <Tooltip
            content={
              variant === 'rich' ? (
                <span class="tooltip-rich">
                  <span class="tooltip-rich-title">Keyboard shortcut</span>
                  <span class="tooltip-rich-hint">⌘ + S</span>
                </span>
              ) : (
                'Save your changes'
              )
            }
            renderTrigger={(props) => (
              <Button {...props}>{variant === 'rich' ? 'Save' : 'Hover me'}</Button>
            )}
          />
        )
    }
    return null
  }
}

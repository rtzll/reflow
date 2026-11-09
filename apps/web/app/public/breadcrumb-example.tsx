import { Breadcrumb, Icon, type BreadcrumbItem } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const sections = ['Components', 'Systems', 'Blocks']

const basic: BreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Components', href: '#components' },
  { label: 'Breadcrumb' },
]

const withIcons: BreadcrumbItem[] = [
  { label: 'Home', href: '#home', icon: <Icon name="home" /> },
  { label: 'Projects', href: '#projects', icon: <Icon name="folder" /> },
  { label: 'Q3 report.pdf', icon: <Icon name="file" /> },
]

const long: BreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Quarterly planning and roadmap reviews', href: '#planning' },
  { label: 'Engineering hiring plan for the second half of the year' },
]

const deep: BreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Workspace', href: '#workspace' },
  { label: 'Engineering', href: '#engineering' },
  { label: 'Platform', href: '#platform' },
  { label: 'Breadcrumb' },
]

const showcaseSteps: BreadcrumbItem[] = [
  { label: 'Home', href: '#home' },
  { label: 'Projects', href: '#projects' },
  { label: 'Website', href: '#website' },
  { label: 'Design', href: '#design' },
]
const showcaseSections = ['Drafts', 'Published', 'Archive']

export interface BreadcrumbDemoProps {
  variant: string
  size?: 'default' | 'compact'
  separator?: 'chevron' | 'slash'
  icons?: boolean
}

/** The Breadcrumb docs demos and playground: every trail is a real Reflow Breadcrumb. */
export function BreadcrumbDemo(handle: Handle<BreadcrumbDemoProps>) {
  let section = sections[0]
  let showcaseSection = showcaseSections[0]
  return () => {
    const { variant, size } = handle.props
    const sectionMenu: BreadcrumbItem = {
      label: section,
      menu: sections.map((name) => ({
        value: name,
        label: name,
        type: 'radio',
        checked: name === section,
      })),
      onMenuSelect: (value) => {
        section = value
        void handle.update()
      },
    }
    switch (variant) {
      // The gallery card, as in the reference: the trail fits its card, middle
      // steps fold behind the ellipsis as the card narrows, and the last step
      // opens its sections on hover.
      case 'showcase':
        return (
          <div class="example-breadcrumb">
            <Breadcrumb
              collapse
              openOnHover
              size={size}
              items={[
                ...showcaseSteps,
                {
                  label: showcaseSection,
                  menu: showcaseSections.map((name) => ({
                    value: name,
                    label: name,
                    type: 'radio',
                    checked: name === showcaseSection,
                  })),
                  onMenuSelect: (value) => {
                    showcaseSection = value
                    void handle.update()
                  },
                },
                { label: 'Roadmap.md' },
              ]}
            />
          </div>
        )
      case 'icons':
        return <Breadcrumb items={withIcons} size={size} />
      case 'long':
        return (
          <div class="doc-demo-breadcrumb-narrow">
            <Breadcrumb items={long} size={size} />
          </div>
        )
      case 'menu':
        return (
          <Breadcrumb
            openOnHover
            size={size}
            items={[basic[0], sectionMenu, { label: 'Breadcrumb' }]}
          />
        )
      case 'click':
        return <Breadcrumb size={size} items={[basic[0], sectionMenu, { label: 'Breadcrumb' }]} />
      case 'collapse':
        return (
          <div class="doc-demo-breadcrumb-resize">
            <Breadcrumb collapse openOnHover items={deep} size={size} />
          </div>
        )
      case 'separator':
        return <Breadcrumb items={basic} separator={<span>/</span>} size={size} />
      case 'compact':
        return <Breadcrumb items={withIcons} size="compact" />
      case 'playground':
        return (
          <Breadcrumb
            size={size}
            openOnHover
            separator={handle.props.separator === 'slash' ? <span>/</span> : undefined}
            items={(handle.props.icons ? withIcons : basic).map((item, index) =>
              index === 1 && !handle.props.icons ? sectionMenu : item,
            )}
          />
        )
      default:
        return <Breadcrumb items={basic} size={size} />
    }
  }
}

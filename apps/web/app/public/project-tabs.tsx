import { Icon, Tabs, type TabsProps } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

type ProjectTabsProps = Pick<TabsProps, 'variant' | 'size' | 'activeLabel'> & { icons?: boolean }

export function ProjectTabs(handle: Handle<ProjectTabsProps>) {
  return () => {
    const { icons, ...options } = handle.props
    return (
      <section class="example-project-tabs" aria-label="Reflow project">
        <strong>Reflow</strong>
        <Tabs
          label="Project views"
          defaultValue="files"
          {...options}
          items={[
            {
              value: 'files',
              label: 'Files',
              icon: icons || options.activeLabel ? <Icon name="folder" /> : undefined,
              panel: (
                <ul aria-label="Source files">
                  {['context-menu.tsx', 'tree.tsx', 'toolbar.tsx'].map((name) => (
                    <li key={name}>
                      <Icon name="file" />
                      <code>{name}</code>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              value: 'activity',
              label: 'Activity',
              icon: icons || options.activeLabel ? <Icon name="clock" /> : undefined,
              panel: (
                <ul aria-label="Recent activity">
                  <li>
                    <span>Added keyboard navigation</span>
                    <small>Alice</small>
                  </li>
                  <li>
                    <span>Updated the file preview</span>
                    <small>Bob</small>
                  </li>
                </ul>
              ),
            },
            {
              value: 'members',
              label: 'Members',
              icon: icons || options.activeLabel ? <Icon name="users" /> : undefined,
              panel: (
                <ul aria-label="Project members">
                  <li>
                    <span>Alice</span>
                    <small>Engineer</small>
                  </li>
                  <li>
                    <span>Bob</span>
                    <small>Designer</small>
                  </li>
                </ul>
              ),
            },
          ]}
        />
      </section>
    )
  }
}

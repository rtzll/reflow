import { Button, Icon, Input, Select, Tabs } from '@rtzll/reflow'
import { on, ref, type Handle } from 'remix/component'

const sortOptions = [
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Created' },
  { value: 'name', label: 'Name' },
]

function SizeToolbarRow(handle: Handle<{ density: 'default' | 'compact' }>) {
  let view = 'table'
  let query = ''
  let sort = 'updated'
  let showResults = false
  let showFilters = false
  let search: HTMLInputElement | undefined
  let projects = ['Design system', 'Website', 'Mobile app']
  const captureSearch = ref<HTMLInputElement>((element) => {
    search = element
  })
  function update() {
    showResults = true
    handle.update()
  }
  async function focusFilters() {
    showFilters = true
    await handle.update()
    if (!handle.signal.aborted) search?.focus()
  }

  return () => {
    const { density } = handle.props
    const height = density === 'default' ? 36 : 28
    const results = projects.filter((project) =>
      project.toLowerCase().includes(query.toLowerCase()),
    )
    if (sort === 'name') results.sort((a, b) => a.localeCompare(b))
    if (sort === 'updated') results.reverse()
    return (
      <div class="system-size-row" data-density={density}>
        <span>
          {density === 'default' ? 'Default' : 'Compact'} · {height}px
        </span>
        <div class="system-size-controls">
          <Tabs
            label={`${density} view`}
            activeLabel
            value={view}
            onValueChange={(value) => {
              view = value
              update()
            }}
            items={[
              { label: 'Table', value: 'table', icon: <Icon name="menu" /> },
              { label: 'Board', value: 'board', icon: <Icon name="file" /> },
            ]}
          />
          <div class="system-size-actions" data-show-filters={showFilters || undefined}>
            <div class="system-size-filters" id={`size-${density}-filters`}>
              <label class="system-size-search">
                <Icon name="search" />
                <Input
                  aria-label={`${density} search`}
                  placeholder="Search…"
                  value={query}
                  mix={[
                    captureSearch,
                    on<HTMLInputElement, 'input'>('input', (event) => {
                      query = event.currentTarget.value
                      update()
                    }),
                  ]}
                />
              </label>
              <Select
                label={`${density} sort order`}
                options={sortOptions}
                value={sort}
                onValueChange={(value) => {
                  sort = value ?? 'updated'
                  update()
                }}
              />
            </div>
            <Button
              variant="tertiary"
              size={density === 'default' ? 'icon' : 'icon-compact'}
              aria-label="Filter"
              aria-controls={`size-${density}-filters`}
              mix={on('click', focusFilters)}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              >
                <path d="M4 7h16M7 12h10m-7 5h4" />
              </svg>
            </Button>
            <Button
              leadingIcon={<Icon name="plus" />}
              mix={on('click', () => {
                projects = [...projects, `Project ${projects.length + 1}`]
                update()
              })}
            >
              New
            </Button>
          </div>
          <span class="system-size-guide" aria-hidden="true">
            ↕ {height}px
          </span>
        </div>
        {showResults && (
          <div class="system-size-result" data-view={view} role="status">
            {results.length
              ? results.map((project) => <span key={project}>{project}</span>)
              : 'No matching projects'}
          </div>
        )}
      </div>
    )
  }
}

export function SizeToolbar() {
  return () => (
    <div class="system-size-toolbar">
      <SizeToolbarRow density="default" />
      <SizeToolbarRow density="compact" />
    </div>
  )
}

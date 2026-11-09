import { Button, Dropdown, Icon, InputField, InputGroup, Select, Tabs } from '@rtzll/reflow'
import { on, ref, type Handle } from 'remix/component'

const sortOptions = [
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Created' },
  { value: 'name', label: 'Name' },
]

function viewIcon(path: string) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d={path} />
    </svg>
  )
}

function FilterIcon() {
  return () => (
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
  )
}

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
              { label: 'Table', value: 'table', icon: viewIcon('M3 9h18M9 9v12') },
              { label: 'Board', value: 'board', icon: viewIcon('M8 7v6m4-6v10m4-10v4') },
            ]}
          />
          <div class="system-size-actions" data-show-filters={showFilters || undefined}>
            <div class="system-size-filters" id={`size-${density}-filters`}>
              <InputGroup class="system-size-search">
                <InputField
                  label={`${density} search`}
                  labelHidden
                  icon={<Icon name="search" />}
                  placeholder="Search…"
                  value={query}
                  mix={captureSearch}
                  onChange={(value) => {
                    query = value
                    update()
                  }}
                />
              </InputGroup>
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
              <FilterIcon />
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
            <svg
              width="8"
              height={height}
              viewBox={`0 0 8 ${height}`}
              fill="none"
              stroke="currentColor"
              stroke-width="1.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d={`M4 1.5V${height - 1.5}M1.5 5 4 1.5 6.5 5M1.5 ${height - 5} 4 ${height - 1.5} 6.5 ${height - 5}`}
              />
            </svg>
            <span>{height}px</span>
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

export function CompactRegionDemo(handle: Handle) {
  let density = 'compact'
  return () => (
    <div class="site-preview-card system-density-demo">
      <div class="system-density-header">
        <Tabs
          label="Region density"
          value={density}
          onValueChange={(value) => {
            density = value
            handle.update()
          }}
          items={[
            { value: 'default', label: 'Default' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
      </div>
      <div class="system-density-stage">
        <div class="system-density-specimen">
          <div class="system-density-region" data-density={density} inert>
            <div class="system-density-toolbar">
              <Button variant="tertiary" active trailingIcon={<Icon name="chevron-down" />}>
                Last updated
              </Button>
              <Button
                variant="tertiary"
                size={density === 'compact' ? 'icon-compact' : 'icon'}
                aria-label="Filter"
              >
                <FilterIcon />
              </Button>
              <Button leadingIcon={<Icon name="plus" />}>New</Button>
            </div>
            <Dropdown
              inline
              label="Sort order"
              items={sortOptions.map((option) => ({
                ...option,
                type: 'radio',
                checked: option.value === 'updated',
              }))}
            />
          </div>
          <div class="system-density-callout" aria-hidden="true">
            <svg
              width="104"
              height="64"
              viewBox="0 0 104 64"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M100 8Q58 14 10 54m1-6-1 6 6-1" />
            </svg>
            <span>
              The menu inherits
              <br />
              the region’s density
            </span>
          </div>
          <span class="site-sr-only" role="status">
            The toolbar and sort menu use {density === 'compact' ? '28' : '36'} pixel rows.
          </span>
        </div>
      </div>
    </div>
  )
}

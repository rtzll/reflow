import { Badge, FilterBar, type FilterPreset, type FilterSuggestion } from '@rtzll/reflow'
import type { Handle } from 'remix/component'

const suggestions: readonly FilterSuggestion[] = [
  {
    key: 'status',
    description: 'Thread state',
    values: ['open', 'resolved', 'draft'],
  },
  {
    key: 'author',
    description: 'Author handle',
    values: ['alex', 'maya', 'noah', 'sara'],
  },
  {
    key: 'label',
    description: 'Topic tag',
    values: ['ssr', 'perf', 'motion', 'docs'],
  },
]

const presets: readonly FilterPreset[] = [
  { id: 'open-ssr', label: 'Open SSR', query: 'status:open label:ssr' },
  { id: 'maya', label: 'By Maya', query: 'author:maya' },
  { id: 'perf', label: 'Performance', query: 'label:perf timeout' },
]

const sampleThreads = [
  {
    id: '1',
    title: 'Fix DSD hydration flash in DiffView',
    status: 'open',
    author: 'maya',
    label: 'ssr',
  },
  {
    id: '2',
    title: 'Throttle ResizeObserver in PipelineGraph',
    status: 'open',
    author: 'alex',
    label: 'perf',
  },
  {
    id: '3',
    title: 'Document reduced-motion spring curves',
    status: 'resolved',
    author: 'noah',
    label: 'motion',
  },
  {
    id: '4',
    title: 'Add Worker peer isolation check',
    status: 'open',
    author: 'sara',
    label: 'ssr',
  },
]

/** The FilterBar example: tokenized key:value facet search with autocomplete and quick presets. */
export function FilterBarExample(
  handle: Handle<{
    size?: 'default' | 'compact'
    showPresets?: boolean
    clearable?: boolean
    disabled?: boolean
  }>,
) {
  let query = 'status:open label:ssr'

  return () => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const matches = sampleThreads.filter((thread) =>
      terms.every((term) => {
        const colon = term.indexOf(':')
        if (colon > 0) {
          const key = term.slice(0, colon)
          const val = term.slice(colon + 1)
          if (key === 'status') return thread.status === val
          if (key === 'author') return thread.author === val
          if (key === 'label') return thread.label === val
        }
        return thread.title.toLowerCase().includes(term)
      }),
    )

    return (
      <div style={{ width: 'min(100%, 560px)', display: 'grid', gap: '10px' }}>
        <FilterBar
          label="Filter discussions"
          value={query}
          suggestions={suggestions}
          presets={handle.props.showPresets === false ? undefined : presets}
          clearable={handle.props.clearable ?? true}
          disabled={Boolean(handle.props.disabled)}
          size={handle.props.size ?? 'default'}
          onValueChange={(next) => {
            query = next
            void handle.update()
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <Badge size="compact">{matches.length} matching</Badge>
          <span style={{ color: 'var(--rf-muted)' }}>
            {matches.length > 0 ? matches[0].title : 'No discussions match this query'}
          </span>
        </div>
      </div>
    )
  }
}

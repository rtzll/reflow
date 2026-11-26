import { Button, EmptyState, Icon } from '@rtzll/reflow'
import { on, type Handle } from 'remix/component'

/** The EmptyState example: toggle between an empty filtered state and a restored list note. */
export function EmptyStateExample(handle: Handle) {
  let cleared = false

  return () => (
    <div style={{ width: 'min(100%, 460px)' }}>
      {cleared ? (
        <EmptyState
          surface="outlined"
          icon={<Icon name="check" size={18} />}
          title="Filter cleared"
          description="All 5 changed files are visible in the review queue again."
          actions={
            <Button
              size="compact"
              variant="secondary"
              mix={on('click', () => {
                cleared = false
                void handle.update()
              })}
            >
              Simulate no matches
            </Button>
          }
        />
      ) : (
        <EmptyState
          surface="outlined"
          icon={<Icon name="search" size={18} />}
          title="No matching files"
          description="No changed files match “router.css”. Clear the filter to view all 5 files."
          actions={
            <Button
              size="compact"
              variant="secondary"
              mix={on('click', () => {
                cleared = true
                void handle.update()
              })}
            >
              Clear filter
            </Button>
          }
        />
      )}
    </div>
  )
}

import type { IssuePriority } from '@rtzll/reflow'

export const statuses = ['Todo', 'In progress', 'Done'] as const
export type Status = (typeof statuses)[number]

export interface Issue {
  id: string
  title: string
  description: string
  status: Status
  area: string
  owner: string
  priority?: IssuePriority
  estimate?: number
}

export const issues: Issue[] = [
  {
    id: 'AT-142',
    title: 'Keep the map in view when opening a place',
    description:
      'Opening a saved place currently resets the map to the city center. Keep the current zoom and pan just far enough to reveal the selected pin.',
    status: 'Todo',
    area: 'Maps',
    owner: 'Mina Ortiz',
    priority: 'urgent',
    estimate: 3,
  },
  {
    id: 'AT-139',
    title: 'Restore an unfinished field note',
    description:
      'Bring back the note and its attached place when a contributor reopens the editor after leaving it mid-sentence.',
    status: 'Todo',
    area: 'Field notes',
    owner: 'Leo Park',
    priority: 'high',
    estimate: 5,
  },
  {
    id: 'AT-138',
    title: 'Mark water stops on the trail map',
    description:
      'Include drinking water in the map legend and distinguish seasonal taps from year-round sources.',
    status: 'Todo',
    area: 'Maps',
    owner: 'Iris Chen',
    priority: 'medium',
    estimate: 2,
  },
  {
    id: 'AT-137',
    title: 'Sort offline regions by last use',
    description: 'Keep the most recently opened regions at the top of the downloaded maps list.',
    status: 'Todo',
    area: 'Offline',
    owner: 'Sam Reed',
    priority: 'low',
    estimate: 1,
  },
  {
    id: 'AT-136',
    title: 'Make trail labels legible at dusk',
    description:
      'Increase the contrast of minor trail labels on the dusk map without obscuring contour lines.',
    status: 'In progress',
    area: 'Maps',
    owner: 'Iris Chen',
    priority: 'high',
    estimate: 3,
  },
  {
    id: 'AT-131',
    title: 'Show download size before saving a region',
    description:
      'Include the estimated size beside the offline download action so walkers can plan around available storage.',
    status: 'In progress',
    area: 'Offline',
    owner: 'Mina Ortiz',
    priority: 'high',
    estimate: 2,
  },
  {
    id: 'AT-130',
    title: 'Preserve captions in shared notes',
    description: 'Carry photo captions through to the read-only version of a field note.',
    status: 'In progress',
    area: 'Field notes',
    owner: 'Mina Ortiz',
    priority: 'medium',
    estimate: 2,
  },
  {
    id: 'AT-128',
    title: 'Group saved places by region',
    description:
      'Organize saved places under their region names and keep recently visited places at the top of each group.',
    status: 'Done',
    area: 'Collections',
    owner: 'Leo Park',
    priority: 'medium',
    estimate: 3,
  },
  {
    id: 'AT-127',
    title: 'Show elevation gain on route previews',
    description: 'Summarize total ascent next to distance before a walker opens the full route.',
    status: 'Done',
    area: 'Maps',
    owner: 'Mina Ortiz',
    priority: 'high',
    estimate: 5,
  },
  {
    id: 'AT-125',
    title: 'Add a distance scale to printed maps',
    description:
      'Print the scale alongside the map legend so a paper copy can be used to estimate walking distances.',
    status: 'Done',
    area: 'Maps',
    owner: 'Iris Chen',
    priority: 'low',
    estimate: 1,
  },
]

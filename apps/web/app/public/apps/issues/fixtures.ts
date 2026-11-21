export const statuses = ['Todo', 'In progress', 'Done'] as const
export type Status = (typeof statuses)[number]

export interface Issue {
  id: string
  title: string
  description: string
  status: Status
  area: string
  owner: string
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
  },
  {
    id: 'AT-139',
    title: 'Restore an unfinished field note',
    description:
      'Bring back the note and its attached place when a contributor reopens the editor after leaving it mid-sentence.',
    status: 'Todo',
    area: 'Field notes',
    owner: 'Leo Park',
  },
  {
    id: 'AT-136',
    title: 'Make trail labels legible at dusk',
    description:
      'Increase the contrast of minor trail labels on the dusk map without obscuring contour lines.',
    status: 'In progress',
    area: 'Maps',
    owner: 'Iris Chen',
  },
  {
    id: 'AT-131',
    title: 'Show download size before saving a region',
    description:
      'Include the estimated size beside the offline download action so walkers can plan around available storage.',
    status: 'In progress',
    area: 'Offline',
    owner: 'Mina Ortiz',
  },
  {
    id: 'AT-128',
    title: 'Group saved places by region',
    description:
      'Organize saved places under their region names and keep recently visited places at the top of each group.',
    status: 'Done',
    area: 'Collections',
    owner: 'Leo Park',
  },
  {
    id: 'AT-125',
    title: 'Add a distance scale to printed maps',
    description:
      'Print the scale alongside the map legend so a paper copy can be used to estimate walking distances.',
    status: 'Done',
    area: 'Maps',
    owner: 'Iris Chen',
  },
]

export type IncidentDateRangeFilter =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'this-quarter'
  | 'this-year'
  | 'custom'

export type DonutSegment = {
  key: string
  label: string
  value: number
  percentageLabel: number
  offset: number
  index: number
}

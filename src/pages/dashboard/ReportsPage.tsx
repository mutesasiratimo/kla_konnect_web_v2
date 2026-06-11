import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import { DashboardDataGrid } from '../../components/table/DashboardDataGrid'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { analytics, roles as rolesApi } from '../../api/endpoints'
import { alertError, alertSuccess } from '../../utils/alerts'

const REPORT_TYPES = [
  'General Summary',
  'Incidents by Category',
  'Incidents by Location',
  'Incidents over Time',
  'Incident Resolution Time',
  'Incident Categories Performance',
  'Users Activity',
] as const

type ReportType = (typeof REPORT_TYPES)[number]

/** Backend export endpoint (under /analytics, suffixed with /export) per report type. */
const EXPORT_PATHS: Record<ReportType, string> = {
  'General Summary': 'incidents/overview',
  'Incidents by Category': 'incidents/by-category',
  'Incidents by Location': 'incidents/hotspots',
  'Incidents over Time': 'incidents/time-series',
  'Incident Resolution Time': 'incidents/resolution-time',
  'Incident Categories Performance': 'categories/performance',
  'Users Activity': 'users/activity',
}

const PIE_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4']
const BAR_GREEN = '#227032'
const BAR_ORANGE = '#FF9800'

function toYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function timeSeriesGranularityForRange(startYmd: string, endYmd: string): string {
  const s = new Date(`${startYmd}T12:00:00`)
  const e = new Date(`${endYmd}T12:00:00`)
  const days = Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000))
  if (days < 7) return 'day'
  if (days < 30) return 'week'
  return 'month'
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return 0
}

/** Backend chart endpoints return `{ data: [{ label, value, ... }] }`. */
function labelValueRows(raw: unknown): { label: string; value: number }[] {
  const o = asRecord(raw)
  const data = Array.isArray(o.data) ? o.data : []
  return data.map((item) => {
    const r = asRecord(item)
    return { label: String(r.label ?? '—'), value: num(r.value) }
  })
}

type ReportBundle =
  | {
      type: ReportType
      raw: unknown
      extra?: {
        labels: string[]
        values: number[]
        granularity: string
      }
    }
  | null

function GeneralSummaryCharts({
  raw,
  extra,
}: {
  raw: unknown
  extra?: { labels: string[]; values: number[]; granularity: string }
}) {
  const o = asRecord(raw)
  // Backend shape: { summary: { total_incidents, by_status: {"0".."4"}, emergency_incidents, avg_resolution_hours } }
  const summary = asRecord(o.summary ?? o)
  const byStatus = asRecord(summary.by_status ?? o.status_breakdown ?? o.statusBreakdown)
  const pending = num(byStatus['0'])
  const live = num(byStatus['1'] ?? byStatus.published)
  const resolved = num(byStatus['2'] ?? byStatus.resolved)
  const rejected = num(byStatus['3'] ?? byStatus.rejected)
  const archived = num(byStatus['4'] ?? byStatus.archived)
  const total =
    num(summary.total_incidents) || pending + live + resolved + rejected + archived
  const emergency = num(summary.emergency_incidents ?? summary.emergencyIncidents)
  const avgRes = num(summary.avg_resolution_hours ?? summary.avgResolutionHours)

  const pieData = [
    { name: 'Pending', value: pending, color: PIE_COLORS[2] },
    { name: 'Live', value: live, color: PIE_COLORS[0] },
    { name: 'Resolved', value: resolved, color: PIE_COLORS[1] },
    { name: 'Rejected', value: rejected, color: PIE_COLORS[3] },
    { name: 'Archived', value: archived, color: PIE_COLORS[4] },
  ].filter((d) => d.value > 0)

  const barData =
    extra?.labels.map((label, i) => ({
      label,
      value: extra.values[i] ?? 0,
    })) ?? []

  const gLabel =
    extra?.granularity === 'day'
      ? 'Day'
      : extra?.granularity === 'week'
        ? 'Week'
        : 'Month'

  return (
    <div className="reports-analytics-view-inner">
      <div className="reports-metric-row">
        <div className="reports-metric-card">
          <div className="reports-metric-value">{total}</div>
          <div className="reports-metric-label">Total incidents</div>
        </div>
        <div className="reports-metric-card">
          <div className="reports-metric-value">{emergency}</div>
          <div className="reports-metric-label">Emergency</div>
        </div>
        <div className="reports-metric-card">
          <div className="reports-metric-value">{avgRes.toFixed(1)}</div>
          <div className="reports-metric-label">Avg resolution (hrs)</div>
        </div>
      </div>

      {pieData.length > 0 && total > 0 && (
        <>
          <h3 className="reports-section-title">Incident status breakdown</h3>
          <div className="reports-chart-split">
            <div className="reports-chart-pie">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieData[i].color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="reports-pie-legend">
              {pieData.map((d) => (
                <li key={d.name}>
                  <span
                    className="reports-pie-dot"
                    style={{ background: d.color }}
                  />
                  {d.name}: {d.value}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {barData.length > 0 && (
        <>
          <h3 className="reports-section-title">Incidents by {gLabel}</h3>
          <div className="reports-chart-bar">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} width={36} />
                <Tooltip />
                <Bar dataKey="value" fill={BAR_GREEN} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

function CategoryReportCharts({ raw }: { raw: unknown }) {
  const o = asRecord(raw)
  // Backend shape: { data: [{ category_id, label, value }], total_categories }
  const baseRows = labelValueRows(raw)
  const totalIncidents = baseRows.reduce((sum, r) => sum + r.value, 0)
  const totalCategories = num(o.total_categories ?? o.totalCategories) || baseRows.length

  const rows = baseRows.map((r, i) => ({
    id: String(i),
    name: r.label,
    total: r.value,
    pct: totalIncidents > 0 ? (r.value / totalIncidents) * 100 : 0,
  }))

  type CategoryDetailRow = (typeof rows)[number]

  const detailColumns: GridColDef<CategoryDetailRow>[] = [
    { field: 'name', headerName: 'Category', flex: 1, minWidth: 160 },
    {
      field: 'total',
      headerName: 'Total',
      type: 'number',
      width: 110,
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'pct',
      headerName: 'Share',
      width: 110,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_v, row) => `${row.pct.toFixed(1)}%`,
    },
  ]

  const pieData = rows
    .filter((r) => r.total > 0)
    .map((r, i) => ({
      name: r.name,
      value: r.total,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))

  const maxBar = rows.reduce((m, r) => Math.max(m, r.total), 0) || 1

  return (
    <div className="reports-analytics-view-inner">
      <div className="reports-metric-row reports-metric-row--2">
        <div className="reports-metric-card">
          <div className="reports-metric-value">{totalIncidents}</div>
          <div className="reports-metric-label">Total incidents</div>
        </div>
        <div className="reports-metric-card">
          <div className="reports-metric-value">{totalCategories}</div>
          <div className="reports-metric-label">Categories</div>
        </div>
      </div>

      {pieData.length > 0 && (
        <>
          <h3 className="reports-section-title">Incidents by category</h3>
          <div className="reports-chart-split">
            <div className="reports-chart-pie">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieData[i].color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="reports-pie-legend">
              {pieData.map((d) => (
                <li key={d.name}>
                  <span
                    className="reports-pie-dot"
                    style={{ background: d.color }}
                  />
                  <span className="reports-pie-legend-name">{d.name}</span>
                  <span className="reports-pie-legend-pct">
                    {rows.find((r) => r.name === d.name)?.pct.toFixed(1) ?? '0'}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <h3 className="reports-section-title">Incidents by category (bar)</h3>
      <div className="reports-chart-bar">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={rows.map((r) => ({
              label: r.name.length > 12 ? `${r.name.slice(0, 12)}…` : r.name,
              value: r.total,
            }))}
            margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
          >
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} width={32} domain={[0, maxBar + 2]} />
            <Tooltip />
            <Bar dataKey="value" fill={BAR_GREEN} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 className="reports-section-title">Category details</h3>
      <DashboardDataGrid<CategoryDetailRow>
        rows={rows}
        columns={detailColumns}
        getRowId={(row) => row.id}
        localeText={{ noRowsLabel: 'No category breakdown.' }}
      />
    </div>
  )
}

function TimeSeriesOnly({ raw, title }: { raw: unknown; title: string }) {
  const o = asRecord(raw)
  // Backend shape: { data: [{ label, value }], meta: { granularity } } (legacy: labels/series)
  let barData = labelValueRows(raw)
  if (barData.length === 0 && Array.isArray(o.labels)) {
    const labels = o.labels.map(String)
    const series = Array.isArray(o.series) ? o.series.map((v) => num(v)) : []
    barData = labels.map((label, i) => ({ label, value: series[i] ?? 0 }))
  }
  const maxBar = barData.reduce((m, r) => Math.max(m, r.value), 0) || 1

  return (
    <div className="reports-analytics-view-inner">
      <h3 className="reports-section-title">{title}</h3>
      <div className="reports-chart-bar">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} width={36} domain={[0, maxBar + 2]} />
            <Tooltip />
            <Bar dataKey="value" fill={BAR_GREEN} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const RESOLUTION_BUCKET_LABELS: Record<string, string> = {
  under_1h: '< 1 hour',
  '1h_to_24h': '1–24 hours',
  '1d_to_7d': '1–7 days',
  over_7d: '> 7 days',
}

function ResolutionTimeCharts({ raw }: { raw: unknown }) {
  const o = asRecord(raw)
  // Backend shape: { summary: { resolved_count, avg_resolution_hours }, data: distribution[{label,value}] }
  const summary = asRecord(o.summary)
  const resolvedCount = num(summary.resolved_count)
  const avgHours = num(summary.avg_resolution_hours)

  const barData = labelValueRows(raw).map((r) => ({
    label: RESOLUTION_BUCKET_LABELS[r.label] ?? r.label,
    value: r.value,
  }))
  const maxBar = barData.reduce((m, r) => Math.max(m, r.value), 0) || 1

  return (
    <div className="reports-analytics-view-inner">
      <div className="reports-metric-row reports-metric-row--2">
        <div className="reports-metric-card">
          <div className="reports-metric-value">{resolvedCount}</div>
          <div className="reports-metric-label">Resolved incidents</div>
        </div>
        <div className="reports-metric-card">
          <div className="reports-metric-value">{avgHours.toFixed(1)}</div>
          <div className="reports-metric-label">Avg resolution (hrs)</div>
        </div>
      </div>
      <h3 className="reports-section-title">Resolution time distribution</h3>
      <div className="reports-chart-bar">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 11 }} width={36} domain={[0, maxBar + 2]} />
            <Tooltip />
            <Bar dataKey="value" fill={BAR_ORANGE} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function PerformanceCharts({ raw }: { raw: unknown }) {
  const o = asRecord(raw)
  // Backend shape: { data: [{ category_id, label, total, resolved, resolution_rate, avg_resolution_hours }] }
  const data = Array.isArray(o.data) ? o.data : []
  const rows = data.map((c) => {
    const r = asRecord(c)
    return {
      name: String(r.label ?? r.category_name ?? '—'),
      total: num(r.total),
      resolved: num(r.resolved),
      rate: num(r.resolution_rate) * 100,
      combined: num(r.total),
    }
  })
  const maxRate = Math.max(5, ...rows.map((r) => r.rate), 100)
  const maxCount = Math.max(1, ...rows.map((r) => r.combined)) + 2

  return (
    <div className="reports-analytics-view-inner">
      <div className="reports-metric-row reports-metric-row--1">
        <div className="reports-metric-card">
          <div className="reports-metric-value">{rows.length}</div>
          <div className="reports-metric-label">Total categories</div>
        </div>
      </div>
      <h3 className="reports-section-title">Resolution rate by category (%)</h3>
      <div className="reports-chart-bar">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={rows.map((r) => ({
              label: r.name.length > 8 ? `${r.name.slice(0, 8)}…` : r.name,
              value: r.rate,
            }))}
            margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
          >
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-28} textAnchor="end" height={58} />
            <YAxis tick={{ fontSize: 11 }} width={32} domain={[0, maxRate]} />
            <Tooltip />
            <Bar dataKey="value" fill="#4CAF50" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h3 className="reports-section-title">Total incidents by category</h3>
      <div className="reports-chart-bar">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={rows.map((r) => ({
              label: r.name.length > 8 ? `${r.name.slice(0, 8)}…` : r.name,
              value: r.combined,
            }))}
            margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
          >
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-28} textAnchor="end" height={58} />
            <YAxis tick={{ fontSize: 11 }} width={32} domain={[0, maxCount]} />
            <Tooltip />
            <Bar dataKey="value" fill={BAR_GREEN} radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LocationReportCharts({ raw }: { raw: unknown }) {
  const o = asRecord(raw)
  // Backend shape: { data: [{ label, value, address }], meta: { top_n } }
  const data = Array.isArray(o.data) ? o.data : []
  const totalIncidents = data.reduce((sum, h) => sum + num(asRecord(h).value), 0)

  const rows = data.map((h) => {
    const r = asRecord(h)
    return {
      name: String(r.address ?? r.label ?? 'N/A'),
      count: num(r.value ?? r.incident_count),
    }
  })
  const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1

  return (
    <div className="reports-analytics-view-inner">
      <div className="reports-metric-row reports-metric-row--2">
        <div className="reports-metric-card">
          <div className="reports-metric-value">{rows.length}</div>
          <div className="reports-metric-label">Hotspots</div>
        </div>
        <div className="reports-metric-card">
          <div className="reports-metric-value">{totalIncidents}</div>
          <div className="reports-metric-label">Incidents at hotspots</div>
        </div>
      </div>
      <h3 className="reports-section-title">Incidents by location</h3>
      <div className="reports-chart-bar">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={rows.map((r) => ({
              label: r.name.length > 12 ? `${r.name.slice(0, 12)}…` : r.name,
              value: r.count,
            }))}
            margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
          >
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={0} angle={-28} textAnchor="end" height={58} />
            <YAxis tick={{ fontSize: 11 }} width={32} domain={[0, maxCount + 2]} />
            <Tooltip />
            <Bar dataKey="value" fill={BAR_GREEN} radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h3 className="reports-section-title">Location details</h3>
      <ul className="reports-card-list">
        {rows.map((r) => (
          <li key={r.name} className="reports-card-list-item">
            <span className="reports-card-list-icon" aria-hidden>
              📍
            </span>
            <div>
              <div className="reports-card-list-title">{r.name}</div>
              <div className="reports-card-list-sub">
                Incidents: {r.count}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function UsersActivityCharts({ raw }: { raw: unknown }) {
  const o = asRecord(raw)
  const totalUsers = num(o.total_users ?? o.totalUsers)
  const activeUsers = num(o.active_users ?? o.activeUsers)
  const trendRaw = o.registration_trend ?? o.registrationTrend
  const trend: unknown[] = Array.isArray(trendRaw) ? trendRaw : []
  const contributorsRaw = o.top_contributors ?? o.topContributors
  const contributors: unknown[] = Array.isArray(contributorsRaw) ? contributorsRaw : []

  const trendRows = trend.map((t: unknown) => {
    const r = asRecord(t)
    const d = r.date ?? r.data
    let label = '—'
    if (typeof d === 'string') {
      label = d.slice(5, 10).replace('-', '/')
    }
    return { label, value: num(r.count) }
  })

  const contribRows = contributors.map((c: unknown) => {
    const r = asRecord(c)
    return {
      name: String(r.name ?? '—'),
      email: String(r.email ?? '—'),
      count: num(r.incident_count ?? r.incidentCount),
    }
  })

  const maxTrend =
    trendRows.reduce((m: number, r: { label: string; value: number }) => Math.max(m, r.value), 0) || 1
  const maxContrib =
    contribRows.reduce((m: number, r: { name: string; email: string; count: number }) => Math.max(m, r.count), 0) ||
    1

  return (
    <div className="reports-analytics-view-inner">
      <div className="reports-metric-row reports-metric-row--2">
        <div className="reports-metric-card">
          <div className="reports-metric-value">{totalUsers}</div>
          <div className="reports-metric-label">Total users</div>
        </div>
        <div className="reports-metric-card">
          <div className="reports-metric-value">{activeUsers}</div>
          <div className="reports-metric-label">Active users</div>
        </div>
      </div>

      {trendRows.length > 0 && (
        <>
          <h3 className="reports-section-title">Registration trend</h3>
          <div className="reports-chart-bar">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendRows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} width={32} domain={[0, maxTrend + 2]} />
                <Tooltip />
                <Bar dataKey="value" fill={BAR_GREEN} radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {contribRows.length > 0 && (
        <>
          <h3 className="reports-section-title">Top contributors</h3>
          <div className="reports-chart-bar">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={contribRows.map((r: { name: string; count: number }) => ({
                  label: r.name.length > 8 ? `${r.name.slice(0, 8)}…` : r.name,
                  value: r.count,
                }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} width={32} domain={[0, maxContrib + 2]} />
                <Tooltip />
                <Bar dataKey="value" fill="#2196F3" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <h3 className="reports-section-title">Contributor details</h3>
      <ul className="reports-card-list">
        {contribRows.map((r: { name: string; email: string; count: number }) => (
          <li key={r.email} className="reports-card-list-item">
            <span className="reports-card-list-icon" aria-hidden>
              👤
            </span>
            <div className="reports-card-list-grow">
              <div className="reports-card-list-title">{r.name}</div>
              <div className="reports-card-list-sub">{r.email}</div>
            </div>
            <div className="reports-card-list-trail">{r.count} reports</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ReportAnalyticsView({ bundle }: { bundle: ReportBundle }) {
  if (!bundle) {
    return (
      <p className="reports-analytics-placeholder">
        Generate a report to view analytics
      </p>
    )
  }

  switch (bundle.type) {
    case 'General Summary':
      return (
        <GeneralSummaryCharts raw={bundle.raw} extra={bundle.extra} />
      )
    case 'Incidents by Category':
      return <CategoryReportCharts raw={bundle.raw} />
    case 'Incidents by Location':
      return <LocationReportCharts raw={bundle.raw} />
    case 'Incidents over Time':
      return <TimeSeriesOnly raw={bundle.raw} title="Incidents over time" />
    case 'Incident Resolution Time':
      return <ResolutionTimeCharts raw={bundle.raw} />
    case 'Incident Categories Performance':
      return <PerformanceCharts raw={bundle.raw} />
    case 'Users Activity':
      return <UsersActivityCharts raw={bundle.raw} />
    default:
      return null
  }
}

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('General Summary')
  const [userType, setUserType] = useState<string>('')
  const [roleOptions, setRoleOptions] = useState<{ id: string; name: string }[]>([])
  const [datePreset, setDatePreset] = useState<string | null>('last30')

  useEffect(() => {
    let cancelled = false
    rolesApi
      .list()
      .then((items) => {
        if (!cancelled) {
          setRoleOptions(items.map((r) => ({ id: r.id, name: r.name })))
        }
      })
      .catch((err) => console.error(err))
    return () => {
      cancelled = true
    }
  }, [])

  const [startDateStr, setStartDateStr] = useState(() => {
    const s = new Date()
    s.setDate(s.getDate() - 30)
    return toYMD(s)
  })
  const [endDateStr, setEndDateStr] = useState(() => toYMD(new Date()))

  const [generateLoading, setGenerateLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [bundle, setBundle] = useState<ReportBundle>(null)

  const applyPreset = useCallback((key: string) => {
    setDatePreset(key)
    const now = new Date()
    const end = toYMD(now)
    let start = ''
    if (key === 'today') {
      start = end
    } else if (key === 'ytd') {
      const s = new Date(now.getFullYear(), 0, 1)
      start = toYMD(s)
    } else if (key === 'last7') {
      const s = new Date()
      s.setDate(s.getDate() - 7)
      start = toYMD(s)
    } else if (key === 'last30') {
      const s = new Date()
      s.setDate(s.getDate() - 30)
      start = toYMD(s)
    } else if (key === 'last90') {
      const s = new Date()
      s.setDate(s.getDate() - 90)
      start = toYMD(s)
    } else if (key === 'last365') {
      const s = new Date()
      s.setDate(s.getDate() - 365)
      start = toYMD(s)
    }
    if (key !== 'custom') {
      setStartDateStr(start)
      setEndDateStr(end)
    }
  }, [])

  const fetchReport = useCallback(async () => {
    if (!startDateStr || !endDateStr) {
      void alertError('Date range', 'Please select both start and end dates.')
      return
    }
    setGenerateLoading(true)
    setFetchError(null)
    try {
      switch (reportType) {
        case 'General Summary': {
          const overview = await analytics.incidentsOverview({
            start_date: startDateStr,
            end_date: endDateStr,
          })
          const g = timeSeriesGranularityForRange(startDateStr, endDateStr)
          const ts = await analytics.incidentsTimeSeries({
            start_date: startDateStr,
            end_date: endDateStr,
            granularity: g,
            include_city_reports: false,
          })
          const tsRows = labelValueRows(ts)
          const labels = tsRows.map((r) => r.label)
          const values = tsRows.map((r) => r.value)
          setBundle({
            type: 'General Summary',
            raw: overview,
            extra: { labels, values, granularity: g },
          })
          break
        }
        case 'Incidents by Category': {
          const raw = await analytics.incidentsByCategoryReport({
            start_date: startDateStr,
            end_date: endDateStr,
            include_city_reports: false,
            top_n: 10,
          })
          setBundle({ type: 'Incidents by Category', raw })
          break
        }
        case 'Incidents by Location': {
          const raw = await analytics.incidentsHotspots({
            start_date: startDateStr,
            end_date: endDateStr,
            include_city_reports: false,
            top_n: 10,
          })
          setBundle({ type: 'Incidents by Location', raw })
          break
        }
        case 'Incidents over Time': {
          const g = timeSeriesGranularityForRange(startDateStr, endDateStr)
          const raw = await analytics.incidentsTimeSeries({
            start_date: startDateStr,
            end_date: endDateStr,
            granularity: g,
            include_city_reports: false,
          })
          setBundle({ type: 'Incidents over Time', raw })
          break
        }
        case 'Incident Resolution Time': {
          const raw = await analytics.incidentsResolutionTime({
            start_date: startDateStr,
            end_date: endDateStr,
          })
          setBundle({ type: 'Incident Resolution Time', raw })
          break
        }
        case 'Incident Categories Performance': {
          const raw = await analytics.categoriesPerformance({
            start_date: startDateStr,
            end_date: endDateStr,
          })
          setBundle({ type: 'Incident Categories Performance', raw })
          break
        }
        case 'Users Activity': {
          const raw = await analytics.usersActivity({
            start_date: startDateStr,
            end_date: endDateStr,
            user_type: userType || undefined,
          })
          setBundle({ type: 'Users Activity', raw })
          break
        }
        default:
          setBundle(null)
      }
    } catch (e) {
      console.error(e)
      setFetchError(
        e instanceof Error ? e.message : 'Failed to load report data.',
      )
      setBundle(null)
    } finally {
      setGenerateLoading(false)
    }
  }, [endDateStr, reportType, startDateStr, userType])

  const handleExport = useCallback(async () => {
    if (!startDateStr || !endDateStr) {
      void alertError('Date range', 'Please select both start and end dates.')
      return
    }
    setExportLoading(true)
    try {
      const params: Record<string, string> = {
        start_date: startDateStr,
        end_date: endDateStr,
        format: 'xlsx',
      }
      if (
        reportType === 'Incidents by Category' ||
        reportType === 'Incidents by Location' ||
        reportType === 'Incidents over Time'
      ) {
        params.include_city_reports = 'false'
      }
      if (reportType === 'Incidents over Time') {
        params.granularity = timeSeriesGranularityForRange(startDateStr, endDateStr)
      }
      if (reportType === 'Users Activity' && userType) {
        params.user_type = userType
      }
      const { blob, filename } = await analytics.exportReport(
        EXPORT_PATHS[reportType],
        params,
      )
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download =
        filename ?? `${reportType.replace(/\s+/g, '_')}_${toYMD(new Date())}.xlsx`
      a.click()
      URL.revokeObjectURL(a.href)
      void alertSuccess('Export', 'Report downloaded as an Excel file.')
    } catch (e) {
      console.error(e)
      void alertError('Export', 'Could not export this report. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }, [endDateStr, reportType, startDateStr, userType])

  const chips = useMemo(
    () =>
      [
        { key: 'today', label: 'Today' },
        { key: 'ytd', label: 'YTD' },
        { key: 'last7', label: 'Last 7 days' },
        { key: 'last30', label: 'Last 30 days' },
        { key: 'last90', label: 'Last 3 months' },
        { key: 'last365', label: 'Last 12 months' },
        { key: 'custom', label: 'Custom range' },
      ] as const,
    [],
  )

  return (
    <div className="dashboard-page reports-analytics-page">
      <div className="dashboard-page-header-row">
        <div>
          <h1 className="dashboard-page-title">Reports &amp; analytics</h1>
        </div>
      </div>

      <div className="reports-analytics-card">
        <div className="reports-topic-row">
          <div className="reports-topic-text">
            <h2 className="reports-topic-title">Report topic</h2>
          </div>
          <div className="reports-topic-select-wrap">
            <select
              id="reports-type"
              className="dashboard-filter-select reports-select reports-topic-type-select"
              aria-label="Report type"
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value as ReportType)
              }
            >
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="reports-topic-actions">
            <button
              type="button"
              className="primary-button reports-action-btn"
              disabled={generateLoading}
              onClick={() => void fetchReport()}
            >
              {generateLoading ? 'Generating…' : 'Generate'}
            </button>
            <button
              type="button"
              className="primary-button reports-action-btn"
              disabled={exportLoading}
              onClick={() => void handleExport()}
            >
              {exportLoading ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>

        {reportType === 'Users Activity' && (
          <div className="reports-filter-block">
            <div className="reports-filter-heading">
              <span className="reports-filter-icon" aria-hidden>
                ≡
              </span>
              Filter criteria
            </div>
            <div className="reports-field">
              <label className="reports-field-label" htmlFor="reports-user-type">
                User type
              </label>
              <select
                id="reports-user-type"
                className="dashboard-filter-select reports-select"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="">All users</option>
                {roleOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="reports-date-block">
          <div className="reports-filter-heading">Date range</div>
          <div className="reports-date-chips">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                className={
                  datePreset === c.key
                    ? 'reports-date-chip reports-date-chip--active'
                    : 'reports-date-chip'
                }
                onClick={() => applyPreset(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {datePreset === 'custom' && (
            <div className="reports-date-inputs">
              <label className="reports-date-input-wrap">
                <span className="reports-field-label">Start date</span>
                <input
                  type="date"
                  className="dashboard-filter-select reports-date-input"
                  value={startDateStr}
                  onChange={(e) => {
                    setStartDateStr(e.target.value)
                    setDatePreset('custom')
                  }}
                />
              </label>
              <label className="reports-date-input-wrap">
                <span className="reports-field-label">End date</span>
                <input
                  type="date"
                  className="dashboard-filter-select reports-date-input"
                  value={endDateStr}
                  onChange={(e) => {
                    setEndDateStr(e.target.value)
                    setDatePreset('custom')
                  }}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {fetchError && (
        <p className="dashboard-page-lead" style={{ color: '#ef4444' }} role="alert">
          {fetchError}
        </p>
      )}

      <div className="reports-analytics-card reports-analytics-card--chart">
        {generateLoading ? (
          <div className="reports-analytics-loading">
            <div className="reports-spinner" aria-hidden />
            <span>Loading analytics…</span>
          </div>
        ) : (
          <ReportAnalyticsView bundle={bundle} />
        )}
      </div>
    </div>
  )
}

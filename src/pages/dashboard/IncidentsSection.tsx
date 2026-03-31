import type { IncidentCategoryRead, IncidentRead } from '../../api/types'
import { IncidentSummary } from '../../components/incidents/IncidentSummary'
import { IncidentList } from '../../components/incidents/IncidentList'
import { IncidentCategories } from '../../components/incidents/IncidentCategories'
import type { IncidentDateRangeFilter } from './pageTypes'

export type { IncidentDateRangeFilter } from './pageTypes'

interface IncidentsSectionProps {
  currentPage: string
  incidentsLoadError: string | null
  incidentDateFilter: IncidentDateRangeFilter
  setIncidentDateFilter: (v: IncidentDateRangeFilter) => void
  incidentCustomFrom: string
  setIncidentCustomFrom: (v: string) => void
  incidentCustomTo: string
  setIncidentCustomTo: (v: string) => void
  pendingIncidentsCount: number
  liveIncidentsCount: number
  resolvedIncidentsCount: number
  avgResolutionHours: number | null
  incidentData: IncidentRead[]
  incidentRecords: IncidentRead[]
  cityAlertRecords: IncidentRead[]
  catData: IncidentCategoryRead[]
  loadIncidents: () => void | Promise<void>
  loadCategories: () => void | Promise<void>
}

export function IncidentsSection({
  currentPage,
  incidentsLoadError,
  incidentDateFilter,
  setIncidentDateFilter,
  incidentCustomFrom,
  setIncidentCustomFrom,
  incidentCustomTo,
  setIncidentCustomTo,
  pendingIncidentsCount,
  liveIncidentsCount,
  resolvedIncidentsCount,
  avgResolutionHours,
  incidentData,
  incidentRecords,
  cityAlertRecords,
  catData,
  loadIncidents,
  loadCategories,
}: IncidentsSectionProps) {
  return (
    <>
      {currentPage === 'incidents' && (
        <div className="dashboard-page">
          <h1 className="dashboard-page-title">Incidents</h1>
          <p className="dashboard-page-lead">
            Overview of all reported incidents across the network.
          </p>
          <div
            className="dashboard-filters"
            style={{ marginTop: '1rem', marginBottom: '1rem' }}
          >
            <div className="dashboard-filter">
              <label className="dashboard-filter-label">
                Date range
                <select
                  className="dashboard-filter-select"
                  value={incidentDateFilter}
                  onChange={(event) =>
                    setIncidentDateFilter(
                      event.target.value as IncidentDateRangeFilter,
                    )
                  }
                >
                  <option value="today">Today</option>
                  <option value="this-week">This week</option>
                  <option value="this-month">This month</option>
                  <option value="this-quarter">This quarter</option>
                  <option value="this-year">This year</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
            </div>
            {incidentDateFilter === 'custom' && (
              <>
                <div className="dashboard-filter">
                  <label className="dashboard-filter-label">
                    From
                    <input
                      type="date"
                      className="dashboard-filter-input"
                      value={incidentCustomFrom}
                      onChange={(event) =>
                        setIncidentCustomFrom(event.target.value)
                      }
                    />
                  </label>
                </div>
                <div className="dashboard-filter">
                  <label className="dashboard-filter-label">
                    To
                    <input
                      type="date"
                      className="dashboard-filter-input"
                      value={incidentCustomTo}
                      onChange={(event) =>
                        setIncidentCustomTo(event.target.value)
                      }
                    />
                  </label>
                </div>
              </>
            )}
          </div>
          {incidentsLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {incidentsLoadError}
            </p>
          )}
          <div className="dashboard-cards" style={{ marginTop: '1rem' }}>
            <div className="dashboard-card">
              <h3>Pending Incidents</h3>
              <p className="dashboard-metric">
                <span className="dashboard-metric-value">
                  {pendingIncidentsCount}
                </span>
              </p>
            </div>
            <div className="dashboard-card">
              <h3>Live Incidents</h3>
              <p className="dashboard-metric">
                <span className="dashboard-metric-value">
                  {liveIncidentsCount}
                </span>
              </p>
            </div>
            <div className="dashboard-card">
              <h3>Resolved Incidents</h3>
              <p className="dashboard-metric">
                <span className="dashboard-metric-value">
                  {resolvedIncidentsCount}
                </span>
              </p>
            </div>
            <div className="dashboard-card">
              <h3>Avg resolution time</h3>
              <p className="dashboard-metric">
                <span className="dashboard-metric-value">
                  {avgResolutionHours == null
                    ? '—'
                    : `${avgResolutionHours.toFixed(1)}h`}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
      {currentPage === 'incidents-summary' && (
        <div className="dashboard-page">
          <h1 className="dashboard-page-title">Incidents — Summary</h1>
          <p className="dashboard-page-lead">
            High-level summary of incident statistics.
          </p>
          {incidentsLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {incidentsLoadError}
            </p>
          )}
          <IncidentSummary incidents={incidentData} />
        </div>
      )}
      {currentPage === 'incidents-incidents' && (
        <div className="dashboard-page">
          <div className="dashboard-page-header-row">
            <div>
              <h1 className="dashboard-page-title">Incidents — Records</h1>
              <p className="dashboard-page-lead">
                Browse and manage individual incident records.
              </p>
            </div>
          </div>
          {incidentsLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {incidentsLoadError}
            </p>
          )}
          <IncidentList
            data={incidentRecords}
            categoryOptions={catData.map((c) => ({ id: c.id, name: c.name }))}
            onRefresh={loadIncidents}
            showCreateButton={false}
          />
        </div>
      )}
      {currentPage === 'incidents-city-alerts' && (
        <div className="dashboard-page">
          <div className="dashboard-page-header-row">
            <div>
              <h1 className="dashboard-page-title">Incidents — City Alerts</h1>
              <p className="dashboard-page-lead">
                Browse and manage city alerts.
              </p>
            </div>
          </div>
          {incidentsLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {incidentsLoadError}
            </p>
          )}
          <IncidentList
            data={cityAlertRecords}
            categoryOptions={catData.map((c) => ({ id: c.id, name: c.name }))}
            onRefresh={loadIncidents}
            showCreateButton
            createAsCityAlert
          />
        </div>
      )}
      {currentPage === 'incidents-categories' && (
        <div className="dashboard-page">
          <div className="dashboard-page-header-row">
            <div>
              <h1 className="dashboard-page-title">Incidents — Categories</h1>
              <p className="dashboard-page-lead">
                Define and manage incident category types.
              </p>
            </div>
          </div>
          {incidentsLoadError && (
            <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
              {incidentsLoadError}
            </p>
          )}
          <IncidentCategories categories={catData} onRefresh={loadCategories} />
        </div>
      )}
    </>
  )
}

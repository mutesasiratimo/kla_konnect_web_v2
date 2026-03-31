import React from 'react'
import type { IncidentRead } from '../../api/types'

interface SummaryProps {
  incidents: IncidentRead[]
}

function countByStatus(incidents: IncidentRead[], status: string) {
  return incidents.filter((i) => i.status === status).length
}

export const IncidentSummary: React.FC<SummaryProps> = ({ incidents }) => {
  const stats = {
    total: incidents.length,
    pending: countByStatus(incidents, '1'),
    resolved: countByStatus(incidents, '2'),
    rejected: countByStatus(incidents, '3'),
    archived: countByStatus(incidents, '0'),
    emergency: incidents.filter((i) => i.isemergency).length,
  }

  return (
    <div className="dashboard-cards" style={{ marginTop: '1.5rem' }}>
      <div className="dashboard-card">
        <h3>Total reports</h3>
        <p className="dashboard-metric">
          <span className="dashboard-metric-value">{stats.total}</span>
        </p>
      </div>
      <div className="dashboard-card">
        <h3 style={{ color: '#f59e0b' }}>Pending</h3>
        <p className="dashboard-metric">
          <span className="dashboard-metric-value">{stats.pending}</span>
        </p>
      </div>
      <div className="dashboard-card">
        <h3 style={{ color: '#10b981' }}>Resolved</h3>
        <p className="dashboard-metric">
          <span className="dashboard-metric-value">{stats.resolved}</span>
        </p>
      </div>
      <div className="dashboard-card">
        <h3 style={{ color: '#ef4444' }}>Rejected</h3>
        <p className="dashboard-metric">
          <span className="dashboard-metric-value">{stats.rejected}</span>
        </p>
      </div>
      <div className="dashboard-card">
        <h3>Archived</h3>
        <p className="dashboard-metric">
          <span className="dashboard-metric-value">{stats.archived}</span>
        </p>
      </div>
      <div className="dashboard-card">
        <h3 style={{ color: '#dc2626' }}>Emergencies</h3>
        <p className="dashboard-metric">
          <span className="dashboard-metric-value">{stats.emergency}</span>
        </p>
      </div>
    </div>
  )
}

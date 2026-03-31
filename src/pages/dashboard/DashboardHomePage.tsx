import type { DonutSegment } from './pageTypes'

interface DashboardHomePageProps {
  userName: string
  donutSegments: DonutSegment[]
}

export function DashboardHomePage({
  userName,
  donutSegments,
}: DashboardHomePageProps) {
  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page-title">Dashboard</h1>
      <p className="dashboard-page-lead">
        Welcome back, {userName || 'User'}. Here's an overview of your account.
      </p>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Vehicles</h3>
          <p>Manage your registered vehicles.</p>
        </div>
        <div className="dashboard-card">
          <h3>Stages</h3>
          <p>View and manage stages.</p>
        </div>
        <div className="dashboard-card">
          <h3>Subscriptions collected</h3>
          <p className="dashboard-metric">
            <span className="dashboard-metric-value">UGX 111.3M</span>
            <span className="dashboard-metric-label">Last 30 days</span>
          </p>
        </div>
        <div className="dashboard-card">
          <h3>System users</h3>
          <p className="dashboard-metric">
            <span className="dashboard-metric-value">128</span>
            <span className="dashboard-metric-label">
              Active staff and operators
            </span>
          </p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Registrations by category</h3>
          <div className="chart-donut-shell">
            <svg
              viewBox="0 0 42 42"
              className="chart-donut"
              role="img"
              aria-label="Distribution of registrations by category"
            >
              <circle className="chart-donut-ring" cx="21" cy="21" r="15.915" />
              {donutSegments.map((segment) => (
                <circle
                  key={segment.key}
                  className={`chart-donut-segment chart-donut-segment--${
                    segment.index + 1
                  }`}
                  cx="21"
                  cy="21"
                  r="15.915"
                  strokeDasharray={`${segment.value} ${100 - segment.value}`}
                  strokeDashoffset={-segment.offset}
                />
              ))}
              <circle className="chart-donut-center" cx="21" cy="21" r="9" />
            </svg>
            <div className="chart-legend">
              {donutSegments.map((segment) => (
                <div key={segment.key} className="chart-legend-row">
                  <span
                    className={`chart-legend-swatch chart-legend-swatch--${
                      segment.index + 1
                    }`}
                  />
                  <span className="chart-legend-label">{segment.label}</span>
                  <span className="chart-legend-value">
                    {segment.percentageLabel}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="chart-card">
          <h3>Monthly revenue (mock)</h3>
          <div className="chart-bars chart-bars--sparkline">
            <div className="chart-dot" style={{ height: '30%' }} />
            <div className="chart-dot" style={{ height: '45%' }} />
            <div className="chart-dot" style={{ height: '40%' }} />
            <div className="chart-dot" style={{ height: '55%' }} />
            <div className="chart-dot" style={{ height: '70%' }} />
            <div className="chart-dot" style={{ height: '65%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

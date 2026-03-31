import type { RouteRecord } from './mockData'

interface RoutesPageProps {
  sampleRoutes: RouteRecord[]
}

export function RoutesPage({ sampleRoutes }: RoutesPageProps) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header-row">
        <div>
          <h1 className="dashboard-page-title">Route charts</h1>
          <p className="dashboard-page-lead">
            Configure and monitor operational routes.
          </p>
        </div>
        <button type="button" className="primary-button">
          + New Route
        </button>
      </div>

      <div className="dashboard-table-shell">
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Route name</th>
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Distance (km)</th>
              </tr>
            </thead>
            <tbody>
              {sampleRoutes.map((route) => (
                <tr key={route.name}>
                  <td>{route.name}</td>
                  <td>{route.start}</td>
                  <td>{route.end}</td>
                  <td>{route.distanceKm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import type { StageRecord } from './mockData'

interface StagesPageProps {
  sampleStages: StageRecord[]
}

export function StagesPage({ sampleStages }: StagesPageProps) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header-row">
        <div>
          <h1 className="dashboard-page-title">Stages</h1>
          <p className="dashboard-page-lead">
            View and manage taxi stages and parks.
          </p>
        </div>
        <button type="button" className="primary-button">
          + New Stage
        </button>
      </div>

      <div className="dashboard-table-shell">
        <div className="dashboard-table-meta">
          <span>
            Showing <strong>{sampleStages.length}</strong> demo stages from
            self-registration.
          </span>
        </div>
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Stage / park</th>
                <th scope="col">District</th>
                <th scope="col">County</th>
                <th scope="col">Subcounty</th>
                <th scope="col">Parish</th>
                <th scope="col">Village</th>
                <th scope="col">Stage lead</th>
              </tr>
            </thead>
            <tbody>
              {sampleStages.map((stage) => (
                <tr key={stage.name}>
                  <td>{stage.name}</td>
                  <td>{stage.district}</td>
                  <td>{stage.county}</td>
                  <td>{stage.subcounty}</td>
                  <td>{stage.parish}</td>
                  <td>{stage.village}</td>
                  <td>{stage.stageLead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

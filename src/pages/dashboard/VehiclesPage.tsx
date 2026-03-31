import type {
  RevenueCategoryRead,
  RevenueStreamRead,
  RevenueSubcategoryRead,
  StageRead,
} from '../../api/types'
import { RegisterApp } from '../../RegisterApp'
import { RevenueStreamsCrudList } from '../../components/revenue/RevenueStreamsCrudList'
import type { VehicleRecord } from './mockData'

interface VehiclesPageProps {
  showNewVehicle: boolean
  setShowNewVehicle: (v: boolean) => void
  vehicleCategoryFilter: string
  setVehicleCategoryFilter: (v: string) => void
  vehicleStageFilter: string
  setVehicleStageFilter: (v: string) => void
  vehicleDivisionFilter: string
  setVehicleDivisionFilter: (v: string) => void
  vehiclePaymentFilter: string
  setVehiclePaymentFilter: (v: string) => void
  vehiclePermitFilter: string
  setVehiclePermitFilter: (v: string) => void
  vehicleSearch: string
  setVehicleSearch: (v: string) => void
  pagedVehicles: VehicleRecord[]
  currentVehiclePage: number
  totalVehiclePages: number
  pageSize: number
  filteredVehiclesLength: number
  goToVehiclePage: (page: number) => void
  selectedVehicle: VehicleRecord | null
  setSelectedVehicle: (v: VehicleRecord | null) => void
  streamsLoadError: string | null
  revenueStreams: RevenueStreamRead[]
  revenueCategoryData: RevenueCategoryRead[]
  revenueSubcategoryData: RevenueSubcategoryRead[]
  vehicleStreamParentFilter: string
  setVehicleStreamParentFilter: (id: string) => void
  stageData: StageRead[]
  onRefreshStreams: () => void | Promise<void>
  revenueLoadError: string | null
}

export function VehiclesPage({
  showNewVehicle,
  setShowNewVehicle,
  vehicleCategoryFilter,
  setVehicleCategoryFilter,
  vehicleStageFilter,
  setVehicleStageFilter,
  vehicleDivisionFilter,
  setVehicleDivisionFilter,
  vehiclePaymentFilter,
  setVehiclePaymentFilter,
  vehiclePermitFilter,
  setVehiclePermitFilter,
  vehicleSearch,
  setVehicleSearch,
  pagedVehicles,
  currentVehiclePage,
  totalVehiclePages,
  pageSize,
  filteredVehiclesLength,
  goToVehiclePage,
  selectedVehicle,
  setSelectedVehicle,
  streamsLoadError,
  revenueStreams,
  revenueCategoryData,
  revenueSubcategoryData,
  vehicleStreamParentFilter,
  setVehicleStreamParentFilter,
  stageData,
  onRefreshStreams,
  revenueLoadError,
}: VehiclesPageProps) {
  return (
    <>
      {!showNewVehicle && (
        <div className="dashboard-page dashboard-page--split">
          <div className="dashboard-page-main">
            <div className="dashboard-page-header-row">
              <div>
                <h1 className="dashboard-page-title">Vehicles</h1>
                <p className="dashboard-page-lead">
                  View and manage your registered vehicles.
                </p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowNewVehicle(true)}
              >
                + New Vehicle
              </button>
            </div>

            <div className="dashboard-table-shell">
              <div className="dashboard-filters">
                <div className="dashboard-filter">
                  <label className="dashboard-filter-label">
                    Category
                    <select
                      className="dashboard-filter-select"
                      value={vehicleCategoryFilter}
                      onChange={(event) =>
                        setVehicleCategoryFilter(event.target.value)
                      }
                    >
                      <option value="all">All categories</option>
                      <option value="motorbike">Motorbike</option>
                      <option value="minivan">Minivan</option>
                      <option value="bus">Bus</option>
                    </select>
                  </label>
                </div>
                <div className="dashboard-filter">
                  <label className="dashboard-filter-label">
                    Stage
                    <select
                      className="dashboard-filter-select"
                      value={vehicleStageFilter}
                      onChange={(event) =>
                        setVehicleStageFilter(event.target.value)
                      }
                    >
                      <option value="all">All stages</option>
                      <option value="Old Taxi Park">Old Taxi Park</option>
                      <option value="Kireka">Kireka</option>
                      <option value="Nansana">Nansana</option>
                    </select>
                  </label>
                </div>
                <div className="dashboard-filter">
                  <label className="dashboard-filter-label">
                    Division
                    <select
                      className="dashboard-filter-select"
                      value={vehicleDivisionFilter}
                      onChange={(event) =>
                        setVehicleDivisionFilter(event.target.value)
                      }
                    >
                      <option value="all">All divisions</option>
                      <option value="Central Division">Central Division</option>
                      <option value="Nakawa Division">Nakawa Division</option>
                      <option value="Nansana Municipality">
                        Nansana Municipality
                      </option>
                    </select>
                  </label>
                </div>
                <div className="dashboard-filter">
                  <label className="dashboard-filter-label">
                    Payment status
                    <select
                      className="dashboard-filter-select"
                      value={vehiclePaymentFilter}
                      onChange={(event) =>
                        setVehiclePaymentFilter(event.target.value)
                      }
                    >
                      <option value="all">All</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </label>
                </div>
                <div className="dashboard-filter">
                  <label className="dashboard-filter-label">
                    Permit
                    <select
                      className="dashboard-filter-select"
                      value={vehiclePermitFilter}
                      onChange={(event) =>
                        setVehiclePermitFilter(event.target.value)
                      }
                    >
                      <option value="all">All</option>
                      <option value="valid">Valid</option>
                      <option value="expired">Expired</option>
                    </select>
                  </label>
                </div>
                <div className="dashboard-filter dashboard-filter--search">
                  <label className="dashboard-filter-label">
                    Search
                    <input
                      type="text"
                      className="dashboard-filter-input"
                      placeholder="Search reg no., make, stage, operator..."
                      value={vehicleSearch}
                      onChange={(event) => setVehicleSearch(event.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="dashboard-table-meta">
                <span>
                  Showing{' '}
                  <strong>
                    {pagedVehicles.length === 0
                      ? 0
                      : (currentVehiclePage - 1) * pageSize + 1}
                    {'–'}
                    {(currentVehiclePage - 1) * pageSize + pagedVehicles.length}
                  </strong>{' '}
                  of <strong>{filteredVehiclesLength}</strong> vehicles
                </span>
              </div>

              <div className="dashboard-table-scroll">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th scope="col">Reg no.</th>
                      <th scope="col">Type</th>
                      <th scope="col">Make &amp; model</th>
                      <th scope="col">Color</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="dashboard-table-actions">
                        View
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedVehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td>{vehicle.registration}</td>
                        <td>{vehicle.vehicleType}</td>
                        <td>{vehicle.makeModel}</td>
                        <td>{vehicle.color}</td>
                        <td>{vehicle.stage}</td>
                        <td>
                          <span
                            className={`badge badge-status badge-status--${vehicle.status.toLowerCase()}`}
                          >
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="dashboard-table-actions">
                          <button
                            type="button"
                            className="link-button subtle-link"
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pagedVehicles.length === 0 && (
                      <tr>
                        <td colSpan={7} className="dashboard-table-empty">
                          No vehicles to display.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="dashboard-pagination">
                <button
                  type="button"
                  className="pagination-button"
                  onClick={() => goToVehiclePage(currentVehiclePage - 1)}
                  disabled={currentVehiclePage <= 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentVehiclePage} of {totalVehiclePages}
                </span>
                <button
                  type="button"
                  className="pagination-button"
                  onClick={() => goToVehiclePage(currentVehiclePage + 1)}
                  disabled={currentVehiclePage >= totalVehiclePages}
                >
                  Next
                </button>
              </div>
            </div>

            {(revenueLoadError || streamsLoadError) && (
              <p
                className="dashboard-page-lead"
                role="alert"
                style={{ color: '#ef4444' }}
              >
                {[revenueLoadError, streamsLoadError].filter(Boolean).join(' ')}
              </p>
            )}

            <RevenueStreamsCrudList
              streams={revenueStreams}
              parentCategories={revenueCategoryData}
              subcategories={revenueSubcategoryData}
              stages={stageData}
              parentCategoryIdFilter={vehicleStreamParentFilter}
              onParentCategoryIdFilterChange={setVehicleStreamParentFilter}
              onRefresh={onRefreshStreams}
            />
          </div>

          {selectedVehicle && (
            <aside className="dashboard-detail-panel" aria-label="Vehicle">
              <header className="dashboard-detail-header">
                <div>
                  <h2>{selectedVehicle.registration}</h2>
                  <p>{selectedVehicle.makeModel}</p>
                </div>
                <button
                  type="button"
                  className="detail-close-button"
                  aria-label="Close details"
                  onClick={() => setSelectedVehicle(null)}
                >
                  ×
                </button>
              </header>

              <dl className="detail-list">
                <div className="detail-row">
                  <dt>Vehicle type</dt>
                  <dd>{selectedVehicle.vehicleType}</dd>
                </div>
                <div className="detail-row">
                  <dt>Color</dt>
                  <dd>{selectedVehicle.color}</dd>
                </div>
                <div className="detail-row">
                  <dt>Stage</dt>
                  <dd>{selectedVehicle.stage}</dd>
                </div>
                <div className="detail-row">
                  <dt>VIN / chassis</dt>
                  <dd>{selectedVehicle.vin}</dd>
                </div>
                <div className="detail-row">
                  <dt>Operator</dt>
                  <dd>{selectedVehicle.operator}</dd>
                </div>
                <div className="detail-row">
                  <dt>Contact</dt>
                  <dd>{selectedVehicle.phone}</dd>
                </div>
                <div className="detail-row">
                  <dt>Status</dt>
                  <dd>{selectedVehicle.status}</dd>
                </div>
                <div className="detail-row">
                  <dt>Registered at</dt>
                  <dd>{selectedVehicle.createdAt}</dd>
                </div>
              </dl>
            </aside>
          )}
        </div>
      )}

      {showNewVehicle && (
        <div className="dashboard-page">
          <div className="dashboard-page-header-row">
            <div>
              <h1 className="dashboard-page-title">New vehicle</h1>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowNewVehicle(false)}
            >
              Back to vehicles
            </button>
          </div>
          <div className="dashboard-register-embed">
            <RegisterApp />
          </div>
        </div>
      )}
    </>
  )
}

import type {
  RevenueCategoryRead,
  RevenueStreamRead,
  RevenueSubcategoryRead,
  StageRead,
} from '../../api/types'
import { RegisterApp } from '../../RegisterApp'
import { RevenueStreamsCrudList } from '../../components/revenue/RevenueStreamsCrudList'

interface VehiclesPageProps {
  showNewVehicle: boolean
  setShowNewVehicle: (v: boolean) => void
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
        <div className="dashboard-page">
          <div className="dashboard-page-header-row">
            <h1 className="dashboard-page-title">Vehicles</h1>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowNewVehicle(true)}
            >
              + New Vehicle
            </button>
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

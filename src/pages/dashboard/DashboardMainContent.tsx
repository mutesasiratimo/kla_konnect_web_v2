import type {
  IncidentCategoryRead,
  IncidentRead,
  NewsArticleRead,
  NewsCategoryRead,
  RevenueCategoryRead,
  RevenueStreamRead,
  RevenueSubcategoryRead,
  RoleRead,
  StageRead,
  UserRead,
} from '../../api/types'
import type { DashboardPage } from './navConfig'
import type { DonutSegment, IncidentDateRangeFilter } from './pageTypes'
import type {
  RouteRecord,
  StageRecord,
  SubscriptionCategoryRow,
  VehicleRecord,
} from './mockData'
import { DashboardHomePage } from './DashboardHomePage'
import { IncidentsSection } from './IncidentsSection'
import { NewsSection } from './NewsSection'
import { VehiclesPage } from './VehiclesPage'
import { StagesPage } from './StagesPage'
import { CategoriesPage } from './CategoriesPage'
import { RoutesPage } from './RoutesPage'
import { ReportsPage } from './ReportsPage'
import { SubscriptionsPage } from './SubscriptionsPage'
import { EnforcementsPage } from './EnforcementsPage'
import { UsersPage } from './UsersPage'
import { SettingsPageView } from './SettingsPageView'

export interface DashboardMainContentProps {
  currentPage: DashboardPage
  userName: string
  donutSegments: DonutSegment[]
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
  newsLoadError: string | null
  newsData: NewsArticleRead[]
  newsCategoryData: NewsCategoryRead[]
  loadNewsArticles: () => void | Promise<void>
  loadNewsCategories: () => void | Promise<void>
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
  vehicleStreamParentFilter: string
  setVehicleStreamParentFilter: (id: string) => void
  stageData: StageRead[]
  onRefreshStreams: () => void | Promise<void>
  sampleStages: StageRecord[]
  sampleRoutes: RouteRecord[]
  subscriptionsByCategory: SubscriptionCategoryRow[]
  revenueLoadError: string | null
  revenueCategoryData: RevenueCategoryRead[]
  revenueSubcategoryData: RevenueSubcategoryRead[]
  revenueSubParentFilter: string
  setRevenueSubParentFilter: (id: string) => void
  onRefreshRevenue: () => void | Promise<void>
  usersLoadError: string | null
  userData: UserRead[]
  roleData: RoleRead[]
  onRefreshUsers: () => void | Promise<void>
  onRefreshParentCategories: () => void | Promise<void>
}

export function DashboardMainContent(props: DashboardMainContentProps) {
  const { currentPage, userName, donutSegments } = props

  return (
    <main className="dashboard-content">
      {currentPage === 'dashboard' && (
        <DashboardHomePage userName={userName} donutSegments={donutSegments} />
      )}

      {(currentPage === 'incidents' ||
        currentPage === 'incidents-summary' ||
        currentPage === 'incidents-incidents' ||
        currentPage === 'incidents-city-alerts' ||
        currentPage === 'incidents-categories') && (
        <IncidentsSection
          currentPage={currentPage}
          incidentsLoadError={props.incidentsLoadError}
          incidentDateFilter={props.incidentDateFilter}
          setIncidentDateFilter={props.setIncidentDateFilter}
          incidentCustomFrom={props.incidentCustomFrom}
          setIncidentCustomFrom={props.setIncidentCustomFrom}
          incidentCustomTo={props.incidentCustomTo}
          setIncidentCustomTo={props.setIncidentCustomTo}
          pendingIncidentsCount={props.pendingIncidentsCount}
          liveIncidentsCount={props.liveIncidentsCount}
          resolvedIncidentsCount={props.resolvedIncidentsCount}
          avgResolutionHours={props.avgResolutionHours}
          incidentData={props.incidentData}
          incidentRecords={props.incidentRecords}
          cityAlertRecords={props.cityAlertRecords}
          catData={props.catData}
          loadIncidents={props.loadIncidents}
          loadCategories={props.loadCategories}
        />
      )}

      {(currentPage === 'news' ||
        currentPage === 'news-news' ||
        currentPage === 'news-categories') && (
        <NewsSection
          currentPage={currentPage}
          newsLoadError={props.newsLoadError}
          newsData={props.newsData}
          newsCategoryData={props.newsCategoryData}
          loadNewsArticles={props.loadNewsArticles}
          loadNewsCategories={props.loadNewsCategories}
        />
      )}

      {currentPage === 'vehicles' && (
        <VehiclesPage
          showNewVehicle={props.showNewVehicle}
          setShowNewVehicle={props.setShowNewVehicle}
          vehicleCategoryFilter={props.vehicleCategoryFilter}
          setVehicleCategoryFilter={props.setVehicleCategoryFilter}
          vehicleStageFilter={props.vehicleStageFilter}
          setVehicleStageFilter={props.setVehicleStageFilter}
          vehicleDivisionFilter={props.vehicleDivisionFilter}
          setVehicleDivisionFilter={props.setVehicleDivisionFilter}
          vehiclePaymentFilter={props.vehiclePaymentFilter}
          setVehiclePaymentFilter={props.setVehiclePaymentFilter}
          vehiclePermitFilter={props.vehiclePermitFilter}
          setVehiclePermitFilter={props.setVehiclePermitFilter}
          vehicleSearch={props.vehicleSearch}
          setVehicleSearch={props.setVehicleSearch}
          pagedVehicles={props.pagedVehicles}
          currentVehiclePage={props.currentVehiclePage}
          totalVehiclePages={props.totalVehiclePages}
          pageSize={props.pageSize}
          filteredVehiclesLength={props.filteredVehiclesLength}
          goToVehiclePage={props.goToVehiclePage}
          selectedVehicle={props.selectedVehicle}
          setSelectedVehicle={props.setSelectedVehicle}
          streamsLoadError={props.streamsLoadError}
          revenueStreams={props.revenueStreams}
          revenueCategoryData={props.revenueCategoryData}
          revenueSubcategoryData={props.revenueSubcategoryData}
          vehicleStreamParentFilter={props.vehicleStreamParentFilter}
          setVehicleStreamParentFilter={props.setVehicleStreamParentFilter}
          stageData={props.stageData}
          onRefreshStreams={props.onRefreshStreams}
          revenueLoadError={props.revenueLoadError}
        />
      )}

      {currentPage === 'stages' && (
        <StagesPage sampleStages={props.sampleStages} />
      )}

      {currentPage === 'categories' && (
        <CategoriesPage
          revenueLoadError={props.revenueLoadError}
          revenueCategoryData={props.revenueCategoryData}
          revenueSubcategoryData={props.revenueSubcategoryData}
          revenueSubParentFilter={props.revenueSubParentFilter}
          setRevenueSubParentFilter={props.setRevenueSubParentFilter}
          onRefreshRevenue={props.onRefreshRevenue}
        />
      )}

      {currentPage === 'routes' && (
        <RoutesPage sampleRoutes={props.sampleRoutes} />
      )}

      {currentPage === 'reports' && <ReportsPage />}

      {currentPage === 'subscriptions' && (
        <SubscriptionsPage
          subscriptionsByCategory={props.subscriptionsByCategory}
        />
      )}

      {currentPage === 'enforcements' && <EnforcementsPage />}

      {currentPage === 'users' && (
        <UsersPage
          usersLoadError={props.usersLoadError}
          userData={props.userData}
          roleData={props.roleData}
          onRefreshUsers={props.onRefreshUsers}
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPageView
          userName={userName}
          revenueCategoryData={props.revenueCategoryData}
          revenueLoadError={props.revenueLoadError}
          onRefreshParentCategories={props.onRefreshParentCategories}
        />
      )}
    </main>
  )
}

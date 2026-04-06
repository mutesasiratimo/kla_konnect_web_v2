import type {
  IncidentCategoryRead,
  IncidentRead,
  NewsArticleRead,
  NewsCategoryRead,
  RevenueCategoryRead,
  RevenueSubscriptionRead,
  RouteChartRead,
  RevenueStreamRead,
  RevenueSubcategoryRead,
  RoleRead,
  StageRead,
  UserRead,
} from '../../api/types'
import type { DashboardPage } from './navConfig'
import type { IncidentDateRangeFilter } from './pageTypes'
import type {
  SubscriptionCategoryRow,
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
  archivedIncidentsCount: number
  dashboardPendingIncidentsCount?: number
  dashboardLiveIncidentsCount?: number
  dashboardResolvedIncidentsCount?: number
  dashboardArchivedIncidentsCount?: number
  dashboardUsersCount?: number
  dashboardVehiclesTotalCount?: number
  dashboardVehiclesCompliantCount?: number
  dashboardVehiclesInReviewCount?: number
  avgResolutionHours: number | null
  incidentRecords: IncidentRead[]
  cityAlertRecords: IncidentRead[]
  catData: IncidentCategoryRead[]
  loadIncidents: () => void | Promise<void>
  loadCityAlerts: () => void | Promise<void>
  loadCategories: () => void | Promise<void>
  newsLoadError: string | null
  newsData: NewsArticleRead[]
  newsCategoryData: NewsCategoryRead[]
  loadNewsArticles: () => void | Promise<void>
  loadNewsCategories: () => void | Promise<void>
  showNewVehicle: boolean
  setShowNewVehicle: (v: boolean) => void
  vehicleStats: {
    total: number
    compliant: number
    inReview: number
  }
  onViewIncidentDetails: () => void
  streamsLoadError: string | null
  revenueStreams: RevenueStreamRead[]
  vehicleStreamParentFilter: string
  setVehicleStreamParentFilter: (id: string) => void
  stageData: StageRead[]
  onRefreshStreams: () => void | Promise<void>
  onRefreshStages: () => void | Promise<void>
  routeChartData: RouteChartRead[]
  routeChartsLoadError: string | null
  onRefreshRouteCharts: () => void | Promise<void>
  subscriptionsByCategory: SubscriptionCategoryRow[]
  revenueLoadError: string | null
  revenueCategoryData: RevenueCategoryRead[]
  revenueSubscriptionData: RevenueSubscriptionRead[]
  revenueSubcategoryData: RevenueSubcategoryRead[]
  revenueSubParentFilter: string
  setRevenueSubParentFilter: (id: string) => void
  onRefreshRevenue: () => void | Promise<void>
  usersLoadError: string | null
  userData: UserRead[]
  roleData: RoleRead[]
  onRefreshUsers: () => void | Promise<void>
  onRefreshParentCategories: () => void | Promise<void>
  onRefreshSubscriptions: () => void | Promise<void>
  onRefreshRoles: () => void | Promise<void>
  usersActiveCount?: number
  incidentsVsTimeData?: {
    monthly: { label: string; value: number }[]
    quarterly: { label: string; value: number }[]
    annual: { label: string; value: number }[]
  }
  incidentsByCategoryData?: { name: string; value: number }[]
  analyticsLoading?: boolean
}

export function DashboardMainContent(props: DashboardMainContentProps) {
  const { currentPage, userName } = props

  return (
    <main className="dashboard-content">
      {currentPage === 'dashboard' && (
        <DashboardHomePage
          pendingIncidentsCount={
            props.dashboardPendingIncidentsCount ?? props.pendingIncidentsCount
          }
          liveIncidentsCount={
            props.dashboardLiveIncidentsCount ?? props.liveIncidentsCount
          }
          resolvedIncidentsCount={
            props.dashboardResolvedIncidentsCount ?? props.resolvedIncidentsCount
          }
          archivedIncidentsCount={
            props.dashboardArchivedIncidentsCount ?? props.archivedIncidentsCount
          }
          usersCount={props.dashboardUsersCount ?? props.userData.length}
          usersActiveCount={props.usersActiveCount}
          vehiclesTotalCount={
            props.dashboardVehiclesTotalCount ?? props.vehicleStats.total
          }
          vehiclesCompliantCount={
            props.dashboardVehiclesCompliantCount ?? props.vehicleStats.compliant
          }
          vehiclesInReviewCount={
            props.dashboardVehiclesInReviewCount ?? props.vehicleStats.inReview
          }
          onViewIncidentDetails={props.onViewIncidentDetails}
          recentIncidents={props.incidentRecords.slice(0, 9)}
          mapIncidents={[
            ...props.incidentRecords,
            ...props.cityAlertRecords.filter(
              (alert) =>
                !props.incidentRecords.some((incident) => incident.id === alert.id),
            ),
          ]}
          incidentCategories={props.catData}
          incidentsVsTimeData={props.incidentsVsTimeData}
          incidentsByCategoryData={props.incidentsByCategoryData}
          analyticsLoading={props.analyticsLoading}
        />
      )}

      {(currentPage === 'incidents' ||
        currentPage === 'incidents-incidents' ||
        currentPage === 'incidents-city-alerts' ||
        currentPage === 'city-alerts' ||
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
          incidentRecords={props.incidentRecords}
          cityAlertRecords={props.cityAlertRecords}
          catData={props.catData}
          loadIncidents={props.loadIncidents}
          loadCityAlerts={props.loadCityAlerts}
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

      {(currentPage === 'vehicles' || currentPage === 'mobility') && (
        <VehiclesPage
          showNewVehicle={props.showNewVehicle}
          setShowNewVehicle={props.setShowNewVehicle}
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
        <StagesPage stageData={props.stageData} onRefreshStages={props.onRefreshStages} />
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
        <RoutesPage
          routeChartsData={props.routeChartData}
          routeChartsLoadError={props.routeChartsLoadError}
          revenueSubcategoryData={props.revenueSubcategoryData}
          onRefreshRouteCharts={props.onRefreshRouteCharts}
        />
      )}

      {currentPage === 'reports' && <ReportsPage />}

      {(currentPage === 'subscriptions' || currentPage === 'revenue-assurance') && (
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
          revenueStreamData={props.revenueStreams}
          revenueSubscriptionData={props.revenueSubscriptionData}
          revenueLoadError={props.revenueLoadError}
          onRefreshParentCategories={props.onRefreshParentCategories}
          onRefreshSubscriptions={props.onRefreshSubscriptions}
          roleData={props.roleData}
          onRefreshRoles={props.onRefreshRoles}
        />
      )}
    </main>
  )
}

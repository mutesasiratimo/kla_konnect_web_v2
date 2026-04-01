import { useState, useRef, useEffect, useCallback } from 'react'
import './Dashboard.css'
import {
  incidents,
  incidentCategories,
  newsArticles,
  newsCategories,
  users,
  roles,
  revenueCategories,
  revenueSubcategories,
  revenueStreams,
  revenueSubscriptions,
  stages,
  routeCharts,
  analytics,
} from './api/endpoints'
import type {
  IncidentRead,
  IncidentCategoryRead,
  NewsArticleRead,
  NewsCategoryRead,
  UserRead,
  RoleRead,
  RevenueCategoryRead,
  RevenueStreamRead,
  RevenueSubscriptionRead,
  RevenueSubcategoryRead,
  StageRead,
  RouteChartRead,
} from './api/types'
import {
  type DashboardPage,
  pageToPath,
  navItems,
  incidentPages,
  newsPages,
  mobilityPages,
  revenueAssurancePages,
} from './pages/dashboard/navConfig'
import {
  sampleVehicles,
  subscriptionsByCategory,
} from './pages/dashboard/mockData'
import type { IncidentDateRangeFilter } from './pages/dashboard/pageTypes'
import { DashboardMainContent } from './pages/dashboard/DashboardMainContent'

type DashboardProps = {
  userName: string
  onLogout: () => void
}

type DashboardDatePreset =
  | 'ytd'
  | 'today'
  | 'this-month'
  | 'this-quarter'
  | 'this-year'
  | 'custom'

type TimeSeriesPoint = { label: string; value: number }

type DashboardAnalyticsState = {
  summary: Record<string, unknown> | null
  incidentsVsTime: Record<string, unknown> | null
  incidentsByCategory: Record<string, unknown> | null
}

function Dashboard({ userName, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<DashboardPage>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [incidentsExpanded, setIncidentsExpanded] = useState(false)
  const [newsExpanded, setNewsExpanded] = useState(false)
  const [mobilityExpanded, setMobilityExpanded] = useState(false)
  const [revenueAssuranceExpanded, setRevenueAssuranceExpanded] = useState(false)
  const [dashboardDatePreset, setDashboardDatePreset] =
    useState<DashboardDatePreset>('ytd')
  const [dashboardFromDate, setDashboardFromDate] = useState('')
  const [dashboardToDate, setDashboardToDate] = useState('')
  const [dashboardDatePickerOpen, setDashboardDatePickerOpen] = useState(false)
  const [dashboardAnalytics, setDashboardAnalytics] =
    useState<DashboardAnalyticsState>({
      summary: null,
      incidentsVsTime: null,
      incidentsByCategory: null,
    })
  const [dashboardAnalyticsLoading, setDashboardAnalyticsLoading] = useState(false)
  const [dashboardAnalyticsError, setDashboardAnalyticsError] = useState<string | null>(
    null,
  )
  const [showNewVehicle, setShowNewVehicle] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [incidentData, setIncidentData] = useState<IncidentRead[]>([])
  const [cityAlertData, setCityAlertData] = useState<IncidentRead[]>([])
  const [catData, setCatData] = useState<IncidentCategoryRead[]>([])
  const [newsData, setNewsData] = useState<NewsArticleRead[]>([])
  const [newsCategoryData, setNewsCategoryData] = useState<NewsCategoryRead[]>(
    [],
  )
  const [incidentsLoadError, setIncidentsLoadError] = useState<string | null>(
    null,
  )
  const [newsLoadError, setNewsLoadError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserRead[]>([])
  const [roleData, setRoleData] = useState<RoleRead[]>([])
  const [usersLoadError, setUsersLoadError] = useState<string | null>(null)
  const [revenueCategoryData, setRevenueCategoryData] = useState<
    RevenueCategoryRead[]
  >([])
  const [revenueSubcategoryData, setRevenueSubcategoryData] = useState<
    RevenueSubcategoryRead[]
  >([])
  const [revenueLoadError, setRevenueLoadError] = useState<string | null>(null)
  const [revenueStreamData, setRevenueStreamData] = useState<RevenueStreamRead[]>(
    [],
  )
  const [streamsLoadError, setStreamsLoadError] = useState<string | null>(null)
  const [stageData, setStageData] = useState<StageRead[]>([])
  const [revenueSubscriptionData, setRevenueSubscriptionData] = useState<
    RevenueSubscriptionRead[]
  >([])
  const [routeChartData, setRouteChartData] = useState<RouteChartRead[]>([])
  const [routeChartsLoadError, setRouteChartsLoadError] = useState<string | null>(
    null,
  )
  const [vehicleStreamParentFilter, setVehicleStreamParentFilter] =
    useState<string>('')
  const [revenueSubParentFilter, setRevenueSubParentFilter] =
    useState<string>('')
  const [incidentDateFilter, setIncidentDateFilter] =
    useState<IncidentDateRangeFilter>('this-month')
  const [incidentCustomFrom, setIncidentCustomFrom] = useState('')
  const [incidentCustomTo, setIncidentCustomTo] = useState('')

  const loadIncidents = useCallback(async () => {
    try {
      const data = await incidents.list()
      setIncidentData(data)
      setIncidentsLoadError(null)
    } catch (e) {
      console.error(e)
      setIncidentsLoadError(
        'Could not load incidents. Sign in and ensure the API is reachable.',
      )
    }
  }, [])

  const loadCityAlerts = useCallback(async () => {
    try {
      const data = await incidents.listCityAlerts()
      setCityAlertData(data)
      setIncidentsLoadError(null)
    } catch (e) {
      console.error(e)
      setIncidentsLoadError(
        'Could not load city alerts. Sign in and ensure the API is reachable.',
      )
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const data = await incidentCategories.list()
      setCatData(data)
      setIncidentsLoadError(null)
    } catch (e) {
      console.error(e)
      setIncidentsLoadError(
        'Could not load incident categories. Sign in and ensure the API is reachable.',
      )
    }
  }, [])

  const loadNewsArticles = useCallback(async () => {
    try {
      const data = await newsArticles.list()
      setNewsData(data)
      setNewsLoadError(null)
    } catch (e) {
      console.error(e)
      setNewsLoadError('Could not load news articles.')
    }
  }, [])

  const loadNewsCategories = useCallback(async () => {
    try {
      const data = await newsCategories.list()
      setNewsCategoryData(data)
      setNewsLoadError(null)
    } catch (e) {
      console.error(e)
      setNewsLoadError('Could not load news categories.')
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      const data = await users.list()
      setUserData(data)
      setUsersLoadError(null)
    } catch (e) {
      console.error(e)
      setUsersLoadError(
        'Could not load users. Sign in and ensure the API is reachable.',
      )
    }
  }, [])

  const loadRoles = useCallback(async () => {
    try {
      const data = await roles.list()
      setRoleData(data)
    } catch (e) {
      console.error(e)
      setRoleData([])
      setUsersLoadError(
        (prev) =>
          prev ??
          'Could not load roles. Role names may be missing until this succeeds.',
      )
    }
  }, [])

  const loadRevenueCategories = useCallback(async () => {
    try {
      const data = await revenueCategories.list()
      setRevenueCategoryData(data)
      setRevenueLoadError(null)
    } catch (e) {
      console.error(e)
      setRevenueLoadError(
        'Could not load revenue categories. Sign in and ensure the API is reachable.',
      )
    }
  }, [])

  const loadRevenueSubcategories = useCallback(
    async (categoryId?: string | null) => {
      try {
        const data = await revenueSubcategories.list(
          categoryId && categoryId !== '' ? categoryId : undefined,
        )
        setRevenueSubcategoryData(data)
      } catch (e) {
        console.error(e)
        setRevenueLoadError(
          (prev) =>
            prev ??
            'Could not load categories for this filter. The list may be incomplete.',
        )
      }
    },
    [],
  )

  const loadRevenueStreams = useCallback(async () => {
    try {
      const data = await revenueStreams.list()
      setRevenueStreamData(data)
      setStreamsLoadError(null)
    } catch (e) {
      console.error(e)
      setStreamsLoadError(
        'Could not load revenue streams. Sign in and ensure the API is reachable.',
      )
    }
  }, [])

  const loadRevenueSubscriptions = useCallback(async () => {
    try {
      const data = await revenueSubscriptions.list()
      setRevenueSubscriptionData(data)
      setRevenueLoadError(null)
    } catch (e) {
      console.error(e)
      setRevenueLoadError(
        (prev) =>
          prev ??
          'Could not load subscriptions. Sign in and ensure the API is reachable.',
      )
    }
  }, [])

  const loadStages = useCallback(async () => {
    try {
      const data = await stages.list()
      setStageData(data)
    } catch (e) {
      console.error(e)
      setStageData([])
    }
  }, [])

  const loadRouteCharts = useCallback(async () => {
    try {
      const data = await routeCharts.list()
      setRouteChartData(data)
      setRouteChartsLoadError(null)
    } catch (e) {
      console.error(e)
      setRouteChartsLoadError(
        'Could not load route charts. Sign in and ensure the API is reachable.',
      )
    }
  }, [])

  const toIsoStart = (dateStr: string): string =>
    new Date(`${dateStr}T00:00:00`).toISOString()
  const toIsoEnd = (dateStr: string): string =>
    new Date(`${dateStr}T23:59:59.999`).toISOString()

  const getDashboardDateRange = useCallback(() => {
    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    if (dashboardDatePreset === 'custom') {
      if (!dashboardFromDate || !dashboardToDate) return null
      return {
        from_date: toIsoStart(dashboardFromDate),
        to_date: toIsoEnd(dashboardToDate),
      }
    }
    if (dashboardDatePreset === 'today') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { from_date: start.toISOString(), to_date: end.toISOString() }
    }
    if (dashboardDatePreset === 'this-month') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { from_date: start.toISOString(), to_date: end.toISOString() }
    }
    if (dashboardDatePreset === 'this-quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      start.setMonth(quarterStartMonth, 1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { from_date: start.toISOString(), to_date: end.toISOString() }
    }
    if (dashboardDatePreset === 'this-year' || dashboardDatePreset === 'ytd') {
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { from_date: start.toISOString(), to_date: end.toISOString() }
    }
    return null
  }, [dashboardDatePreset, dashboardFromDate, dashboardToDate])

  const loadDashboardAnalytics = useCallback(async () => {
    const range = getDashboardDateRange()
    if (!range) return
    setDashboardAnalyticsLoading(true)
    try {
      const [summary, vsTime, byCategory] = await Promise.all([
        analytics.dashboardSummaryStats(range),
        analytics.incidentsVsTime(range),
        analytics.incidentsByCategory(range),
      ])
      setDashboardAnalytics({
        summary,
        incidentsVsTime: vsTime,
        incidentsByCategory: byCategory,
      })
      setDashboardAnalyticsError(null)
    } catch (e) {
      console.error(e)
      setDashboardAnalyticsError(
        'Could not load dashboard analytics. Showing fallback values.',
      )
    } finally {
      setDashboardAnalyticsLoading(false)
    }
  }, [getDashboardDateRange])

  useEffect(() => {
    if (currentPage === 'dashboard') {
      void loadIncidents()
      void loadCityAlerts()
      void loadCategories()
      return
    }
    if (currentPage === 'incidents-city-alerts' || currentPage === 'city-alerts') {
      void loadCityAlerts()
      void loadCategories()
      return
    }
    if (currentPage.startsWith('incidents')) {
      void loadIncidents()
      void loadCategories()
    }
  }, [currentPage, loadIncidents, loadCityAlerts, loadCategories])

  useEffect(() => {
    if (currentPage.startsWith('news')) {
      void loadNewsArticles()
      void loadNewsCategories()
    }
  }, [currentPage, loadNewsArticles, loadNewsCategories])

  useEffect(() => {
    if (currentPage === 'users' || currentPage === 'settings') {
      void loadUsers()
      void loadRoles()
    }
  }, [currentPage, loadUsers, loadRoles])

  useEffect(() => {
    if (currentPage === 'dashboard' && userData.length === 0) {
      void loadUsers()
    }
  }, [currentPage, userData.length, loadUsers])

  useEffect(() => {
    if (currentPage === 'dashboard') {
      void loadDashboardAnalytics()
    }
  }, [currentPage, loadDashboardAnalytics])

  useEffect(() => {
    if (currentPage !== 'dashboard') return
    const refreshId = window.setInterval(() => {
      void loadDashboardAnalytics()
    }, 5 * 60 * 1000)
    return () => {
      window.clearInterval(refreshId)
    }
  }, [currentPage, loadDashboardAnalytics])

  useEffect(() => {
    if (currentPage === 'categories') {
      void loadRevenueCategories()
      void loadRevenueSubcategories(
        revenueSubParentFilter === '' ? undefined : revenueSubParentFilter,
      )
    }
  }, [
    currentPage,
    revenueSubParentFilter,
    loadRevenueCategories,
    loadRevenueSubcategories,
  ])

  useEffect(() => {
    if (currentPage === 'settings') {
      void loadRevenueCategories()
      void loadRevenueStreams()
      void loadRevenueSubscriptions()
    }
  }, [currentPage, loadRevenueCategories, loadRevenueStreams, loadRevenueSubscriptions])

  useEffect(() => {
    if (currentPage === 'routes') {
      void loadRouteCharts()
      void loadRevenueSubcategories(undefined)
    }
  }, [currentPage, loadRouteCharts, loadRevenueSubcategories])

  useEffect(() => {
    if (currentPage === 'vehicles') {
      void loadRevenueStreams()
      void loadStages()
      void loadRevenueCategories()
      void loadRevenueSubcategories(undefined)
    }
  }, [
    currentPage,
    loadRevenueStreams,
    loadStages,
    loadRevenueCategories,
    loadRevenueSubcategories,
  ])

  useEffect(() => {
    if (incidentPages.includes(currentPage)) {
      setIncidentsExpanded(true)
    }
  }, [currentPage])

  useEffect(() => {
    if (newsPages.includes(currentPage)) {
      setNewsExpanded(true)
    }
  }, [currentPage])

  useEffect(() => {
    if (mobilityPages.includes(currentPage)) {
      setMobilityExpanded(true)
    }
  }, [currentPage])

  useEffect(() => {
    if (revenueAssurancePages.includes(currentPage)) {
      setRevenueAssuranceExpanded(true)
    }
  }, [currentPage])

  useEffect(() => {
    if (!darkMode) {
      document.documentElement.classList.remove('dashboard-dark')
    } else {
      document.documentElement.classList.add('dashboard-dark')
    }
    return () => {
      document.documentElement.classList.remove('dashboard-dark')
    }
  }, [darkMode])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeSidebarMobile = () => setSidebarOpen(false)

  useEffect(() => {
    const pathname = window.location.pathname
    const entry = (Object.entries(pageToPath) as [DashboardPage, string][]).find(
      ([, path]) => path === pathname,
    )
    if (entry) {
      setCurrentPage(entry[0])
    }
  }, [])

  const navigateTo = (page: DashboardPage) => {
    setCurrentPage(page)
    const targetPath = pageToPath[page]
    if (targetPath) {
      window.history.pushState({}, '', targetPath)
    }
    closeSidebarMobile()
  }

  const getDateRangeBounds = () => {
    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    if (incidentDateFilter === 'custom') {
      const customStart = incidentCustomFrom
        ? new Date(incidentCustomFrom)
        : null
      const customEnd = incidentCustomTo ? new Date(incidentCustomTo) : null
      if (customStart && !Number.isNaN(customStart.getTime())) {
        customStart.setHours(0, 0, 0, 0)
      }
      if (customEnd && !Number.isNaN(customEnd.getTime())) {
        customEnd.setHours(23, 59, 59, 999)
      }
      return { start: customStart, end: customEnd }
    }

    if (incidentDateFilter === 'today') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (incidentDateFilter === 'this-week') {
      const day = (now.getDay() + 6) % 7
      start.setDate(now.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (incidentDateFilter === 'this-month') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (incidentDateFilter === 'this-quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      start.setMonth(quarterStartMonth, 1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }

    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  const incidentRange = getDateRangeBounds()
  const incidentsInRange = incidentData.filter((incident) => {
    const created = new Date(incident.datecreated)
    if (Number.isNaN(created.getTime())) return false
    if (incidentRange.start && created < incidentRange.start) return false
    if (incidentRange.end && created > incidentRange.end) return false
    return true
  })

  const incidentRecords = incidentsInRange.filter((i) => !i.iscityreport)
  const cityAlertRecords = cityAlertData

  const pendingIncidents = incidentRecords.filter((i) => i.status === '1')
  const liveIncidents = pendingIncidents.filter((i) => i.isemergency)
  const resolvedIncidents = incidentRecords.filter((i) => i.status === '2')
  const archivedIncidents = incidentRecords.filter((i) => i.status === '0')

  const avgResolutionHours = (() => {
    const durations = resolvedIncidents
      .map((incident) => {
        if (!incident.dateupdated) return null
        const start = new Date(incident.datecreated).getTime()
        const end = new Date(incident.dateupdated).getTime()
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start)
          return null
        return (end - start) / (1000 * 60 * 60)
      })
      .filter((v): v is number => v !== null)
    if (durations.length === 0) return null
    const total = durations.reduce((sum, value) => sum + value, 0)
    return total / durations.length
  })()

  const vehicleStats = {
    total: sampleVehicles.length,
    compliant: sampleVehicles.filter(
      (v) => v.paymentStatus === 'Paid' && v.permitStatus === 'Valid',
    ).length,
    inReview: sampleVehicles.filter((v) => v.status === 'Pending').length,
  }

  const pickNumber = (obj: Record<string, unknown> | null, keys: string[]) => {
    if (!obj) return null
    for (const key of keys) {
      const value = obj[key]
      if (typeof value === 'number' && Number.isFinite(value)) return value
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value)
        if (!Number.isNaN(parsed)) return parsed
      }
    }
    return null
  }

  const summary = dashboardAnalytics.summary
  const summaryRevenueStreams =
    summary && typeof summary.revenue_streams === 'object'
      ? (summary.revenue_streams as Record<string, unknown>)
      : null
  const dashboardPendingCount =
    pickNumber(summary, ['pending_incidents', 'pending', 'incidents_pending']) ??
    pendingIncidents.length
  const dashboardLiveCount =
    pickNumber(summary, ['live_incidents', 'live', 'incidents_live']) ??
    liveIncidents.length
  const dashboardResolvedCount =
    pickNumber(summary, ['resolved_incidents', 'resolved', 'incidents_resolved']) ??
    resolvedIncidents.length
  const dashboardArchivedCount =
    pickNumber(summary, ['archived_incidents', 'archived', 'incidents_archived']) ??
    archivedIncidents.length
  const dashboardUsersCount =
    pickNumber(summary, ['total_users', 'users_total', 'users']) ?? userData.length
  const dashboardUsersActiveCount =
    pickNumber(summary, ['active_users', 'users_active']) ?? dashboardUsersCount
  const dashboardVehiclesTotalCount =
    pickNumber(summaryRevenueStreams, ['total']) ??
    pickNumber(summary, ['total_vehicles', 'vehicles_total', 'vehicles']) ??
    vehicleStats.total
  const dashboardVehiclesCompliantCount =
    pickNumber(summaryRevenueStreams, ['compliant']) ??
    pickNumber(summary, ['compliant_vehicles', 'vehicles_compliant']) ??
    vehicleStats.compliant
  const dashboardVehiclesInReviewCount =
    pickNumber(summaryRevenueStreams, ['pending']) ??
    pickNumber(summary, ['vehicles_in_review', 'in_review_vehicles']) ??
    vehicleStats.inReview

  const normalizeTimeSeries = (
    payload: Record<string, unknown> | null,
    keys: string[],
  ): TimeSeriesPoint[] => {
    if (!payload) return []

    const parseFromArray = (items: unknown[]): TimeSeriesPoint[] =>
      items
        .map((row) => {
          if (!row || typeof row !== 'object') return null
          const obj = row as Record<string, unknown>
          const label = String(
            obj.label ?? obj.name ?? obj.period ?? obj.month ?? obj.quarter ?? obj.year ?? '',
          ).trim()
          const raw = obj.value ?? obj.count ?? obj.incidents ?? obj.total
          const value = typeof raw === 'number' ? raw : Number(raw)
          if (!label || Number.isNaN(value)) return null
          return { label, value }
        })
        .filter((v): v is TimeSeriesPoint => v !== null)

    const parseFromRecord = (obj: Record<string, unknown>): TimeSeriesPoint[] =>
      Object.entries(obj)
        .map(([label, raw]) => {
          const value = typeof raw === 'number' ? raw : Number(raw)
          if (!label || Number.isNaN(value)) return null
          return { label: String(label).trim(), value }
        })
        .filter((v): v is TimeSeriesPoint => v !== null)

    const containers: Record<string, unknown>[] = [
      payload,
      ...(payload.data && typeof payload.data === 'object'
        ? [payload.data as Record<string, unknown>]
        : []),
      ...(payload.results && typeof payload.results === 'object'
        ? [payload.results as Record<string, unknown>]
        : []),
    ]

    for (const container of containers) {
      for (const key of keys) {
        const candidate = container[key]
        if (Array.isArray(candidate)) {
          const parsed = parseFromArray(candidate)
          if (parsed.length > 0) return parsed
        } else if (candidate && typeof candidate === 'object') {
          const parsed = parseFromRecord(candidate as Record<string, unknown>)
          if (parsed.length > 0) return parsed
        }
      }
    }

    return []
  }

  const incidentsVsTimeData = {
    monthly: normalizeTimeSeries(dashboardAnalytics.incidentsVsTime, [
      'monthly',
      'month',
      'months',
      'monthly_data',
    ]),
    quarterly: normalizeTimeSeries(dashboardAnalytics.incidentsVsTime, [
      'quarterly',
      'quarters',
      'quarterly_data',
    ]),
    annual: normalizeTimeSeries(dashboardAnalytics.incidentsVsTime, [
      'annual',
      'yearly',
      'years',
      'annual_data',
    ]),
  }

  const incidentsByCategoryData = (() => {
    const payload = dashboardAnalytics.incidentsByCategory
    if (!payload) return []
    const source = (['categories', 'data', 'items'] as const)
      .map((k) => payload[k])
      .find((v) => Array.isArray(v)) as unknown[] | undefined
    if (!source) return []
    return source
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const obj = row as Record<string, unknown>
        const name = String(obj.name ?? obj.category ?? obj.label ?? '').trim()
        const raw = obj.value ?? obj.count ?? obj.total
        const value = typeof raw === 'number' ? raw : Number(raw)
        if (!name || Number.isNaN(value)) return null
        return { name, value }
      })
      .filter((v): v is { name: string; value: number } => v !== null)
  })()

  const isIncidentsActive = incidentPages.includes(currentPage)
  const isNewsActive = newsPages.includes(currentPage)
  const isMobilityActive = mobilityPages.includes(currentPage)
  const isRevenueAssuranceActive = revenueAssurancePages.includes(currentPage)
  const appBarTitle: string =
    {
      dashboard: 'Dashboard',
      incidents: 'Incidents',
      'incidents-summary': 'Incidents - Summary',
      'incidents-incidents': 'Incidents - Records',
      'incidents-city-alerts': 'Incidents - City Alerts',
      'city-alerts': 'City Alerts',
      'incidents-categories': 'Incidents - Categories',
      news: 'News',
      'news-news': 'News - Articles',
      'news-categories': 'News - Categories',
      mobility: 'Mobility',
      vehicles: 'Vehicles',
      stages: 'Stages',
      categories: 'Categories',
      routes: 'Route Charts',
      reports: 'Reports',
      'revenue-assurance': 'Revenue Assurance',
      subscriptions: 'Subscriptions',
      enforcements: 'Enforcements',
      users: 'Users',
      settings: 'Settings',
    }[currentPage] ?? 'Dashboard'

  const onRefreshRevenue = useCallback(async () => {
    await loadRevenueCategories()
    await loadRevenueSubcategories(
      revenueSubParentFilter === '' ? undefined : revenueSubParentFilter,
    )
  }, [
    loadRevenueCategories,
    loadRevenueSubcategories,
    revenueSubParentFilter,
  ])

  const onRefreshUsers = useCallback(async () => {
    await loadUsers()
    await loadRoles()
  }, [loadUsers, loadRoles])

  const onRefreshParentCategories = useCallback(async () => {
    await loadRevenueCategories()
  }, [loadRevenueCategories])
  const onRefreshSubscriptions = useCallback(async () => {
    await loadRevenueSubscriptions()
    await loadRevenueCategories()
    await loadRevenueStreams()
  }, [loadRevenueSubscriptions, loadRevenueCategories, loadRevenueStreams])

  const onViewIncidentDetails = () => {
    navigateTo('incidents-summary')
  }

  const onRefreshStreams = useCallback(async () => {
    await loadRevenueStreams()
    await loadRevenueCategories()
    await loadRevenueSubcategories(undefined)
    await loadStages()
  }, [
    loadRevenueStreams,
    loadRevenueCategories,
    loadRevenueSubcategories,
    loadStages,
  ])
  const onRefreshStages = useCallback(async () => {
    await loadStages()
  }, [loadStages])
  const onRefreshRouteCharts = useCallback(async () => {
    await loadRouteCharts()
    await loadRevenueSubcategories(undefined)
  }, [loadRouteCharts, loadRevenueSubcategories])

  return (
    <div
      className={`dashboard-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <aside
        className={`dashboard-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <span className="sidebar-logo">{sidebarCollapsed ? 'D' : 'DMMP'}</span>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="sidebar-toggle-icon">
              {sidebarCollapsed ? '→' : '←'}
            </span>
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            if (item.children) {
              const isIncidentGroup = item.key === 'incidents'
              const isNewsGroup = item.key === 'news'
              const isMobilityGroup = item.key === 'mobility'
              const isRevenueAssuranceGroup = item.key === 'revenue-assurance'
              const isActiveGroup = isIncidentGroup
                ? isIncidentsActive
                : isNewsGroup
                  ? isNewsActive
                  : isMobilityGroup
                    ? isMobilityActive
                    : isRevenueAssuranceActive
              const isExpanded = isIncidentGroup
                ? incidentsExpanded
                : isNewsGroup
                  ? newsExpanded
                  : isMobilityGroup
                    ? mobilityExpanded
                    : revenueAssuranceExpanded
              return (
                <div key={item.key} className="sidebar-nav-group">
                  <button
                    type="button"
                    className={`sidebar-nav-item sidebar-nav-item--group ${isActiveGroup ? 'active' : ''}`}
                    onClick={() => {
                      if (sidebarCollapsed) {
                        navigateTo(item.children![0].key)
                      } else {
                        if (isIncidentGroup) setIncidentsExpanded((e) => !e)
                        else if (isNewsGroup) setNewsExpanded((e) => !e)
                        else if (isMobilityGroup) setMobilityExpanded((e) => !e)
                        else if (isRevenueAssuranceGroup)
                          setRevenueAssuranceExpanded((e) => !e)
                      }
                    }}
                    aria-expanded={!sidebarCollapsed ? isExpanded : undefined}
                    aria-current={isActiveGroup ? 'page' : undefined}
                  >
                    <i
                      className={`fa ${item.icon} sidebar-nav-icon`}
                      aria-hidden="true"
                    />
                    {!sidebarCollapsed && (
                      <>
                        <span className="sidebar-nav-label">{item.label}</span>
                        <span
                          className={`sidebar-nav-chevron ${isExpanded ? 'sidebar-nav-chevron--open' : ''}`}
                          aria-hidden="true"
                        >
                          ›
                        </span>
                      </>
                    )}
                  </button>

                  {!sidebarCollapsed && isExpanded && (
                    <div
                      className="sidebar-nav-children"
                      role="group"
                      aria-label={`${item.label} sub-menu`}
                    >
                      {item.children.map((child) => (
                        <button
                          key={child.key}
                          type="button"
                          className={`sidebar-nav-item sidebar-nav-item--child ${currentPage === child.key ? 'active' : ''}`}
                          onClick={() => navigateTo(child.key)}
                          aria-current={
                            currentPage === child.key ? 'page' : undefined
                          }
                        >
                          <span className="sidebar-nav-child-dot" aria-hidden="true" />
                          <span className="sidebar-nav-label">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <button
                key={item.key}
                type="button"
                className={`sidebar-nav-item ${currentPage === item.key ? 'active' : ''}`}
                onClick={() => navigateTo(item.key)}
                aria-current={currentPage === item.key ? 'page' : undefined}
              >
                <i className={`fa ${item.icon} sidebar-nav-icon`} aria-hidden="true" />
                {!sidebarCollapsed && (
                  <span className="sidebar-nav-label">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="dashboard-overlay"
          aria-label="Close menu"
          onClick={closeSidebarMobile}
        />
      )}

      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <button
            type="button"
            className="navbar-mobile-menu"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>

          <div className="navbar-page-title" aria-live="polite">
            {appBarTitle}
          </div>

          <div className="navbar-spacer" />

          <div className="navbar-actions">
            <button
              type="button"
              className="navbar-icon-btn"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="navbar-calendar-wrap">
              <button
                type="button"
                className="navbar-icon-btn"
                aria-label="Dashboard date range"
                title="Dashboard date range"
                onClick={() => setDashboardDatePickerOpen((open) => !open)}
              >
                <i className="fa fa-calendar" aria-hidden="true" />
              </button>
              {dashboardDatePickerOpen && (
                <div className="navbar-calendar-popover">
                  <label className="dashboard-dialog-field">
                    <span>Range</span>
                    <select
                      className="dashboard-dialog-select"
                      value={dashboardDatePreset}
                      onChange={(e) =>
                        setDashboardDatePreset(e.target.value as DashboardDatePreset)
                      }
                    >
                      <option value="ytd">Year to date (default)</option>
                      <option value="today">Today</option>
                      <option value="this-month">This month</option>
                      <option value="this-quarter">This quarter</option>
                      <option value="this-year">This year</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  {dashboardDatePreset === 'custom' && (
                    <>
                      <label className="dashboard-dialog-field">
                        <span>From</span>
                        <input
                          type="date"
                          value={dashboardFromDate}
                          onChange={(e) => setDashboardFromDate(e.target.value)}
                        />
                      </label>
                      <label className="dashboard-dialog-field">
                        <span>To</span>
                        <input
                          type="date"
                          value={dashboardToDate}
                          onChange={(e) => setDashboardToDate(e.target.value)}
                        />
                      </label>
                    </>
                  )}
                  {dashboardAnalyticsError && (
                    <small className="dashboard-v2-inline-hint">
                      {dashboardAnalyticsError}
                    </small>
                  )}
                  <div className="dashboard-dialog-actions" style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setDashboardDatePickerOpen(false)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        void loadDashboardAnalytics()
                        setDashboardDatePickerOpen(false)
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="navbar-icon-btn"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={darkMode}
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <div className="navbar-user-wrap" ref={userMenuRef}>
              <button
                type="button"
                className="navbar-user-btn"
                onClick={() => setUserMenuOpen((o) => !o)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <span className="navbar-avatar" aria-hidden="true">
                  {(userName || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="navbar-user-name">{userName || 'User'}</span>
                <span className="navbar-user-chevron" aria-hidden="true">
                  ▼
                </span>
              </button>
              {userMenuOpen && (
                <div
                  className="navbar-user-menu"
                  role="menu"
                  aria-label="User menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="navbar-user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigateTo('settings')
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="navbar-user-menu-item"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigateTo('settings')
                    }}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="navbar-user-menu-item navbar-user-menu-item--logout"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onLogout()
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <DashboardMainContent
          currentPage={currentPage}
          userName={userName}
          incidentsLoadError={incidentsLoadError}
          incidentDateFilter={incidentDateFilter}
          setIncidentDateFilter={setIncidentDateFilter}
          incidentCustomFrom={incidentCustomFrom}
          setIncidentCustomFrom={setIncidentCustomFrom}
          incidentCustomTo={incidentCustomTo}
          setIncidentCustomTo={setIncidentCustomTo}
          pendingIncidentsCount={pendingIncidents.length}
          liveIncidentsCount={liveIncidents.length}
          resolvedIncidentsCount={resolvedIncidents.length}
          archivedIncidentsCount={archivedIncidents.length}
          dashboardPendingIncidentsCount={dashboardPendingCount}
          dashboardLiveIncidentsCount={dashboardLiveCount}
          dashboardResolvedIncidentsCount={dashboardResolvedCount}
          dashboardArchivedIncidentsCount={dashboardArchivedCount}
          dashboardUsersCount={dashboardUsersCount}
          dashboardVehiclesTotalCount={dashboardVehiclesTotalCount}
          dashboardVehiclesCompliantCount={dashboardVehiclesCompliantCount}
          dashboardVehiclesInReviewCount={dashboardVehiclesInReviewCount}
          avgResolutionHours={avgResolutionHours}
          incidentData={incidentData}
          incidentRecords={incidentRecords}
          cityAlertRecords={cityAlertRecords}
          catData={catData}
          loadIncidents={loadIncidents}
          loadCityAlerts={loadCityAlerts}
          loadCategories={loadCategories}
          newsLoadError={newsLoadError}
          newsData={newsData}
          newsCategoryData={newsCategoryData}
          loadNewsArticles={loadNewsArticles}
          loadNewsCategories={loadNewsCategories}
          showNewVehicle={showNewVehicle}
          setShowNewVehicle={setShowNewVehicle}
          vehicleStats={vehicleStats}
          onViewIncidentDetails={onViewIncidentDetails}
          streamsLoadError={streamsLoadError}
          revenueStreams={revenueStreamData}
          vehicleStreamParentFilter={vehicleStreamParentFilter}
          setVehicleStreamParentFilter={setVehicleStreamParentFilter}
          stageData={stageData}
          onRefreshStreams={onRefreshStreams}
          onRefreshStages={onRefreshStages}
          routeChartData={routeChartData}
          routeChartsLoadError={routeChartsLoadError}
          onRefreshRouteCharts={onRefreshRouteCharts}
          subscriptionsByCategory={subscriptionsByCategory}
          revenueLoadError={revenueLoadError}
          revenueCategoryData={revenueCategoryData}
          revenueSubscriptionData={revenueSubscriptionData}
          revenueSubcategoryData={revenueSubcategoryData}
          revenueSubParentFilter={revenueSubParentFilter}
          setRevenueSubParentFilter={setRevenueSubParentFilter}
          onRefreshRevenue={onRefreshRevenue}
          usersLoadError={usersLoadError}
          userData={userData}
          roleData={roleData}
          onRefreshUsers={onRefreshUsers}
          onRefreshParentCategories={onRefreshParentCategories}
          onRefreshSubscriptions={onRefreshSubscriptions}
          usersActiveCount={dashboardUsersActiveCount}
          incidentsVsTimeData={incidentsVsTimeData}
          incidentsByCategoryData={incidentsByCategoryData}
          analyticsLoading={dashboardAnalyticsLoading}
        />
                        </div>
    </div>
  )
}

export default Dashboard

export type { DashboardPage } from './pages/dashboard/navConfig'

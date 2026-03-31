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
  stages,
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
  RevenueSubcategoryRead,
  StageRead,
} from './api/types'
import {
  type DashboardPage,
  pageToPath,
  navItems,
  incidentPages,
  newsPages,
} from './pages/dashboard/navConfig'
import {
  sampleVehicles,
  sampleStages,
  categoryRows,
  sampleRoutes,
  subscriptionsByCategory,
} from './pages/dashboard/mockData'
import type { VehicleRecord } from './pages/dashboard/mockData'
import type { IncidentDateRangeFilter } from './pages/dashboard/pageTypes'
import { DashboardMainContent } from './pages/dashboard/DashboardMainContent'

type DashboardProps = {
  userName: string
  onLogout: () => void
}

function Dashboard({ userName, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<DashboardPage>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [incidentsExpanded, setIncidentsExpanded] = useState(false)
  const [newsExpanded, setNewsExpanded] = useState(false)
  const [vehiclePage, setVehiclePage] = useState(1)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(
    null,
  )
  const [vehicleCategoryFilter, setVehicleCategoryFilter] =
    useState<string>('all')
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [showNewVehicle, setShowNewVehicle] = useState(false)
  const [vehicleStageFilter, setVehicleStageFilter] = useState<string>('all')
  const [vehicleDivisionFilter, setVehicleDivisionFilter] =
    useState<string>('all')
  const [vehiclePaymentFilter, setVehiclePaymentFilter] =
    useState<string>('all')
  const [vehiclePermitFilter, setVehiclePermitFilter] =
    useState<string>('all')
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [incidentData, setIncidentData] = useState<IncidentRead[]>([])
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

  const loadStages = useCallback(async () => {
    try {
      const data = await stages.list()
      setStageData(data)
    } catch (e) {
      console.error(e)
      setStageData([])
    }
  }, [])

  useEffect(() => {
    if (currentPage.startsWith('incidents')) {
      void loadIncidents()
      void loadCategories()
    }
  }, [currentPage, loadIncidents, loadCategories])

  useEffect(() => {
    if (currentPage.startsWith('news')) {
      void loadNewsArticles()
      void loadNewsCategories()
    }
  }, [currentPage, loadNewsArticles, loadNewsCategories])

  useEffect(() => {
    if (currentPage === 'users') {
      void loadUsers()
      void loadRoles()
    }
  }, [currentPage, loadUsers, loadRoles])

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
    }
  }, [currentPage, loadRevenueCategories])

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
  const cityAlertRecords = incidentsInRange.filter((i) => i.iscityreport)

  const pendingIncidents = incidentRecords.filter((i) => i.status === '1')
  const liveIncidents = pendingIncidents.filter((i) => i.isemergency)
  const resolvedIncidents = incidentRecords.filter((i) => i.status === '2')

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

  const pageSize = 5

  const filteredVehicles = sampleVehicles.filter((vehicle) => {
    const matchesCategory =
      vehicleCategoryFilter === 'all' ||
      vehicle.vehicleType.toLowerCase() === vehicleCategoryFilter

    if (!matchesCategory) return false

    const matchesStage =
      vehicleStageFilter === 'all' || vehicle.stage === vehicleStageFilter
    if (!matchesStage) return false

    const matchesDivision =
      vehicleDivisionFilter === 'all' ||
      vehicle.division === vehicleDivisionFilter
    if (!matchesDivision) return false

    const matchesPayment =
      vehiclePaymentFilter === 'all' ||
      vehicle.paymentStatus.toLowerCase() === vehiclePaymentFilter
    if (!matchesPayment) return false

    const matchesPermit =
      vehiclePermitFilter === 'all' ||
      vehicle.permitStatus.toLowerCase() === vehiclePermitFilter
    if (!matchesPermit) return false

    const query = vehicleSearch.trim().toLowerCase()
    if (!query) return true

    return (
      vehicle.registration.toLowerCase().includes(query) ||
      vehicle.makeModel.toLowerCase().includes(query) ||
      vehicle.stage.toLowerCase().includes(query) ||
      vehicle.operator.toLowerCase().includes(query)
    )
  })

  const totalVehiclePages = Math.max(
    1,
    Math.ceil(filteredVehicles.length / pageSize),
  )
  const currentVehiclePage = Math.min(vehiclePage, totalVehiclePages)
  const pagedVehicles = filteredVehicles.slice(
    (currentVehiclePage - 1) * pageSize,
    currentVehiclePage * pageSize,
  )

  const goToVehiclePage = (page: number) => {
    const next = Math.min(Math.max(page, 1), totalVehiclePages)
    setVehiclePage(next)
  }

  const categoryTotal = categoryRows.reduce(
    (sum, row) => sum + row.vehiclesRegistered,
    0,
  )

  let categoryOffset = 0
  const donutSegments = categoryRows.map((row, index) => {
    const value =
      categoryTotal === 0 ? 0 : (row.vehiclesRegistered / categoryTotal) * 100
    const segment = {
      key: row.code,
      label: row.name,
      value,
      percentageLabel: Math.round(value),
      offset: categoryOffset,
      index,
    }
    categoryOffset += value
    return segment
  })

  const isIncidentsActive = incidentPages.includes(currentPage)
  const isNewsActive = newsPages.includes(currentPage)

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
              const isActiveGroup = isIncidentGroup ? isIncidentsActive : isNewsActive
              const isExpanded = isIncidentGroup ? incidentsExpanded : newsExpanded
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
                        else setNewsExpanded((e) => !e)
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
          donutSegments={donutSegments}
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
          avgResolutionHours={avgResolutionHours}
          incidentData={incidentData}
          incidentRecords={incidentRecords}
          cityAlertRecords={cityAlertRecords}
          catData={catData}
          loadIncidents={loadIncidents}
          loadCategories={loadCategories}
          newsLoadError={newsLoadError}
          newsData={newsData}
          newsCategoryData={newsCategoryData}
          loadNewsArticles={loadNewsArticles}
          loadNewsCategories={loadNewsCategories}
          showNewVehicle={showNewVehicle}
          setShowNewVehicle={setShowNewVehicle}
          vehicleCategoryFilter={vehicleCategoryFilter}
          setVehicleCategoryFilter={setVehicleCategoryFilter}
          vehicleStageFilter={vehicleStageFilter}
          setVehicleStageFilter={setVehicleStageFilter}
          vehicleDivisionFilter={vehicleDivisionFilter}
          setVehicleDivisionFilter={setVehicleDivisionFilter}
          vehiclePaymentFilter={vehiclePaymentFilter}
          setVehiclePaymentFilter={setVehiclePaymentFilter}
          vehiclePermitFilter={vehiclePermitFilter}
          setVehiclePermitFilter={setVehiclePermitFilter}
          vehicleSearch={vehicleSearch}
          setVehicleSearch={setVehicleSearch}
          pagedVehicles={pagedVehicles}
          currentVehiclePage={currentVehiclePage}
          totalVehiclePages={totalVehiclePages}
          pageSize={pageSize}
          filteredVehiclesLength={filteredVehicles.length}
          goToVehiclePage={goToVehiclePage}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          streamsLoadError={streamsLoadError}
          revenueStreams={revenueStreamData}
          vehicleStreamParentFilter={vehicleStreamParentFilter}
          setVehicleStreamParentFilter={setVehicleStreamParentFilter}
          stageData={stageData}
          onRefreshStreams={onRefreshStreams}
          sampleStages={sampleStages}
          sampleRoutes={sampleRoutes}
          subscriptionsByCategory={subscriptionsByCategory}
          revenueLoadError={revenueLoadError}
          revenueCategoryData={revenueCategoryData}
          revenueSubcategoryData={revenueSubcategoryData}
          revenueSubParentFilter={revenueSubParentFilter}
          setRevenueSubParentFilter={setRevenueSubParentFilter}
          onRefreshRevenue={onRefreshRevenue}
          usersLoadError={usersLoadError}
          userData={userData}
          roleData={roleData}
          onRefreshUsers={onRefreshUsers}
          onRefreshParentCategories={onRefreshParentCategories}
        />
      </div>
    </div>
  )
}

export default Dashboard

export type { DashboardPage } from './pages/dashboard/navConfig'

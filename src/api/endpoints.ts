import { apiRequest, clearToken, setSession, uploadFile } from './client'
import { coercePermissionStringList } from '../utils/rolePermissions'
import type {
  StageCreate,
  StageRead,
  StageUpdate,
  RouteChartCreate,
  RouteChartRead,
  RouteChartUpdate,
  UserCreate,
  UserRead,
  UserUpdate,
  RoleRead,
  RoleWithPermissionsRead,
  RoleCreateBody,
  RoleUpdateBody,
  RolePermissionsSetBody,
  UserLogin,
  LoginResponse,
  RevenueCategoryCreate,
  RevenueCategoryRead,
  RevenueCategoryUpdate,
  RevenueSubscriptionRead,
  RevenueSubscriptionCreate,
  RevenueSubscriptionUpdate,
  RevenueStreamRead,
  RevenueStreamCreate,
  RevenueStreamUpdate,
  RevenueStreamOnboardRequest,
  RevenueSubcategoryCreate,
  RevenueSubcategoryRead,
  RevenueSubcategoryUpdate,
  LocationRead,
  IncidentCategoryCreate,
  IncidentCategoryRead,
  IncidentCategoryUpdate,
  IncidentCreate,
  IncidentRead,
  IncidentDetailRead,
  IncidentUpdate,
  IncidentAttachmentRead,
  IncidentAttachmentCreate,
  UploadFileRead,
  UploadFileKind,
  NewsCategoryCreate,
  NewsCategoryRead,
  NewsCategoryUpdate,
  NewsArticleCreate,
  NewsArticleRead,
  NewsArticleUpdate,
  PaginatedResponse,
} from './types'

const base = '/api/v2'

export const uploads = {
  file(file: File, fileType?: UploadFileKind): Promise<UploadFileRead> {
    return uploadFile(file, fileType)
  },
}

export const auth = {
  async login(body: UserLogin): Promise<LoginResponse> {
    const res = await apiRequest<LoginResponse>(`${base}/users/login`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const permissionsObject: Record<string, boolean> | null = (() => {
      const source = res.permissions ?? res.role?.permissions ?? null
      if (!source) return null
      if (Array.isArray(source)) {
        return Object.fromEntries(source.map((perm) => [perm, true]))
      }
      return source
    })()
    if (res?.access_token && res?.refresh_token && res?.user) {
      setSession({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        user: res.user,
        role: res.role ?? null,
        permissions: permissionsObject,
      })
    }
    res.permissions = permissionsObject ?? null
    return res
  },

  logout(): void {
    clearToken()
  },

  forgotPassword(email: string): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>(`${base}/users/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  resetPassword(body: {
    email: string
    code: string
    new_password: string
  }): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>(`${base}/users/reset-password`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

export const stages = {
  list(): Promise<StageRead[]> {
    return apiRequest<PaginatedResponse<StageRead>>(`${base}/stages/paginated`, {
      params: { page: '1', size: '200' },
    }).then((res) => res.items)
  },

  search(q: string, limit = 20): Promise<StageRead[]> {
    if (!q?.trim()) return Promise.resolve([])
    return apiRequest<StageRead[]>(`${base}/stages/search`, {
      params: { q: q.trim(), limit: String(limit) },
    })
  },

  create(body: StageCreate): Promise<StageRead> {
    return apiRequest<StageRead>(`${base}/stages`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  get(id: string): Promise<StageRead> {
    return apiRequest<StageRead>(`${base}/stages/${id}`)
  },

  update(id: string, body: StageUpdate): Promise<StageRead> {
    return apiRequest<StageRead>(`${base}/stages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string): Promise<unknown> {
    return apiRequest(`${base}/stages/${id}`, { method: 'DELETE' })
  },
}

export const users = {
  list(): Promise<UserRead[]> {
    return apiRequest<PaginatedResponse<UserRead>>(`${base}/users/paginated`, {
      params: { page: '1', size: '200' },
    }).then((res) => res.items)
  },

  search(params: {
    id_no?: string | null
    id_type?: string | null
    limit?: number
  } = {}): Promise<UserRead[]> {
    const query: Record<string, string> = {}
    if (params.id_no != null && params.id_no !== '')
      query.id_no = params.id_no
    if (params.id_type != null && params.id_type !== '')
      query.id_type = params.id_type
    if (params.limit != null) query.limit = String(params.limit)
    return apiRequest<UserRead[]>(`${base}/users/search`, { params: query })
  },

  register(body: UserCreate): Promise<UserRead> {
    return apiRequest<UserRead>(`${base}/users/register`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  get(id: string): Promise<UserRead> {
    return apiRequest<UserRead>(`${base}/users/${id}`)
  },

  update(id: string, body: UserUpdate): Promise<UserRead> {
    return apiRequest<UserRead>(`${base}/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string): Promise<unknown> {
    return apiRequest(`${base}/users/${id}`, { method: 'DELETE' })
  },
}

export const roles = {
  list(): Promise<RoleRead[]> {
    return apiRequest<RoleRead[]>(`${base}/roles`)
  },

  listWithPermissions(): Promise<RoleWithPermissionsRead[]> {
    return apiRequest<RoleWithPermissionsRead[]>(
      `${base}/roles/with-permissions`,
    )
  },

  listAllPermissions(): Promise<string[]> {
    return apiRequest<unknown>(`${base}/roles/permissions`).then(
      coercePermissionStringList,
    )
  },

  get(id: string): Promise<RoleWithPermissionsRead> {
    return apiRequest<RoleWithPermissionsRead>(`${base}/roles/${id}`).then(
      (raw) => ({
        id: raw.id,
        name: raw.name,
        description: raw.description ?? null,
        is_system: Boolean(raw.is_system),
        permissions: coercePermissionStringList(
          (raw as { permissions?: unknown }).permissions,
        ),
      }),
    )
  },

  create(body: RoleCreateBody): Promise<RoleWithPermissionsRead> {
    return apiRequest<RoleWithPermissionsRead>(`${base}/roles`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: RoleUpdateBody): Promise<RoleWithPermissionsRead> {
    return apiRequest<RoleWithPermissionsRead>(`${base}/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  setPermissions(
    id: string,
    body: RolePermissionsSetBody,
  ): Promise<RoleWithPermissionsRead> {
    return apiRequest<RoleWithPermissionsRead>(
      `${base}/roles/${id}/permissions`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
    )
  },

  delete(
    id: string,
    opts?: { hard?: boolean; force_system?: boolean },
  ): Promise<unknown> {
    const params = new URLSearchParams()
    if (opts?.hard) params.set('hard', 'true')
    if (opts?.force_system) params.set('force_system', 'true')
    const qs = params.toString()
    return apiRequest(`${base}/roles/${id}${qs ? `?${qs}` : ''}`, {
      method: 'DELETE',
    })
  },
}

export const revenueCategories = {
  list(): Promise<RevenueCategoryRead[]> {
    return apiRequest<PaginatedResponse<RevenueCategoryRead>>(
      `${base}/revenue/categories/paginated`,
      {
        params: { page: '1', size: '200' },
      },
    ).then((res) => res.items)
  },

  get(id: string): Promise<RevenueCategoryRead> {
    return apiRequest<RevenueCategoryRead>(`${base}/revenue/categories/${id}`)
  },

  create(body: RevenueCategoryCreate): Promise<RevenueCategoryRead> {
    return apiRequest<RevenueCategoryRead>(`${base}/revenue/categories`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: RevenueCategoryUpdate): Promise<RevenueCategoryRead> {
    return apiRequest<RevenueCategoryRead>(`${base}/revenue/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string, hard = false): Promise<unknown> {
    return apiRequest(`${base}/revenue/categories/${id}`, {
      method: 'DELETE',
      params: hard ? { hard: 'true' } : undefined,
    })
  },
}

export const revenueSubcategories = {
  list(categoryId?: string | null): Promise<RevenueSubcategoryRead[]> {
    const params: Record<string, string> = {}
    if (categoryId) params.category_id = categoryId
    return apiRequest<PaginatedResponse<RevenueSubcategoryRead>>(
      `${base}/revenue/subcategories/paginated`,
      {
        params: {
          page: '1',
          size: '200',
          ...params,
        },
      },
    ).then((res) => res.items)
  },

  get(id: string): Promise<RevenueSubcategoryRead> {
    return apiRequest<RevenueSubcategoryRead>(`${base}/revenue/subcategories/${id}`)
  },

  create(body: RevenueSubcategoryCreate): Promise<RevenueSubcategoryRead> {
    return apiRequest<RevenueSubcategoryRead>(`${base}/revenue/subcategories`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(
    id: string,
    body: RevenueSubcategoryUpdate,
  ): Promise<RevenueSubcategoryRead> {
    return apiRequest<RevenueSubcategoryRead>(
      `${base}/revenue/subcategories/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    )
  },

  delete(id: string, hard = false): Promise<unknown> {
    return apiRequest(`${base}/revenue/subcategories/${id}`, {
      method: 'DELETE',
      params: hard ? { hard: 'true' } : undefined,
    })
  },
}

export const revenueSubscriptions = {
  list(): Promise<RevenueSubscriptionRead[]> {
    return apiRequest<RevenueSubscriptionRead[]>(
      `${base}/revenue/subscriptions`,
    )
  },

  create(body: RevenueSubscriptionCreate): Promise<RevenueSubscriptionRead> {
    return apiRequest<RevenueSubscriptionRead>(`${base}/revenue/subscriptions`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  get(id: string): Promise<RevenueSubscriptionRead> {
    return apiRequest<RevenueSubscriptionRead>(`${base}/revenue/subscriptions/${id}`)
  },

  update(
    id: string,
    body: RevenueSubscriptionUpdate,
  ): Promise<RevenueSubscriptionRead> {
    return apiRequest<RevenueSubscriptionRead>(`${base}/revenue/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string, hard = false): Promise<void> {
    return apiRequest<void>(`${base}/revenue/subscriptions/${id}`, {
      method: 'DELETE',
      params: hard ? { hard: 'true' } : undefined,
    })
  },
}

export const revenueStreams = {
  list(): Promise<RevenueStreamRead[]> {
    return apiRequest<PaginatedResponse<RevenueStreamRead>>(
      `${base}/revenue/streams/paginated`,
      {
        params: { page: '1', size: '200' },
      },
    ).then((res) => res.items)
  },

  get(id: string): Promise<RevenueStreamRead> {
    return apiRequest<RevenueStreamRead>(`${base}/revenue/streams/${id}`)
  },

  create(body: RevenueStreamCreate): Promise<RevenueStreamRead> {
    return apiRequest<RevenueStreamRead>(`${base}/revenue/streams`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: RevenueStreamUpdate): Promise<RevenueStreamRead> {
    return apiRequest<RevenueStreamRead>(`${base}/revenue/streams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string, hard = false): Promise<unknown> {
    return apiRequest(`${base}/revenue/streams/${id}`, {
      method: 'DELETE',
      params: hard ? { hard: 'true' } : undefined,
    })
  },

  onboard(body: RevenueStreamOnboardRequest): Promise<RevenueStreamRead> {
    return apiRequest<RevenueStreamRead>(`${base}/revenue/streams/onboard`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

/** Location hierarchy: 1) districts 2) counties 3) subcounties 4) parishes 5) villages */
export const locations = {
  async all(): Promise<LocationRead[]> {
    const pageSize = 100
    let page = 1
    let pages = 1
    const items: LocationRead[] = []
    while (page <= pages) {
      const res = await apiRequest<PaginatedResponse<LocationRead>>(
        `${base}/locations/default`,
        { params: { page: String(page), size: String(pageSize) } },
      )
      items.push(...res.items)
      pages = res.pages || 0
      page += 1
    }
    return items
  },

  districts(): Promise<string[]> {
    return apiRequest<string[]>(`${base}/locations/districts`)
  },

  counties(district: string): Promise<string[]> {
    return apiRequest<string[]>(`${base}/locations/counties/${encodeURIComponent(district)}`)
  },

  subcounties(county: string): Promise<string[]> {
    return apiRequest<string[]>(`${base}/locations/subcounties/${encodeURIComponent(county)}`)
  },

  parishes(subcounty: string): Promise<string[]> {
    return apiRequest<string[]>(`${base}/locations/parishes/${encodeURIComponent(subcounty)}`)
  },

  villages(parish: string): Promise<string[]> {
    return apiRequest<string[]>(`${base}/locations/villages/${encodeURIComponent(parish)}`)
  },

  searchVillages(q: string, limit = 20): Promise<LocationRead[]> {
    if (!q || !q.trim()) return Promise.resolve([])
    return apiRequest<LocationRead[]>(`${base}/locations/search/villages`, {
      params: { q: q.trim(), limit: String(limit) },
    })
  },
}

export const routeCharts = {
  list(revenueSubcategoryId?: string | null): Promise<RouteChartRead[]> {
    const params: Record<string, string> = { page: '1', size: '200' }
    if (revenueSubcategoryId) params.revenue_subcategory_id = revenueSubcategoryId
    return apiRequest<PaginatedResponse<RouteChartRead>>(
      `${base}/route-charts/paginated`,
      { params },
    ).then((res) => res.items)
  },

  get(id: string): Promise<RouteChartRead> {
    return apiRequest<RouteChartRead>(`${base}/route-charts/${id}`)
  },

  create(body: RouteChartCreate): Promise<RouteChartRead> {
    return apiRequest<RouteChartRead>(`${base}/route-charts`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: RouteChartUpdate): Promise<RouteChartRead> {
    return apiRequest<RouteChartRead>(`${base}/route-charts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string, hard = false): Promise<void> {
    return apiRequest<void>(`${base}/route-charts/${id}`, {
      method: 'DELETE',
      params: hard ? { hard: 'true' } : undefined,
    })
  },
}

export const analytics = {
  dashboardSummaryStats(params?: {
    from_date?: string | null
    to_date?: string | null
    as_of?: string | null
  }): Promise<Record<string, unknown>> {
    const query: Record<string, string> = {}
    if (params?.from_date) query.from_date = params.from_date
    if (params?.to_date) query.to_date = params.to_date
    if (params?.as_of) query.as_of = params.as_of
    return apiRequest<Record<string, unknown>>(
      `${base}/analytics/dashboard-summary-stats`,
      { params: query },
    )
  },

  incidentsVsTime(params?: {
    from_date?: string | null
    to_date?: string | null
    as_of?: string | null
  }): Promise<Record<string, unknown>> {
    const query: Record<string, string> = {}
    if (params?.from_date) query.from_date = params.from_date
    if (params?.to_date) query.to_date = params.to_date
    if (params?.as_of) query.as_of = params.as_of
    return apiRequest<Record<string, unknown>>(`${base}/analytics/incidents-vs-time`, {
      params: query,
    })
  },

  incidentsByCategory(params?: {
    from_date?: string | null
    to_date?: string | null
  }): Promise<Record<string, unknown>> {
    const query: Record<string, string> = {}
    if (params?.from_date) query.from_date = params.from_date
    if (params?.to_date) query.to_date = params.to_date
    return apiRequest<Record<string, unknown>>(
      `${base}/analytics/incidents-by-category`,
      { params: query },
    )
  },

  /** KCCA-style reports: `start_date` / `end_date` as `YYYY-MM-DD`. */
  incidentsOverview(params: {
    start_date: string
    end_date: string
  }): Promise<unknown> {
    return apiRequest<unknown>(`${base}/analytics/incidents/overview`, {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
      },
    })
  },

  incidentsByCategoryReport(params: {
    start_date: string
    end_date: string
    include_city_reports?: boolean
    top_n?: number
  }): Promise<unknown> {
    return apiRequest<unknown>(`${base}/analytics/incidents/by-category`, {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        include_city_reports: String(params.include_city_reports ?? false),
        top_n: String(params.top_n ?? 10),
      },
    })
  },

  incidentsHotspots(params: {
    start_date: string
    end_date: string
    include_city_reports?: boolean
    top_n?: number
  }): Promise<unknown> {
    return apiRequest<unknown>(`${base}/analytics/incidents/hotspots`, {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        include_city_reports: String(params.include_city_reports ?? false),
        top_n: String(params.top_n ?? 10),
      },
    })
  },

  incidentsTimeSeries(params: {
    start_date: string
    end_date: string
    granularity: string
    include_city_reports?: boolean
  }): Promise<unknown> {
    return apiRequest<unknown>(`${base}/analytics/incidents/time-series`, {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        granularity: params.granularity,
        include_city_reports: String(params.include_city_reports ?? false),
      },
    })
  },

  incidentsResolutionTime(params: {
    start_date: string
    end_date: string
  }): Promise<unknown> {
    return apiRequest<unknown>(`${base}/analytics/incidents/resolution-time`, {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
      },
    })
  },

  categoriesPerformance(params: {
    start_date: string
    end_date: string
  }): Promise<unknown> {
    return apiRequest<unknown>(`${base}/analytics/categories/performance`, {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
      },
    })
  },

  usersActivity(params: {
    start_date: string
    end_date: string
    user_type: string
  }): Promise<unknown> {
    return apiRequest<unknown>(`${base}/analytics/users/activity`, {
      params: {
        start_date: params.start_date,
        end_date: params.end_date,
        user_type: params.user_type,
      },
    })
  },
}

export const incidentCategories = {
  list(): Promise<IncidentCategoryRead[]> {
    return apiRequest<PaginatedResponse<IncidentCategoryRead>>(
      `${base}/incidents/categories/paginated`,
      {
        params: { page: '1', size: '200' },
      },
    ).then((res) => res.items)
  },

  tree(): Promise<any[]> {
    return apiRequest<any[]>(`${base}/incidents/categories/tree`)
  },

  get(id: string): Promise<IncidentCategoryRead> {
    return apiRequest<IncidentCategoryRead>(`${base}/incidents/categories/${id}`)
  },

  create(body: IncidentCategoryCreate): Promise<IncidentCategoryRead> {
    return apiRequest<IncidentCategoryRead>(`${base}/incidents/categories`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: IncidentCategoryUpdate): Promise<IncidentCategoryRead> {
    return apiRequest<IncidentCategoryRead>(`${base}/incidents/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string): Promise<void> {
    return apiRequest<void>(`${base}/incidents/categories/${id}`, {
      method: 'DELETE',
    })
  },
}

export const incidents = {
  list(status?: string): Promise<IncidentRead[]> {
    const params: Record<string, string> = { page: '1', size: '200' }
    if (status) params.status = status
    return apiRequest<PaginatedResponse<IncidentRead>>(
      `${base}/incidents/paginated`,
      { params },
    ).then((res) => res.items)
  },

  listCityAlerts(status?: string): Promise<IncidentRead[]> {
    const params: Record<string, string> = { page: '1', size: '200' }
    if (status) params.status = status
    return apiRequest<PaginatedResponse<IncidentRead>>(
      `${base}/incidents/city-alerts/paginated`,
      { params },
    ).then((res) => res.items)
  },

  get(id: string): Promise<IncidentDetailRead> {
    return apiRequest<IncidentDetailRead>(`${base}/incidents/${id}`)
  },

  register(body: IncidentCreate): Promise<IncidentRead> {
    return apiRequest<IncidentRead>(`${base}/incidents/register`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  // State changes (Resolve, Reject, Archive)
  resolve(id: string): Promise<IncidentRead> {
    return apiRequest<IncidentRead>(`${base}/incidents/resolve`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
  },

  reject(id: string): Promise<IncidentRead> {
    return apiRequest<IncidentRead>(`${base}/incidents/reject`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    })
  },

  update(id: string, body: IncidentUpdate): Promise<IncidentRead> {
    return apiRequest<IncidentRead>(`${base}/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  addAttachment(
    incidentId: string,
    body: IncidentAttachmentCreate,
  ): Promise<IncidentAttachmentRead> {
    return apiRequest<IncidentAttachmentRead>(
      `${base}/incidents/${incidentId}/attachments`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    )
  },

  listAttachments(incidentId: string): Promise<IncidentAttachmentRead[]> {
    return apiRequest<IncidentAttachmentRead[]>(`${base}/incidents/${incidentId}/attachments`)
  },

  deleteAttachment(incidentId: string, attachmentId: string): Promise<void> {
    return apiRequest<void>(`${base}/incidents/${incidentId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    })
  },

  setState(id: string, status: string): Promise<IncidentRead> {
    return apiRequest<IncidentRead>(`${base}/incidents/state`, {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    })
  },

  assignToRole(incidentId: string, role_id: string): Promise<any> {
    return apiRequest<any>(`${base}/incidents/${incidentId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ role_id }),
    })
  },

  delete(id: string, hard = false): Promise<void> {
    return apiRequest<void>(`${base}/incidents/${id}`, {
      method: 'DELETE',
      params: hard ? { hard: 'true' } : undefined,
    })
  },
}

export const newsCategories = {
  list(): Promise<NewsCategoryRead[]> {
    return apiRequest<PaginatedResponse<NewsCategoryRead>>(
      `${base}/news/categories/paginated`,
      {
        params: { page: '1', size: '200' },
      },
    ).then((res) => res.items)
  },

  get(id: string): Promise<NewsCategoryRead> {
    return apiRequest<NewsCategoryRead>(`${base}/news/categories/${id}`)
  },

  create(body: NewsCategoryCreate): Promise<NewsCategoryRead> {
    return apiRequest<NewsCategoryRead>(`${base}/news/categories`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: NewsCategoryUpdate): Promise<NewsCategoryRead> {
    return apiRequest<NewsCategoryRead>(`${base}/news/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string): Promise<void> {
    return apiRequest<void>(`${base}/news/categories/${id}`, {
      method: 'DELETE',
    })
  },
}

export const newsArticles = {
  list(params?: {
    category_id?: string | null
    status?: number | null
  }): Promise<NewsArticleRead[]> {
    const query: Record<string, string> = { page: '1', size: '200' }
    if (params?.category_id) query.category_id = params.category_id
    if (params?.status != null) query.status = String(params.status)
    return apiRequest<PaginatedResponse<NewsArticleRead>>(
      `${base}/news/articles/paginated`,
      {
        params: query,
      },
    ).then((res) => res.items)
  },

  get(id: string): Promise<NewsArticleRead> {
    return apiRequest<NewsArticleRead>(`${base}/news/articles/${id}`)
  },

  create(body: NewsArticleCreate): Promise<NewsArticleRead> {
    return apiRequest<NewsArticleRead>(`${base}/news/articles`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string, body: NewsArticleUpdate): Promise<NewsArticleRead> {
    return apiRequest<NewsArticleRead>(`${base}/news/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete(id: string, hard = false): Promise<void> {
    return apiRequest<void>(`${base}/news/articles/${id}`, {
      method: 'DELETE',
      params: hard ? { hard: 'true' } : undefined,
    })
  },
}
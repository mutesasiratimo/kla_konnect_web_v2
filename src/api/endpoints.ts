import { apiRequest, clearToken, setSession, uploadFile } from './client'
import type {
  StageCreate,
  StageRead,
  StageUpdate,
  UserCreate,
  UserRead,
  UserUpdate,
  RoleRead,
  UserLogin,
  LoginResponse,
  RevenueCategoryCreate,
  RevenueCategoryRead,
  RevenueCategoryUpdate,
  RevenueSubscriptionRead,
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
    if (res?.access_token && res?.refresh_token && res?.user) {
      setSession({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        user: res.user,
        role: res.role ?? null,
        permissions: res.permissions ?? null,
      })
    }
    return res
  },

  logout(): void {
    clearToken()
  },
}

export const stages = {
  list(): Promise<StageRead[]> {
    return apiRequest<StageRead[]>(`${base}/stages`)
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
    return apiRequest<UserRead[]>(`${base}/users`)
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
}

export const revenueCategories = {
  list(): Promise<RevenueCategoryRead[]> {
    return apiRequest<RevenueCategoryRead[]>(`${base}/revenue/categories`)
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
    return apiRequest<RevenueSubcategoryRead[]>(`${base}/revenue/subcategories`, {
      params: Object.keys(params).length ? params : undefined,
    })
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
}

export const revenueStreams = {
  list(): Promise<RevenueStreamRead[]> {
    return apiRequest<RevenueStreamRead[]>(`${base}/revenue/streams`)
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

export const incidentCategories = {
  list(): Promise<IncidentCategoryRead[]> {
    return apiRequest<IncidentCategoryRead[]>(`${base}/incidents/categories`)
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
    const params: Record<string, string> = {}
    if (status) params.status = status
    return apiRequest<IncidentRead[]>(`${base}/incidents`, { params })
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

  delete(id: string, hard = false): Promise<void> {
    return apiRequest<void>(`${base}/incidents/${id}`, {
      method: 'DELETE',
      params: hard ? { hard: 'true' } : undefined,
    })
  },
}

export const newsCategories = {
  list(): Promise<NewsCategoryRead[]> {
    return apiRequest<NewsCategoryRead[]>(`${base}/news/categories`)
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
    const query: Record<string, string> = {}
    if (params?.category_id) query.category_id = params.category_id
    if (params?.status != null) query.status = String(params.status)
    return apiRequest<NewsArticleRead[]>(`${base}/news/articles`, {
      params: Object.keys(query).length ? query : undefined,
    })
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
/* DMMP API v2 types (from OpenAPI) */

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export type StageRead = {
  display_name: string
  registered_name?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  district?: string | null
  county?: string | null
  subcounty?: string | null
  parish?: string | null
  village?: string | null
  leadership_id?: string | null
  id: string
}

export type StageCreate = {
  display_name: string
  registered_name?: string | null
  address?: string | null
  lat?: number | null
  lng?: number | null
  district?: string | null
  county?: string | null
  subcounty?: string | null
  parish?: string | null
  village?: string | null
  leadership_id?: string | null
}

export type StageUpdate = Partial<StageCreate>

export type RouteChartRead = {
  id: string
  name: string
  start_address: string
  start_lat: number
  start_long: number
  end_address: string
  end_lat: number
  end_long: number
  length: number
  revenue_subcategory_id: string
  datecreated: string
  createdby?: string | null
  dateupdated?: string | null
  updatedby?: string | null
}

export type RouteChartCreate = {
  name: string
  start_address: string
  start_lat: number
  start_long: number
  end_address: string
  end_lat: number
  end_long: number
  length: number
  revenue_subcategory_id: string
}

export type RouteChartUpdate = Partial<RouteChartCreate>

export type LocationRead = {
  district: string
  county: string
  subcounty: string
  parish: string
  village: string
  id: string
}

export type UserRead = {
  email: string
  phone?: string | null
  full_name?: string | null
  firstname?: string | null
  lastothernames?: string | null
  id_type?: string | null
  id_number?: string | null
  role_id?: string | null
  photo?: string | null
  id_attachment?: string | null
  permit_attachment?: string | null
  has_permit?: 'Yes' | 'No' | 'Expired' | 'Lapsed' | null
  permit_expiry_date?: string | null
  permit_no?: string | null
  fcm_token?: string | null
  id: string
  is_active: boolean
  is_verified: boolean
}

export type UserCreate = {
  email: string
  password: string
  phone?: string | null
  full_name?: string | null
  firstname?: string | null
  lastothernames?: string | null
  id_type?: string | null
  id_number?: string | null
  role_id?: string | null
}

export type UserUpdate = {
  full_name?: string | null
  firstname?: string | null
  lastothernames?: string | null
  id_type?: string | null
  id_number?: string | null
  phone?: string | null
  photo?: string | null
  id_attachment?: string | null
  permit_attachment?: string | null
  has_permit?: 'Yes' | 'No' | 'Expired' | 'Lapsed' | null
  permit_expiry_date?: string | null
  permit_no?: string | null
  fcm_token?: string | null
  role_id?: string | null
  district?: string | null
  county?: string | null
  subcounty?: string | null
  parish?: string | null
  village?: string | null
  is_active?: boolean
  is_verified?: boolean
}

export type RoleRead = {
  id: string
  name: string
  description?: string | null
  is_system: boolean
  permissions?: string[] | null
}

/** Response from GET /roles/with-permissions and detailed role endpoints. */
export type RoleWithPermissionsRead = {
  id: string
  name: string
  description?: string | null
  is_system: boolean
  permissions: string[]
}

export type RoleCreateBody = {
  id?: string | null
  name: string
  description?: string | null
  permissions?: string[]
  is_system?: boolean
  createdby?: string | null
}

export type RoleUpdateBody = {
  name?: string | null
  description?: string | null
  permissions?: string[] | null
  updatedby?: string | null
}

export type RolePermissionsSetBody = {
  permissions: string[]
  updatedby?: string | null
}

export type RevenueCategoryRead = {
  code: string
  name: string
  description?: string | null
  id: string
}

export type RevenueCategoryCreate = {
  code: string
  name: string
  description?: string | null
}

export type RevenueCategoryUpdate = {
  code?: string | null
  name?: string | null
  description?: string | null
}

export type RevenueSubcategoryRead = {
  category_id: string
  code: string
  name: string
  description?: string | null
  photo_url?: string | null
  can_hail?: boolean
  id: string
}

export type RevenueSubcategoryCreate = {
  category_id: string
  code: string
  name: string
  description?: string | null
  photo_url?: string | null
  can_hail?: boolean
}

export type RevenueSubcategoryUpdate = {
  code?: string | null
  name?: string | null
  description?: string | null
  photo_url?: string | null
  can_hail?: boolean | null
}

export type RevenueSubscriptionRead = {
  category_id: string
  revenue_stream_id?: string | null
  amount: number
  currency?: string | null
  frequency: string
  frequency_days?: number | null
  start_date?: string | null
  end_date?: string | null
  id: string
  is_active: boolean
}

export type RevenueSubscriptionCreate = {
  category_id: string
  revenue_stream_id?: string | null
  amount: number
  currency?: string | null
  frequency: string
  frequency_days?: number | null
  start_date?: string | null
  end_date?: string | null
}

export type RevenueSubscriptionUpdate = Partial<RevenueSubscriptionCreate>

/** Response from GET /revenue/streams (aligned with OpenAPI RevenueStreamRead). */
export type RevenueStreamRead = {
  name: string
  description?: string | null
  category_id: string
  subcategory_id?: string | null
  category_subtype_id?: string | null
  reg_reference_no?: string | null
  tariff_frequency?: string | null
  tariff_amount?: number | null
  last_payment_date?: string | null
  last_renewal_date?: string | null
  next_renewal_date?: string | null
  revenue_activity?: string | null
  vessel_type?: string | null
  vessel_storage?: string | null
  vessel_material?: string | null
  vessel_safety_equip?: string | null
  vessel_length?: number | null
  vessel_propulsion?: string | null
  daily_active_hours?: number | null
  company_type?: string | null
  business_type?: string | null
  reg_no?: string | null
  vin?: string | null
  tin?: string | null
  brn?: string | null
  business_name?: string | null
  trading_name?: string | null
  establishment_type?: string | null
  staff_count_male?: number | null
  staff_count_female?: number | null
  bed_count?: number | null
  room_count?: number | null
  has_restaurant?: boolean | null
  has_bar?: boolean | null
  has_gym?: boolean | null
  has_health_club?: boolean | null
  has_conference?: boolean | null
  has_pool?: boolean | null
  permit_no?: string | null
  color?: string | null
  logbook_no?: string | null
  engine_hp?: number | null
  engine_no?: string | null
  model?: string | null
  capacity?: number | null
  reserved_buffer?: number | null
  owner_id?: string | null
  primary_operator_id?: string | null
  address?: string | null
  address_lat?: number | null
  address_long?: number | null
  district?: string | null
  county?: string | null
  subcounty?: string | null
  parish?: string | null
  village?: string | null
  division_id?: string | null
  stage_id?: string | null
  purpose?: string | null
  type?: string | null
  id: string
}

/** Body for POST /revenue/streams (OpenAPI RevenueStreamCreate). */
export type RevenueStreamCreate = {
  name: string
  category_id: string
  description?: string | null
  subcategory_id?: string | null
  category_subtype_id?: string | null
  reg_reference_no?: string | null
  tariff_frequency?: string | null
  tariff_amount?: number | null
  last_payment_date?: string | null
  last_renewal_date?: string | null
  next_renewal_date?: string | null
  revenue_activity?: string | null
  vessel_type?: string | null
  vessel_storage?: string | null
  vessel_material?: string | null
  vessel_safety_equip?: string | null
  vessel_length?: number | null
  vessel_propulsion?: string | null
  daily_active_hours?: number | null
  company_type?: string | null
  business_type?: string | null
  reg_no?: string | null
  vin?: string | null
  tin?: string | null
  brn?: string | null
  business_name?: string | null
  trading_name?: string | null
  establishment_type?: string | null
  staff_count_male?: number | null
  staff_count_female?: number | null
  bed_count?: number | null
  room_count?: number | null
  has_restaurant?: boolean | null
  has_bar?: boolean | null
  has_gym?: boolean | null
  has_health_club?: boolean | null
  has_conference?: boolean | null
  has_pool?: boolean | null
  permit_no?: string | null
  color?: string | null
  logbook_no?: string | null
  engine_hp?: number | null
  engine_no?: string | null
  model?: string | null
  capacity?: number | null
  reserved_buffer?: number | null
  owner_id?: string | null
  primary_operator_id?: string | null
  address?: string | null
  address_lat?: number | null
  address_long?: number | null
  district?: string | null
  county?: string | null
  subcounty?: string | null
  parish?: string | null
  village?: string | null
  division_id?: string | null
  stage_id?: string | null
  purpose?: string | null
  type?: string | null
}

export type RevenueStreamUpdate = Partial<RevenueStreamCreate>

export type Token = {
  access_token: string
  refresh_token: string
  token_type: string
}

/** User object returned in login response */
export type LoginUser = {
  email: string
  phone?: string | null
  full_name?: string | null
  firstname?: string | null
  lastothernames?: string | null
  id_type?: string | null
  id_number?: string | null
  role_id?: string | null
  photo?: string | null
  id_attachment?: string | null
  permit_attachment?: string | null
  has_permit?: string | null
  permit_expiry_date?: string | null
  permit_no?: string | null
  fcm_token?: string | null
  district?: string | null
  county?: string | null
  subcounty?: string | null
  parish?: string | null
  village?: string | null
  id: string
  is_active?: boolean
  is_verified?: boolean
  [key: string]: unknown
}

export type LoginRole = {
  id: string
  name: string
  description?: string | null
  permissions?: string[] | null
}

export type PermissionMap = Record<string, boolean>

export type LoginResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  user: LoginUser
  role?: LoginRole | null
  permissions?: string[] | PermissionMap | null
}

export type UserLogin = {
  username: string
  password: string
}

export type ForgotPasswordRequest = {
  email: string
}

export type ResetPasswordRequest = {
  email: string
  code: string
  new_password: string
}

export type UserOnboardingInput = {
  id?: string | null
  email: string
  phone?: string | null
  full_name?: string | null
  firstname?: string | null
  lastothernames?: string | null
  id_type?: string | null
  id_number?: string | null
  password?: string | null
  district?: string | null
  county?: string | null
  subcounty?: string | null
  parish?: string | null
  village?: string | null
}

export type RevenueStreamOnboardRequest = {
  name: string
  description?: string | null
  category_id: string
  subcategory_id?: string | null
  reg_no?: string | null
  vin?: string | null
  color?: string | null
  model?: string | null
  stage_id?: string | null
  division_id?: string | null
  owner?: UserOnboardingInput | null
  primary_operator?: UserOnboardingInput | null
  [key: string]: unknown
}

// --- Incident Categories ---
export type IncidentCategoryCreate = {
  name: string
  image?: string | null
  description?: string | null
  autoapprove?: boolean
  doesexpire?: boolean
  hourstoexpire?: number | null
  parent_category_id?: string | null
  status?: string | null
  createdby?: string | null
}

export type IncidentCategoryRead = {
  name: string
  image?: string | null
  description?: string | null
  autoapprove?: boolean
  doesexpire?: boolean
  hourstoexpire?: number | null
  parent_category_id?: string | null
  status?: string | null
  id: string
  datecreated: string
  createdby?: string | null
  dateupdated?: string | null
  updatedby?: string | null
}

export type IncidentCategoryUpdate = {
  name?: string | null
  image?: string | null
  description?: string | null
  autoapprove?: boolean | null
  doesexpire?: boolean | null
  hourstoexpire?: number | null
  parent_category_id?: string | null
  status?: string | null
  updatedby?: string | null
}

export type IncidentCategoryTreeNode = IncidentCategoryRead & {
  children: IncidentCategoryTreeNode[]
}

// --- Incidents ---
export type IncidentWorkflowStatus = '0' | '1' | '2' | '3'

export type IncidentRecurrenceCreate = {
  frequency?: 'daily' | 'weekly'
  interval?: number
  days_of_week?: number[] | null
  timezone?: string
  start_date: string
  end_date: string
  window_start: string
  window_end: string
}

export type IncidentCreate = {
  name: string
  description?: string | null
  isemergency?: boolean
  iscityreport?: boolean
  incident_category_id: string
  address?: string | null
  addresslat?: number | null
  addresslong?: number | null
  cause?: string | null
  fulldisruption?: boolean | null
  decibels?: number | null
  startdate?: string | null
  enddate?: string | null
  status?: IncidentWorkflowStatus
  createdby?: string | null
  recurrence?: IncidentRecurrenceCreate | null
}

export type IncidentRead = {
  name: string
  description?: string | null
  isemergency?: boolean
  iscityreport?: boolean
  incident_category_id: string
  address?: string | null
  addresslat?: number | null
  addresslong?: number | null
  cause?: string | null
  fulldisruption?: boolean | null
  decibels?: number | null
  startdate?: string | null
  enddate?: string | null
  status: IncidentWorkflowStatus
  id: string
  upvotes: number
  assigned_role_id?: string | null
  likes_count?: number
  dislikes_count?: number
  views_count?: number
  datecreated: string
  createdby?: string | null
  reported_by?: UserRead | null
  dateupdated?: string | null
  updatedby?: string | null
}

export type IncidentAttachmentKind = 'image' | 'video' | 'audio'

export type IncidentAttachmentCreate = {
  url: string
  attachment_type?: IncidentAttachmentKind
  mime_type?: string | null
  sort_order?: number
}

export type UploadFileKind = 'image' | 'audio' | 'video'

export type UploadFileRead = {
  url: string
  file_type: UploadFileKind
  mime_type?: string | null
  filename: string
  size_bytes: number
}

export type IncidentAttachmentRead = {
  id: string
  incident_id: string
  url: string
  attachment_type: IncidentAttachmentKind
  mime_type?: string | null
  sort_order?: number
  datecreated: string
  createdby?: string | null
}

export type IncidentDetailRead = IncidentRead & {
  attachments: IncidentAttachmentRead[]
}

export type IncidentUpdate = {
  name?: string | null
  description?: string | null
  isemergency?: boolean | null
  iscityreport?: boolean | null
  incident_category_id?: string | null
  address?: string | null
  addresslat?: number | null
  addresslong?: number | null
  cause?: string | null
  fulldisruption?: boolean | null
  decibels?: number | null
  startdate?: string | null
  enddate?: string | null
  updatedby?: string | null
}

// --- News ---
export type NewsCategoryCreate = {
  name: string
  description?: string | null
}

export type NewsCategoryRead = {
  name: string
  description?: string | null
  id: string
}

export type NewsCategoryUpdate = {
  name?: string | null
  description?: string | null
}

export type NewsArticleStatus = 0 | 1 | 2

export type NewsArticleCreate = {
  category_id: string
  title: string
  image?: string | null
  body: string
  userid: string
  status?: NewsArticleStatus
  url: string
}

export type NewsArticleRead = {
  category_id: string
  title: string
  image?: string | null
  body: string
  userid: string
  status: NewsArticleStatus
  url: string
  id: string
  datecreated: string
  createdby?: string | null
  dateupdated?: string | null
  updatedby?: string | null
}

export type NewsArticleUpdate = {
  category_id?: string | null
  title?: string | null
  image?: string | null
  body?: string | null
  userid?: string | null
  status?: NewsArticleStatus | null
  url?: string | null
}
import React, { useEffect, useMemo, useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import type {
  RevenueCategoryRead,
  RevenueStreamCreate,
  RevenueStreamRead,
  RevenueSubcategoryRead,
  StageRead,
  UserRead,
} from '../../api/types'
import { revenueStreams as api, users as usersApi } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'
import { DashboardDataGrid } from '../table/DashboardDataGrid'

interface RevenueStreamsCrudListProps {
  streams: RevenueStreamRead[]
  parentCategories: RevenueCategoryRead[]
  subcategories: RevenueSubcategoryRead[]
  stages: StageRead[]
  parentCategoryIdFilter: string
  onParentCategoryIdFilterChange: (id: string) => void
  onRefresh: () => void | Promise<void>
}

type FormState = {
  name: string
  description: string
  category_id: string
  subcategory_id: string
  reg_no: string
  vin: string
  color: string
  model: string
  stage_id: string
}

const emptyForm = (defaultParent = ''): FormState => ({
  name: '',
  description: '',
  category_id: defaultParent,
  subcategory_id: '',
  reg_no: '',
  vin: '',
  color: '',
  model: '',
  stage_id: '',
})

const iconBtn: React.CSSProperties = { width: 30, height: 30, padding: 0 }

function userDisplayName(u: UserRead): string {
  const parts = [u.firstname, u.lastothernames].filter(Boolean).join(' ').trim()
  return u.full_name?.trim() || parts || u.email
}

function fmt(v: unknown): string | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  const s = String(v).trim()
  return s.length ? s : null
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function PersonSection({
  title,
  userId,
  user,
  loading,
}: {
  title: string
  userId: string | null | undefined
  user: UserRead | null
  loading: boolean
}) {
  return (
    <div className="vehicle-detail-person-block" style={{ marginTop: '1rem' }}>
      <h4
        className="dashboard-dialog-section-label"
        style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}
      >
        {title}
      </h4>
      {!userId ? (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--dashboard-muted, #64748b)',
            margin: 0,
          }}
        >
          Not linked
        </p>
      ) : loading && !user ? (
        <p style={{ fontSize: '0.875rem', margin: 0 }}>Loading profile…</p>
      ) : !user ? (
        <p style={{ fontSize: '0.875rem', color: '#b45309', margin: 0 }}>
          Could not load profile for user ID <code>{userId}</code>
        </p>
      ) : (
        <dl className="detail-list" style={{ marginTop: 0 }}>
          <DetailRow label="Name" value={userDisplayName(user)} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Phone" value={user.phone} />
          <DetailRow
            label="ID"
            value={
              [user.id_type, user.id_number].filter(Boolean).join(' ') || null
            }
          />
          <DetailRow
            label="Status"
            value={
              user.is_verified
                ? 'Verified'
                : user.is_active
                  ? 'Active (unverified)'
                  : 'Inactive'
            }
          />
        </dl>
      )}
    </div>
  )
}

function toCreateBody(form: FormState): RevenueStreamCreate {
  return {
    name: form.name.trim(),
    category_id: form.category_id,
    description: form.description.trim() || null,
    subcategory_id: form.subcategory_id.trim() || null,
    reg_no: form.reg_no.trim() || null,
    vin: form.vin.trim() || null,
    color: form.color.trim() || null,
    model: form.model.trim() || null,
    stage_id: form.stage_id.trim() || null,
  }
}

export const RevenueStreamsCrudList: React.FC<RevenueStreamsCrudListProps> = ({
  streams,
  parentCategories,
  subcategories,
  stages,
  parentCategoryIdFilter,
  onParentCategoryIdFilterChange,
  onRefresh,
}) => {
  const [editTarget, setEditTarget] = useState<RevenueStreamRead | null>(null)
  const [viewTarget, setViewTarget] = useState<RevenueStreamRead | null>(null)
  const [viewDetail, setViewDetail] = useState<RevenueStreamRead | null>(null)
  const [viewOwner, setViewOwner] = useState<UserRead | null>(null)
  const [viewOperator, setViewOperator] = useState<UserRead | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewLoadNote, setViewLoadNote] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(
    emptyForm(parentCategories[0]?.id ?? ''),
  )
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [subcategoryFilter, setSubcategoryFilter] = useState('')
  const parentNameById = useMemo(
    () => Object.fromEntries(parentCategories.map((c) => [c.id, c.name])),
    [parentCategories],
  )

  const subNameById = useMemo(
    () => Object.fromEntries(subcategories.map((s) => [s.id, s.name])),
    [subcategories],
  )

  const stageNameById = useMemo(
    () => Object.fromEntries(stages.map((s) => [s.id, s.display_name])),
    [stages],
  )

  const subsForFilter = useMemo(() => {
    if (!parentCategoryIdFilter) return subcategories
    return subcategories.filter((s) => s.category_id === parentCategoryIdFilter)
  }, [subcategories, parentCategoryIdFilter])

  const subsForForm = useMemo(() => {
    if (!form.category_id) return []
    return subcategories.filter((s) => s.category_id === form.category_id)
  }, [subcategories, form.category_id])

  const filteredStreams = useMemo(() => {
    let rows = streams
    if (parentCategoryIdFilter) {
      rows = rows.filter((r) => r.category_id === parentCategoryIdFilter)
    }
    if (subcategoryFilter) {
      rows = rows.filter((r) => r.subcategory_id === subcategoryFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((r) => {
        const blob = [
          r.name,
          r.description ?? '',
          r.reg_no ?? '',
          r.vin ?? '',
          r.model ?? '',
          r.color ?? '',
          parentNameById[r.category_id] ?? '',
          r.subcategory_id ? subNameById[r.subcategory_id] ?? '' : '',
          r.stage_id ? stageNameById[r.stage_id] ?? '' : '',
        ]
          .join(' ')
          .toLowerCase()
        return blob.includes(q)
      })
    }
    return rows
  }, [
    streams,
    parentCategoryIdFilter,
    subcategoryFilter,
    search,
    parentNameById,
    subNameById,
    stageNameById,
  ])

  useEffect(() => {
    if (!viewTarget) {
      setViewDetail(null)
      setViewOwner(null)
      setViewOperator(null)
      setViewLoadNote(null)
      setViewLoading(false)
      return
    }

    let cancelled = false
    setViewLoading(true)
    setViewLoadNote(null)
    setViewDetail(null)
    setViewOwner(null)
    setViewOperator(null)

    void (async () => {
      try {
        let detail: RevenueStreamRead = viewTarget
        try {
          detail = await api.get(viewTarget.id)
        } catch {
          if (!cancelled) {
            setViewLoadNote(
              'Showing list data; full record could not be refreshed from the API.',
            )
          }
        }
        if (cancelled) return
        setViewDetail(detail)

        let owner: UserRead | null = null
        let operator: UserRead | null = null
        if (detail.owner_id) {
          try {
            owner = await usersApi.get(detail.owner_id)
          } catch {
            owner = null
          }
        }
        if (cancelled) return
        setViewOwner(owner)

        if (detail.primary_operator_id) {
          if (detail.primary_operator_id === detail.owner_id) {
            operator = owner
          } else {
            try {
              operator = await usersApi.get(detail.primary_operator_id)
            } catch {
              operator = null
            }
          }
        }
        if (!cancelled) setViewOperator(operator)
      } finally {
        if (!cancelled) setViewLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [viewTarget])

  const closeDialogs = () => {
    setEditTarget(null)
    setViewTarget(null)
    setViewDetail(null)
    setViewOwner(null)
    setViewOperator(null)
    setViewLoadNote(null)
    setViewLoading(false)
    setForm(emptyForm(parentCategories[0]?.id ?? ''))
  }

  const closeViewOnly = () => {
    setViewTarget(null)
    setViewDetail(null)
    setViewOwner(null)
    setViewOperator(null)
    setViewLoadNote(null)
    setViewLoading(false)
  }

  const openEdit = (row: RevenueStreamRead) => {
    setViewTarget(null)
    setEditTarget(row)
    setForm({
      name: row.name,
      description: row.description ?? '',
      category_id: row.category_id,
      subcategory_id: row.subcategory_id ?? '',
      reg_no: row.reg_no ?? '',
      vin: row.vin ?? '',
      color: row.color ?? '',
      model: row.model ?? '',
      stage_id: row.stage_id ?? '',
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !form.name.trim() || !form.category_id) return
    setSaving(true)
    try {
      await api.update(editTarget.id, toCreateBody(form))
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not update revenue stream.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: RevenueStreamRead) => {
    if (
      !window.confirm(
        `Delete revenue stream "${row.name}"? This cannot be undone if hard delete is enabled on the server.`,
      )
    )
      return
    setSaving(true)
    try {
      await api.delete(row.id)
      if (viewTarget?.id === row.id) closeViewOnly()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not delete revenue stream.')
    } finally {
      setSaving(false)
    }
  }

  const columns: GridColDef<RevenueStreamRead>[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    {
      field: 'reg_no',
      headerName: 'Reg no.',
      width: 120,
      valueGetter: (_v, r) => r.reg_no ?? '—',
    },
    {
      field: 'vin',
      headerName: 'VIN',
      width: 130,
      valueGetter: (_v, r) => r.vin ?? '—',
    },
    {
      field: 'model',
      headerName: 'Model',
      width: 120,
      valueGetter: (_v, r) => r.model ?? '—',
    },
    {
      field: 'category_id',
      headerName: 'Category',
      flex: 1,
      minWidth: 120,
      valueGetter: (_v, r) => parentNameById[r.category_id] ?? r.category_id,
    },
    {
      field: 'subcategory_id',
      headerName: 'Subcategory',
      flex: 1,
      minWidth: 120,
      valueGetter: (_v, r) =>
        r.subcategory_id ? subNameById[r.subcategory_id] ?? r.subcategory_id : '—',
    },
    {
      field: 'stage_id',
      headerName: 'Stage',
      flex: 1,
      minWidth: 120,
      valueGetter: (_v, r) =>
        r.stage_id ? stageNameById[r.stage_id] ?? r.stage_id : '—',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 124,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="icon-button"
            title="View"
            style={iconBtn}
            onClick={() => {
              setEditTarget(null)
              setViewTarget(params.row)
            }}
          >
            <i className="fa fa-eye" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            title="Edit"
            style={iconBtn}
            onClick={() => openEdit(params.row)}
          >
            <i className="fa fa-pencil" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            title="Delete"
            style={iconBtn}
            onClick={() => void handleDelete(params.row)}
            disabled={saving}
          >
            <i className="fa fa-trash" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  const renderFormFields = (submitLabel: string, onSubmit: (e: React.FormEvent) => void) => (
    <form onSubmit={onSubmit}>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-name">Name</label>
        <input
          id="rs-name"
          className="dashboard-dialog-input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          autoComplete="off"
        />
      </div>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-desc">Description</label>
        <textarea
          id="rs-desc"
          className="dashboard-dialog-input"
          rows={2}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </div>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-cat">Parent category</label>
        <select
          id="rs-cat"
          className="dashboard-dialog-input"
          value={form.category_id}
          onChange={(e) => {
            const next = e.target.value
            setForm((f) => ({
              ...f,
              category_id: next,
              subcategory_id: '',
            }))
          }}
          required
        >
          <option value="">Select category</option>
          {parentCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-sub">Subcategory (optional)</label>
        <select
          id="rs-sub"
          className="dashboard-dialog-input"
          value={form.subcategory_id}
          onChange={(e) =>
            setForm((f) => ({ ...f, subcategory_id: e.target.value }))
          }
          disabled={!form.category_id}
        >
          <option value="">None</option>
          {subsForForm.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-reg">Registration no.</label>
        <input
          id="rs-reg"
          className="dashboard-dialog-input"
          value={form.reg_no}
          onChange={(e) => setForm((f) => ({ ...f, reg_no: e.target.value }))}
          autoComplete="off"
        />
      </div>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-vin">VIN</label>
        <input
          id="rs-vin"
          className="dashboard-dialog-input"
          value={form.vin}
          onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))}
          autoComplete="off"
        />
      </div>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-color">Color</label>
        <input
          id="rs-color"
          className="dashboard-dialog-input"
          value={form.color}
          onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
          autoComplete="off"
        />
      </div>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-model">Model</label>
        <input
          id="rs-model"
          className="dashboard-dialog-input"
          value={form.model}
          onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          autoComplete="off"
        />
      </div>
      <div className="dashboard-dialog-field">
        <label htmlFor="rs-stage">Stage (optional)</label>
        <select
          id="rs-stage"
          className="dashboard-dialog-input"
          value={form.stage_id}
          onChange={(e) =>
            setForm((f) => ({ ...f, stage_id: e.target.value }))
          }
        >
          <option value="">None</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
      </div>
      <div className="dashboard-dialog-actions">
        <button type="button" className="secondary-button" onClick={closeDialogs}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={saving}>
          {submitLabel}
        </button>
      </div>
    </form>
  )

  return (
    <section className="dashboard-revenue-streams" aria-label="Vehicle revenue streams">
      <div className="dashboard-table-shell">
        <div className="dashboard-filters">
          <div className="dashboard-filter">
            <label className="dashboard-filter-label">
              Parent category
              <select
                className="dashboard-filter-select"
                value={parentCategoryIdFilter}
                onChange={(e) => {
                  onParentCategoryIdFilterChange(e.target.value)
                  setSubcategoryFilter('')
                }}
              >
                <option value="">All</option>
                {parentCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="dashboard-filter">
            <label className="dashboard-filter-label">
              Subcategory
              <select
                className="dashboard-filter-select"
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
                disabled={!parentCategoryIdFilter}
              >
                <option value="">All</option>
                {subsForFilter.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="dashboard-filter dashboard-filter--search">
            <label className="dashboard-filter-label">
              Search
              <input
                type="text"
                className="dashboard-filter-input"
                placeholder="Name, reg, VIN, model…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="dashboard-table-scroll">
          <DashboardDataGrid<RevenueStreamRead>
            rows={filteredStreams}
            columns={columns}
            getRowId={(row) => row.id}
            localeText={{
              noRowsLabel: 'No revenue streams match the current filters.',
            }}
          />
        </div>
      </div>

      <DashboardDialog
        open={!!editTarget}
        title="Edit revenue stream"
        onClose={closeDialogs}
      >
        {renderFormFields('Save', handleUpdate)}
      </DashboardDialog>

      <DashboardDialog
        open={!!viewTarget}
        title={viewTarget?.name ?? 'Vehicle details'}
        onClose={closeViewOnly}
        wide
      >
        {viewTarget &&
          (() => {
            const d = viewDetail ?? viewTarget
            const tariffParts = [
              fmt(d.tariff_amount),
              fmt(d.tariff_frequency),
            ].filter(Boolean)
            const tariffLine = tariffParts.length
              ? tariffParts.join(' · ')
              : null

            return (
              <div className="dashboard-dialog-body dashboard-dialog-body--role-details">
                {viewLoadNote && (
                  <p style={{ color: '#b45309', marginTop: 0, fontSize: '0.875rem' }}>
                    {viewLoadNote}
                  </p>
                )}
                {viewLoading && !viewDetail ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--dashboard-muted, #64748b)' }}>
                    Loading vehicle details…
                  </p>
                ) : (
                  <>
                    <h4
                      className="dashboard-dialog-section-label"
                      style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}
                    >
                      Record
                    </h4>
                    <dl className="detail-list" style={{ marginTop: 0 }}>
                      <DetailRow label="ID" value={d.id} />
                      <DetailRow label="Description" value={fmt(d.description)} />
                      <DetailRow
                        label="Parent category"
                        value={
                          parentNameById[d.category_id] ?? d.category_id ?? null
                        }
                      />
                      <DetailRow
                        label="Subcategory"
                        value={
                          d.subcategory_id
                            ? subNameById[d.subcategory_id] ?? d.subcategory_id
                            : null
                        }
                      />
                      <DetailRow
                        label="Stage / park"
                        value={
                          d.stage_id
                            ? stageNameById[d.stage_id] ?? d.stage_id
                            : null
                        }
                      />
                      <DetailRow label="Purpose" value={fmt(d.purpose)} />
                      <DetailRow label="Stream type" value={fmt(d.type)} />
                    </dl>

                    <h4
                      className="dashboard-dialog-section-label"
                      style={{
                        fontSize: '0.95rem',
                        marginTop: '1.25rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Vehicle &amp; registration
                    </h4>
                    <dl className="detail-list" style={{ marginTop: 0 }}>
                      <DetailRow label="Registration no." value={fmt(d.reg_no)} />
                      <DetailRow
                        label="Reg. reference"
                        value={fmt(d.reg_reference_no)}
                      />
                      <DetailRow label="VIN" value={fmt(d.vin)} />
                      <DetailRow label="Model" value={fmt(d.model)} />
                      <DetailRow label="Color" value={fmt(d.color)} />
                      <DetailRow label="Capacity" value={fmt(d.capacity)} />
                      <DetailRow label="Logbook no." value={fmt(d.logbook_no)} />
                      <DetailRow label="Engine no." value={fmt(d.engine_no)} />
                      <DetailRow label="Engine HP" value={fmt(d.engine_hp)} />
                      <DetailRow label="Permit no." value={fmt(d.permit_no)} />
                    </dl>

                    <h4
                      className="dashboard-dialog-section-label"
                      style={{
                        fontSize: '0.95rem',
                        marginTop: '1.25rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Business / operator entity
                    </h4>
                    <dl className="detail-list" style={{ marginTop: 0 }}>
                      <DetailRow label="Business name" value={fmt(d.business_name)} />
                      <DetailRow label="Trading name" value={fmt(d.trading_name)} />
                      <DetailRow label="TIN" value={fmt(d.tin)} />
                      <DetailRow label="BRN" value={fmt(d.brn)} />
                      <DetailRow
                        label="Company type"
                        value={fmt(d.company_type)}
                      />
                      <DetailRow
                        label="Business type"
                        value={fmt(d.business_type)}
                      />
                      <DetailRow
                        label="Establishment type"
                        value={fmt(d.establishment_type)}
                      />
                    </dl>

                    <h4
                      className="dashboard-dialog-section-label"
                      style={{
                        fontSize: '0.95rem',
                        marginTop: '1.25rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Tariff &amp; activity
                    </h4>
                    <dl className="detail-list" style={{ marginTop: 0 }}>
                      <DetailRow label="Tariff" value={tariffLine} />
                      <DetailRow
                        label="Revenue activity"
                        value={fmt(d.revenue_activity)}
                      />
                      <DetailRow
                        label="Last payment"
                        value={fmt(d.last_payment_date)}
                      />
                      <DetailRow
                        label="Last renewal"
                        value={fmt(d.last_renewal_date)}
                      />
                      <DetailRow
                        label="Next renewal"
                        value={fmt(d.next_renewal_date)}
                      />
                    </dl>

                    <h4
                      className="dashboard-dialog-section-label"
                      style={{
                        fontSize: '0.95rem',
                        marginTop: '1.25rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Location
                    </h4>
                    <dl className="detail-list" style={{ marginTop: 0 }}>
                      <DetailRow label="Address" value={fmt(d.address)} />
                      {d.address_lat != null && d.address_long != null && (
                        <div className="detail-row">
                          <dt>Coordinates</dt>
                          <dd
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--dashboard-muted, #64748b)',
                            }}
                          >
                            {Number(d.address_lat).toFixed(6)},{' '}
                            {Number(d.address_long).toFixed(6)}
                          </dd>
                        </div>
                      )}
                      <DetailRow label="District" value={fmt(d.district)} />
                      <DetailRow label="County" value={fmt(d.county)} />
                      <DetailRow label="Subcounty" value={fmt(d.subcounty)} />
                      <DetailRow label="Parish" value={fmt(d.parish)} />
                      <DetailRow label="Village" value={fmt(d.village)} />
                    </dl>

                    {(fmt(d.vessel_type) ||
                      fmt(d.vessel_length) ||
                      fmt(d.vessel_propulsion)) && (
                      <>
                        <h4
                          className="dashboard-dialog-section-label"
                          style={{
                            fontSize: '0.95rem',
                            marginTop: '1.25rem',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Vessel (if applicable)
                        </h4>
                        <dl className="detail-list" style={{ marginTop: 0 }}>
                          <DetailRow label="Vessel type" value={fmt(d.vessel_type)} />
                          <DetailRow
                            label="Length"
                            value={fmt(d.vessel_length)}
                          />
                          <DetailRow
                            label="Propulsion"
                            value={fmt(d.vessel_propulsion)}
                          />
                          <DetailRow
                            label="Storage"
                            value={fmt(d.vessel_storage)}
                          />
                          <DetailRow
                            label="Material"
                            value={fmt(d.vessel_material)}
                          />
                          <DetailRow
                            label="Safety equipment"
                            value={fmt(d.vessel_safety_equip)}
                          />
                          <DetailRow
                            label="Daily active hours"
                            value={fmt(d.daily_active_hours)}
                          />
                        </dl>
                      </>
                    )}

                    <PersonSection
                      title="Owner"
                      userId={d.owner_id}
                      user={viewOwner}
                      loading={viewLoading}
                    />
                    <PersonSection
                      title="Primary operator"
                      userId={d.primary_operator_id}
                      user={viewOperator}
                      loading={viewLoading}
                    />
                  </>
                )}
              </div>
            )
          })()}
      </DashboardDialog>
    </section>
  )
}

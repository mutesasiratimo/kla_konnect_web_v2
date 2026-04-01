import React, { useMemo, useState } from 'react'
import type {
  RevenueCategoryRead,
  RevenueStreamCreate,
  RevenueStreamRead,
  RevenueSubcategoryRead,
  StageRead,
} from '../../api/types'
import { revenueStreams as api } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'
import { DataTablePagination } from '../table/DataTablePagination'

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
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RevenueStreamRead | null>(null)
  const [viewTarget, setViewTarget] = useState<RevenueStreamRead | null>(null)
  const [form, setForm] = useState<FormState>(
    emptyForm(parentCategories[0]?.id ?? ''),
  )
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [subcategoryFilter, setSubcategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
  const totalPages = Math.max(1, Math.ceil(filteredStreams.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedStreams = filteredStreams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyForm(parentCategories[0]?.id ?? ''))
  }

  const openCreate = () => {
    setEditTarget(null)
    setViewTarget(null)
    setForm(
      emptyForm(parentCategories[0]?.id ?? parentCategoryIdFilter ?? ''),
    )
    setCreateOpen(true)
  }

  const openEdit = (row: RevenueStreamRead) => {
    setCreateOpen(false)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.category_id) return
    setSaving(true)
    try {
      await api.create(toCreateBody(form))
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not create revenue stream.')
    } finally {
      setSaving(false)
    }
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
      if (viewTarget?.id === row.id) setViewTarget(null)
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not delete revenue stream.')
    } finally {
      setSaving(false)
    }
  }

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
    <section className="dashboard-revenue-streams" aria-labelledby="revenue-streams-heading">
      <div className="dashboard-page-header-row" style={{ marginTop: '2rem' }}>
        <div>
          <h2
            id="revenue-streams-heading"
            className="dashboard-page-title"
            style={{ fontSize: '1.25rem' }}
          >
            Revenue streams
          </h2>
          <p className="dashboard-page-lead" style={{ marginTop: 4 }}>
            Registered vehicles and operators linked to revenue categories (API).
          </p>
        </div>
        <button type="button" className="primary-button" onClick={openCreate}>
          + Add stream
        </button>
      </div>

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
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Reg no.</th>
                <th scope="col">VIN</th>
                <th scope="col">Model</th>
                <th scope="col">Category</th>
                <th scope="col">Subcategory</th>
                <th scope="col">Stage</th>
                <th scope="col" className="dashboard-table-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedStreams.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.reg_no ?? '—'}</td>
                  <td>{row.vin ?? '—'}</td>
                  <td>{row.model ?? '—'}</td>
                  <td>{parentNameById[row.category_id] ?? row.category_id}</td>
                  <td>
                    {row.subcategory_id
                      ? subNameById[row.subcategory_id] ?? row.subcategory_id
                      : '—'}
                  </td>
                  <td>
                    {row.stage_id
                      ? stageNameById[row.stage_id] ?? row.stage_id
                      : '—'}
                  </td>
                  <td className="dashboard-table-actions">
                    <button
                      type="button"
                      className="icon-button"
                      title="View"
                      style={iconBtn}
                      onClick={() => {
                        setCreateOpen(false)
                        setEditTarget(null)
                        setViewTarget(row)
                      }}
                    >
                      <i className="fa fa-eye" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      title="Edit"
                      style={iconBtn}
                      onClick={() => openEdit(row)}
                    >
                      <i className="fa fa-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      title="Delete"
                      style={iconBtn}
                      onClick={() => handleDelete(row)}
                      disabled={saving}
                    >
                      <i className="fa fa-trash" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStreams.length === 0 && (
                <tr>
                  <td colSpan={8} className="dashboard-table-empty">
                    No revenue streams match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={filteredStreams.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1)
            setPageSize(size)
          }}
        />
      </div>

      <DashboardDialog
        open={createOpen}
        title="Add revenue stream"
        onClose={closeDialogs}
      >
        {renderFormFields('Create', handleCreate)}
      </DashboardDialog>

      <DashboardDialog
        open={!!editTarget}
        title="Edit revenue stream"
        onClose={closeDialogs}
      >
        {renderFormFields('Save', handleUpdate)}
      </DashboardDialog>

      <DashboardDialog
        open={!!viewTarget}
        title={viewTarget?.name ?? 'Revenue stream'}
        onClose={() => setViewTarget(null)}
      >
        {viewTarget && (
          <dl className="detail-list">
            <div className="detail-row">
              <dt>ID</dt>
              <dd>{viewTarget.id}</dd>
            </div>
            <div className="detail-row">
              <dt>Description</dt>
              <dd>{viewTarget.description ?? '—'}</dd>
            </div>
            <div className="detail-row">
              <dt>Parent category</dt>
              <dd>
                {parentNameById[viewTarget.category_id] ?? viewTarget.category_id}
              </dd>
            </div>
            <div className="detail-row">
              <dt>Subcategory</dt>
              <dd>
                {viewTarget.subcategory_id
                  ? subNameById[viewTarget.subcategory_id] ??
                    viewTarget.subcategory_id
                  : '—'}
              </dd>
            </div>
            <div className="detail-row">
              <dt>Registration no.</dt>
              <dd>{viewTarget.reg_no ?? '—'}</dd>
            </div>
            <div className="detail-row">
              <dt>VIN</dt>
              <dd>{viewTarget.vin ?? '—'}</dd>
            </div>
            <div className="detail-row">
              <dt>Color</dt>
              <dd>{viewTarget.color ?? '—'}</dd>
            </div>
            <div className="detail-row">
              <dt>Model</dt>
              <dd>{viewTarget.model ?? '—'}</dd>
            </div>
            <div className="detail-row">
              <dt>Stage</dt>
              <dd>
                {viewTarget.stage_id
                  ? stageNameById[viewTarget.stage_id] ?? viewTarget.stage_id
                  : '—'}
              </dd>
            </div>
            <div className="detail-row">
              <dt>Owner ID</dt>
              <dd>{viewTarget.owner_id ?? '—'}</dd>
            </div>
            <div className="detail-row">
              <dt>Primary operator ID</dt>
              <dd>{viewTarget.primary_operator_id ?? '—'}</dd>
            </div>
          </dl>
        )}
      </DashboardDialog>
    </section>
  )
}

import React, { useMemo, useState } from 'react'
import type {
  RevenueCategoryRead,
  RevenueStreamRead,
  RevenueSubscriptionCreate,
  RevenueSubscriptionRead,
} from '../../api/types'
import { revenueSubscriptions } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'
import { DataTablePagination } from '../table/DataTablePagination'

type Props = {
  subscriptions: RevenueSubscriptionRead[]
  categories: RevenueCategoryRead[]
  streams: RevenueStreamRead[]
  onRefresh: () => void | Promise<void>
}

type FormState = {
  category_id: string
  revenue_stream_id: string
  amount: string
  currency: string
  frequency: string
  frequency_days: string
  start_date: string
  end_date: string
}

const emptyForm: FormState = {
  category_id: '',
  revenue_stream_id: '',
  amount: '',
  currency: 'UGX',
  frequency: '',
  frequency_days: '',
  start_date: '',
  end_date: '',
}

function toForm(v: RevenueSubscriptionRead): FormState {
  return {
    category_id: v.category_id,
    revenue_stream_id: v.revenue_stream_id ?? '',
    amount: String(v.amount),
    currency: v.currency ?? 'UGX',
    frequency: v.frequency,
    frequency_days: v.frequency_days != null ? String(v.frequency_days) : '',
    start_date: v.start_date ? v.start_date.slice(0, 16) : '',
    end_date: v.end_date ? v.end_date.slice(0, 16) : '',
  }
}

export const RevenueSubscriptionsCrudList: React.FC<Props> = ({
  subscriptions,
  categories,
  streams,
  onRefresh,
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RevenueSubscriptionRead | null>(null)
  const [viewTarget, setViewTarget] = useState<RevenueSubscriptionRead | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )
  const streamNameById = useMemo(
    () => Object.fromEntries(streams.map((s) => [s.id, s.name])),
    [streams],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return subscriptions
    return subscriptions.filter((s) =>
      [
        categoryNameById[s.category_id] ?? '',
        streamNameById[s.revenue_stream_id ?? ''] ?? '',
        s.frequency,
        s.currency ?? '',
        String(s.amount),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [subscriptions, search, categoryNameById, streamNameById])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyForm)
  }

  const openCreate = () => {
    setCreateOpen(true)
    setEditTarget(null)
    setViewTarget(null)
    setForm(emptyForm)
  }

  const openEdit = (target: RevenueSubscriptionRead) => {
    setCreateOpen(false)
    setViewTarget(null)
    setEditTarget(target)
    setForm(toForm(target))
  }

  const toPayload = (): RevenueSubscriptionCreate | null => {
    const amount = Number(form.amount)
    if (!form.category_id || !form.frequency.trim() || Number.isNaN(amount) || amount <= 0) {
      return null
    }
    return {
      category_id: form.category_id,
      revenue_stream_id: form.revenue_stream_id || null,
      amount,
      currency: form.currency.trim() || null,
      frequency: form.frequency.trim(),
      frequency_days: form.frequency_days ? Number(form.frequency_days) : null,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = toPayload()
    if (!payload) return
    setSaving(true)
    try {
      await revenueSubscriptions.create(payload)
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not create subscription package.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    const payload = toPayload()
    if (!payload) return
    setSaving(true)
    try {
      await revenueSubscriptions.update(editTarget.id, payload)
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not update subscription package.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this subscription package?')) return
    try {
      await revenueSubscriptions.delete(id)
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not delete subscription package.')
    }
  }

  const iconBtnStyle: React.CSSProperties = { width: 30, height: 30, padding: 0 }

  return (
    <>
      <div
        className="dashboard-page-header-row"
        style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <label className="dashboard-dialog-field" style={{ margin: 0, flex: '1 1 240px' }}>
          <span>Filter</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Category, stream, frequency..."
          />
        </label>
        <button type="button" className="primary-button" onClick={openCreate}>
          + New subscription package
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New subscription package"
        titleId="subscription-create-title"
        wide
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Category *</span>
            <select
              className="dashboard-dialog-select"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-dialog-field">
            <span>Revenue stream</span>
            <select
              className="dashboard-dialog-select"
              value={form.revenue_stream_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, revenue_stream_id: e.target.value }))
              }
            >
              <option value="">— None —</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-dialog-field">
            <span>Amount *</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Currency</span>
            <input
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Frequency *</span>
            <input
              value={form.frequency}
              onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              placeholder="DAILY / WEEKLY / MONTHLY"
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Frequency days</span>
            <input
              type="number"
              min="1"
              value={form.frequency_days}
              onChange={(e) => setForm((f) => ({ ...f, frequency_days: e.target.value }))}
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Start date</span>
            <input
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>End date</span>
            <input
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
            />
          </label>
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeDialogs}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              Create
            </button>
          </div>
        </form>
      </DashboardDialog>

      <DashboardDialog
        open={editTarget !== null}
        onClose={closeDialogs}
        title="Edit subscription package"
        titleId="subscription-edit-title"
        wide
      >
        {editTarget && (
          <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
            <label className="dashboard-dialog-field">
              <span>Category *</span>
              <select
                className="dashboard-dialog-select"
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="dashboard-dialog-field">
              <span>Revenue stream</span>
              <select
                className="dashboard-dialog-select"
                value={form.revenue_stream_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, revenue_stream_id: e.target.value }))
                }
              >
                <option value="">— None —</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="dashboard-dialog-field">
              <span>Amount *</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>Currency</span>
              <input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>Frequency *</span>
              <input
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                required
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>Frequency days</span>
              <input
                type="number"
                min="1"
                value={form.frequency_days}
                onChange={(e) => setForm((f) => ({ ...f, frequency_days: e.target.value }))}
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>Start date</span>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </label>
            <label className="dashboard-dialog-field">
              <span>End date</span>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </label>
            <div className="dashboard-dialog-actions">
              <button type="button" className="secondary-button" onClick={closeDialogs}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                Save
              </button>
            </div>
          </form>
        )}
      </DashboardDialog>

      <DashboardDialog
        open={viewTarget !== null}
        onClose={closeDialogs}
        title="Subscription package details"
        titleId="subscription-view-title"
        wide
      >
        {viewTarget && (
          <div className="dashboard-dialog-body" style={{ display: 'grid', gap: '0.5rem' }}>
            <p>
              <strong>Category:</strong>{' '}
              {categoryNameById[viewTarget.category_id] ?? viewTarget.category_id}
            </p>
            <p>
              <strong>Stream:</strong>{' '}
              {viewTarget.revenue_stream_id
                ? streamNameById[viewTarget.revenue_stream_id] ??
                  viewTarget.revenue_stream_id
                : '—'}
            </p>
            <p>
              <strong>Amount:</strong> {viewTarget.amount} {viewTarget.currency ?? ''}
            </p>
            <p>
              <strong>Frequency:</strong> {viewTarget.frequency}
            </p>
            <p>
              <strong>Frequency days:</strong> {viewTarget.frequency_days ?? '—'}
            </p>
            <p>
              <strong>Start date:</strong> {viewTarget.start_date ?? '—'}
            </p>
            <p>
              <strong>End date:</strong> {viewTarget.end_date ?? '—'}
            </p>
            <p>
              <strong>Active:</strong> {viewTarget.is_active ? 'Yes' : 'No'}
            </p>
          </div>
        )}
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Stream</th>
              <th>Amount</th>
              <th>Frequency</th>
              <th>Start</th>
              <th>End</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr key={row.id}>
                <td>{categoryNameById[row.category_id] ?? row.category_id}</td>
                <td>
                  {row.revenue_stream_id
                    ? streamNameById[row.revenue_stream_id] ?? row.revenue_stream_id
                    : '—'}
                </td>
                <td>
                  {row.amount} {row.currency ?? ''}
                </td>
                <td>{row.frequency}</td>
                <td>{row.start_date ?? '—'}</td>
                <td>{row.end_date ?? '—'}</td>
                <td>{row.is_active ? 'Yes' : 'No'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      style={iconBtnStyle}
                      title="View"
                      aria-label="View subscription package"
                      onClick={() => setViewTarget(row)}
                    >
                      <i className="fa fa-eye" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={iconBtnStyle}
                      title="Edit"
                      aria-label="Edit subscription package"
                      onClick={() => openEdit(row)}
                    >
                      <i className="fa fa-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ ...iconBtnStyle, color: '#ef4444' }}
                      title="Delete"
                      aria-label="Delete subscription package"
                      onClick={() => handleDelete(row.id)}
                    >
                      <i className="fa fa-trash" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--dashboard-muted, #64748b)' }}>
            {subscriptions.length === 0
              ? 'No subscription packages loaded.'
              : 'No subscription packages match this filter.'}
          </p>
        )}
        <DataTablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1)
            setPageSize(size)
          }}
        />
      </div>
    </>
  )
}

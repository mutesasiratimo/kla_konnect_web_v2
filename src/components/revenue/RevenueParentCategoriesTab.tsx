import React, { useMemo, useState } from 'react'
import type { RevenueCategoryRead } from '../../api/types'
import { revenueCategories as api } from '../../api/endpoints'
import { suggestedCodeFromCategoryName } from '../../utils/codeFromCategoryName'
import { DashboardDialog } from '../DashboardDialog'
import { DataTablePagination } from '../table/DataTablePagination'

interface RevenueParentCategoriesTabProps {
  categories: RevenueCategoryRead[]
  onRefresh: () => void | Promise<void>
}

type CatForm = { code: string; name: string; description: string }
const emptyCatForm = (): CatForm => ({ code: '', name: '', description: '' })

const iconBtn: React.CSSProperties = { width: 30, height: 30, padding: 0 }

export const RevenueParentCategoriesTab: React.FC<
  RevenueParentCategoriesTabProps
> = ({ categories, onRefresh }) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<RevenueCategoryRead | null>(null)
  const [form, setForm] = useState<CatForm>(emptyCatForm())
  const [saving, setSaving] = useState(false)
  /** While true, code updates from name on create; cleared when user edits code. */
  const [createCodeFollowsName, setCreateCodeFollowsName] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedCategories = useMemo(
    () =>
      categories.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [categories, currentPage],
  )

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
    setForm(emptyCatForm())
    setCreateCodeFollowsName(true)
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyCatForm())
    setCreateCodeFollowsName(true)
    setCreateOpen(true)
  }

  const openEdit = (row: RevenueCategoryRead) => {
    setCreateOpen(false)
    setEditTarget(row)
    setForm({
      code: row.code,
      name: row.name,
      description: row.description ?? '',
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      await api.create({
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not create parent category.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !form.code.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      await api.update(editTarget.id, {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      closeDialogs()
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not update parent category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this parent category?')) return
    try {
      await api.delete(id, false)
      await onRefresh()
    } catch (err) {
      console.error(err)
      window.alert('Could not delete parent category.')
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div className="dashboard-page-header-row" style={{ marginBottom: '1rem' }}>
        <p className="dashboard-page-lead" style={{ margin: 0 }}>
          Top-level revenue categories. Child categories are managed under{' '}
          <strong>Categories</strong> in the sidebar.
        </p>
        <button type="button" className="primary-button" onClick={openCreate}>
          + New parent category
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New parent category"
        titleId="revenue-parent-cat-create-title"
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Name *</span>
            <input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((f) => ({
                  ...f,
                  name,
                  ...(createCodeFollowsName
                    ? { code: suggestedCodeFromCategoryName(name) }
                    : {}),
                }))
              }}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Code *</span>
            <input
              value={form.code}
              onChange={(e) => {
                setCreateCodeFollowsName(false)
                setForm((f) => ({ ...f, code: e.target.value }))
              }}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
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
      </DashboardDialog>

      <DashboardDialog
        open={editTarget !== null}
        onClose={closeDialogs}
        title="Edit parent category"
        titleId="revenue-parent-cat-edit-title"
      >
        <form className="dashboard-dialog-form" onSubmit={handleUpdate}>
          <label className="dashboard-dialog-field">
            <span>Name *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Code *</span>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              required
            />
          </label>
          <label className="dashboard-dialog-field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <div className="dashboard-dialog-actions">
            <button type="button" className="secondary-button" onClick={closeDialogs}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              Update
            </button>
          </div>
        </form>
      </DashboardDialog>

      <div className="dashboard-table-shell">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedCategories.map((row) => (
              <tr key={row.id}>
                <td>{row.code}</td>
                <td>{row.name}</td>
                <td>{row.description || '—'}</td>
                <td>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.35rem',
                      alignItems: 'center',
                    }}
                  >
                    <button
                      type="button"
                      className="secondary-button"
                      style={iconBtn}
                      title="Edit"
                      aria-label="Edit parent category"
                      onClick={() => openEdit(row)}
                    >
                      <i className="fa fa-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ ...iconBtn, color: '#ef4444' }}
                      title="Delete"
                      aria-label="Delete parent category"
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
        {categories.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--dashboard-muted, #64748b)' }}>
            No parent categories yet.
          </p>
        )}
        <DataTablePagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={categories.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPage(1)
            setPageSize(size)
          }}
        />
      </div>
    </div>
  )
}

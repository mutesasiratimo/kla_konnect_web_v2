import React, { useState } from 'react'
import type { NewsCategoryRead } from '../../api/types'
import { newsCategories as api } from '../../api/endpoints'
import { DashboardDialog } from '../DashboardDialog'
import { DataTablePagination } from '../table/DataTablePagination'

interface NewsCategoriesProps {
  categories: NewsCategoryRead[]
  onRefresh: () => void
}

type FormState = {
  name: string
  description: string
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
})

export const NewsCategories: React.FC<NewsCategoriesProps> = ({
  categories,
  onRefresh,
}) => {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<NewsCategoryRead | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedCategories = categories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm())
    setCreateOpen(true)
  }

  const openEdit = (row: NewsCategoryRead) => {
    setCreateOpen(false)
    setEditTarget(row)
    setForm({
      name: row.name,
      description: row.description ?? '',
    })
  }

  const closeDialogs = () => {
    setCreateOpen(false)
    setEditTarget(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await api.create({
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      closeDialogs()
      await onRefresh()
    } catch (error) {
      console.error(error)
      window.alert('Could not create news category.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget || !form.name.trim()) return
    setSaving(true)
    try {
      await api.update(editTarget.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
      })
      closeDialogs()
      await onRefresh()
    } catch (error) {
      console.error(error)
      window.alert('Could not update news category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Archive this news category?')) return
    try {
      await api.delete(id)
      await onRefresh()
    } catch (error) {
      console.error(error)
      window.alert('Could not archive news category.')
    }
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="dashboard-page-header-row" style={{ marginBottom: '1rem' }}>
        <button type="button" className="primary-button" onClick={openCreate}>
          + New category
        </button>
      </div>

      <DashboardDialog
        open={createOpen}
        onClose={closeDialogs}
        title="New news category"
        titleId="news-category-create-title"
      >
        <form className="dashboard-dialog-form" onSubmit={handleCreate}>
          <label className="dashboard-dialog-field">
            <span>Name *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
        title="Edit news category"
        titleId="news-category-edit-title"
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
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedCategories.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.description || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ width: 30, height: 30, padding: 0 }}
                      title="View"
                      aria-label="View category"
                      onClick={() =>
                        window.alert(
                          `${row.name}\n\n${row.description || 'No description'}`,
                        )
                      }
                    >
                      <i className="fa fa-eye" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ width: 30, height: 30, padding: 0 }}
                      title="Edit"
                      aria-label="Edit category"
                      onClick={() => openEdit(row)}
                    >
                      <i className="fa fa-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ width: 30, height: 30, padding: 0, color: '#ef4444' }}
                      title="Archive"
                      aria-label="Archive category"
                      onClick={() => handleDelete(row.id)}
                    >
                      <i className="fa fa-archive" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <p style={{ padding: '1rem', color: 'var(--dashboard-muted, #64748b)' }}>
            No news categories yet.
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
